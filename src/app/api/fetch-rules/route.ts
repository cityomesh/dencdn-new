// app/api/fetch-rules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'ssh2';

// Define proper types
interface Rule {
  id: number;
  // 'any' badulu 'unknown' vaadi linting error fix chesam
  [key: string]: unknown; 
}

interface RulesData {
  routes: Rule[];
  error?: string;
}

interface SyncResponse {
  SyncResponse?: {
    Routes?: Rule[];
  };
  Routes?: Rule[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipAddress, sshUsername, sshPassword, sshPort = 22 } = body;

    console.log(`Connecting to SSH: ${sshUsername}@${ipAddress}:${sshPort}`);

    if (!ipAddress || !sshUsername || !sshPassword) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect via SSH and fetch rules.conf
    const rulesData = await fetchRulesViaSSH(ipAddress, sshUsername, sshPassword, sshPort);

    if (!rulesData) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to fetch rules.conf or empty data',
          data: { routes: [] }
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rules fetched successfully',
      data: rulesData
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        data: { routes: [], error: errorMessage }
      },
      { status: 500 }
    );
  }
}

async function fetchRulesViaSSH(
  ipAddress: string, 
  sshUsername: string, 
  sshPassword: string, 
  sshPort: number
): Promise<RulesData | null> {
  return new Promise((resolve) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      console.log(`SSH Connected to ${ipAddress}`);
      
      conn.exec('cat /etc/nimble/rules.conf', (err, stream) => {
        if (err) {
          conn.end();
          console.error('SSH exec error:', err);
          resolve({ routes: [], error: `SSH exec error: ${err.message}` });
          return;
        }
        
        let data = '';
        
        stream.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        
        stream.on('close', (code: number | null) => {
          conn.end();
          
          if (code && code !== 0) {
            console.error(`SSH command failed with code ${code}`);
            resolve({ routes: [], error: `Command failed with code ${code}` });
            return;
          }
          
          console.log(`Received ${data.length} bytes from ${ipAddress}`);
          
          try {
            // Parse the rules.conf content
            // First, remove the comment line
            const cleanedData = data.replace(/\/\*.*?\*\//g, '').trim();
            
            if (!cleanedData) {
              resolve({ routes: [], error: 'Empty rules.conf file' });
              return;
            }
            
            const parsedData = JSON.parse(cleanedData) as SyncResponse;
            
            // Extract routes from the JSON structure
            if (parsedData.SyncResponse?.Routes) {
              resolve({
                routes: (parsedData.SyncResponse.Routes as Rule[]).map((route, index) => ({
                  ...route,
                  id: index + 1
                }))
              });
            } else if (Array.isArray(parsedData)) {
              resolve({
                routes: (parsedData as Rule[]).map((route, index) => ({
                  ...route,
                  id: index + 1
                }))
              });
            } else if (parsedData.Routes) {
              resolve({
                routes: (parsedData.Routes as Rule[]).map((route, index) => ({
                  ...route,
                  id: index + 1
                }))
              });
            } else {
              resolve({ routes: [], error: 'Invalid JSON structure in rules.conf' });
            }
            
          } catch (parseError: unknown) {
            console.error('JSON parse error:', parseError);
            console.log('Raw data received:', data.substring(0, 500));
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
            resolve({ 
              routes: [], 
              error: `JSON parse error: ${errorMessage}. Data: ${data.substring(0, 200)}...` 
            });
          }
        });
        
        stream.stderr.on('data', (stderrData: Buffer) => {
          console.error('SSH stderr:', stderrData.toString());
        });
      });
    });
    
    conn.on('error', (err: Error) => {
      console.error(`SSH connection error to ${ipAddress}:`, err);
      resolve({ 
        routes: [], 
        error: `SSH connection error: ${err.message}` 
      });
    });
    
    conn.on('timeout', () => {
      console.error(`SSH connection timeout to ${ipAddress}`);
      conn.end();
      resolve({ 
        routes: [], 
        error: 'SSH connection timeout' 
      });
    });
    
    // Set timeout for connection
    conn.connect({
      host: ipAddress,
      port: sshPort,
      username: sshUsername,
      password: sshPassword,
      readyTimeout: 10000, // 10 seconds
      keepaliveInterval: 10000
    });
  });
}
