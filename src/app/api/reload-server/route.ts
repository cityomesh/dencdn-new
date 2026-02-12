
import { NextRequest, NextResponse } from "next/server";

interface SSHError {
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Dynamic import only when API runs
    const { NodeSSH } = await import("node-ssh");
    const ssh = new NodeSSH();

    const body = await req.json();
    const {
      serverId,
      ipAddress,
      port,
      sshUsername,
      sshPassword,
      serviceName,
    }: {
      serverId: string;
      ipAddress: string;
      port?: number;
      sshUsername: string;
      sshPassword: string;
      serviceName: string;
    } = body;

    if (!serverId || !ipAddress || !sshUsername || !sshPassword || !serviceName) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    await ssh.connect({
      host: ipAddress,
      username: sshUsername,
      password: sshPassword,
      port: port || 22,
    });

    const command = `sudo service ${serviceName} restart`;
    const result = await ssh.execCommand(command);
    ssh.dispose();

    if (result.stderr) {
      return NextResponse.json({ success: false, error: result.stderr }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      output: `Command "${command}" executed successfully on ${ipAddress}`,
    });
  } catch (err: unknown) {
    const error = err as SSHError;
    return NextResponse.json(
      { success: false, error: error.message || "SSH restart failed" },
      { status: 500 }
    );
  }
}

