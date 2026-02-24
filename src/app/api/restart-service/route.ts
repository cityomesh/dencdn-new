// app/api/restart-service/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client } from 'ssh2';

interface ErrorWithMessage {
  message: string;
  stack?: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Unknown error occurred';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ipAddress,
      port = 22,
      sshUsername,
      sshPassword,
      serviceName = "nimble"
    } = body;

    if (!ipAddress || !sshUsername || !sshPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const result = await restartServiceWithSSH2(
      ipAddress, 
      port, 
      sshUsername, 
      sshPassword, 
      serviceName
    );

    return NextResponse.json({
      success: true,
      message: result
    });

  } catch (error: unknown) { // 'any' ని 'unknown' గా మార్చాను
    console.error("Restart service error:", error);
    
    const errorMessage = getErrorMessage(error);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function restartServiceWithSSH2(
  host: string,
  port: number,
  username: string,
  password: string,
  serviceName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      console.log(`SSH Connected to ${host}:${port}`);
      
      // Escape single quotes in password to prevent command injection
      const escapedPassword = password.replace(/'/g, "'\\''");
      
      // Most reliable method: echo password to sudo -S
      const command = `echo '${escapedPassword}' | sudo -S service ${serviceName} restart`;
      
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        
        let output = '';
        let errorOutput = '';
        
        stream.on('close', (code: number | null) => {
          conn.end();
          
          if (code === 0) {
            resolve(output || `${serviceName} restarted successfully`);
          } else {
            // Check if it's a password error
            if (errorOutput.includes('sudo: a terminal is required') || 
                errorOutput.includes('incorrect password')) {
              reject(new Error(`Sudo password failed: ${errorOutput}`));
            } else {
              reject(new Error(errorOutput || `Command failed with code ${code}`));
            }
          }
        });
        
        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
      });
    });
    
    conn.on('error', (err) => {
      reject(new Error(`SSH connection failed: ${err.message}`));
    });
    
    conn.connect({
      host,
      port,
      username,
      password,
      readyTimeout: 10000,
      keepaliveInterval: 10000
    });
  });
}
