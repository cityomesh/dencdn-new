// app/api/read-rules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NodeSSH } from 'node-ssh';

interface RuleEntry {
  request: string;
  redirect: string;
  assignedServer: string;
  sourceServer: string;
  source: string;
  streamType: string;
}

interface SSHConnectionParams {
  ipAddress: string;
  sshUsername: string;
  sshPassword: string;
  port?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SSHConnectionParams;
    const { ipAddress, sshUsername, sshPassword, port } = body;
    
    if (!ipAddress || !sshUsername || !sshPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const ssh = new NodeSSH();
    
    await ssh.connect({
      host: ipAddress,
      username: sshUsername,
      password: sshPassword,
      port: port || 22,
    });

    // Read rules.conf file
    const result = await ssh.execCommand('cat /etc/nimble/rules.conf');
    
    if (result.stderr) {
      return NextResponse.json(
        { success: false, error: result.stderr },
        { status: 500 }
      );
    }

    ssh.dispose();

    // Parse rules.conf content
    const rulesContent = result.stdout;
    const rules: RuleEntry[] = [];
    
    const lines = rulesContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const request = parts[0];
        const redirect = parts[2] || parts[1];
        const streamType = parts[1] || 'UNDEFINED';
        
        // Extract IP from redirect URL
        const urlMatch = redirect.match(/https?:\/\/([^:\/]+)/);
        const assignedServer = urlMatch ? urlMatch[1] : redirect;
        
        rules.push({
          request,
          redirect,
          assignedServer,
          sourceServer: ipAddress,
          source: "rules.conf",
          streamType: streamType.toUpperCase()
        });
      }
    });

    return NextResponse.json({
      success: true,
      rules,
      total: rules.length
    });

  } catch (err: unknown) {
    console.error("Error reading rules:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to read rules";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
