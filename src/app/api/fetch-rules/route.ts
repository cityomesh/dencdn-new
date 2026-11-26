// app/api/fetch-rules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'ssh2';

interface Rule {
  id: number;
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

// ✅ NEW: Connection timeout constants (fast fail)
const CONNECT_TIMEOUT_MS = 5000;   // 5s (was 10s)
const EXEC_TIMEOUT_MS = 8000;      // 8s for command execution
const TOTAL_TIMEOUT_MS = 15000;    // 15s hard limit per server

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

    const rulesData = await fetchRulesViaSSH(
      ipAddress,
      sshUsername,
      sshPassword,
      sshPort
    );

    if (!rulesData) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch rules.conf or empty data',
          data: { routes: [] },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rules fetched successfully',
      data: rulesData,
    });
  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        data: { routes: [], error: errorMessage },
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
    let resolved = false;
    let hardTimeout: NodeJS.Timeout | null = null;

    // ✅ Helper: ఒక్కసారి మాత్రమే resolve అవ్వాలి
    const safeResolve = (data: RulesData) => {
      if (resolved) return;
      resolved = true;
      if (hardTimeout) clearTimeout(hardTimeout);
      try {
        conn.end();
      } catch {
        // ignore
      }
      resolve(data);
    };

    // ✅ Hard timeout — ఏదైనా hang అయితే 15s లో fail
    hardTimeout = setTimeout(() => {
      console.error(`Hard timeout for ${ipAddress} after ${TOTAL_TIMEOUT_MS}ms`);
      safeResolve({
        routes: [],
        error: `Timeout after ${TOTAL_TIMEOUT_MS / 1000}s`,
      });
    }, TOTAL_TIMEOUT_MS);

    conn.on('ready', () => {
      console.log(`SSH Connected to ${ipAddress}`);

      // ✅ Exec timeout — command hang అయితే
      const execTimeout = setTimeout(() => {
        console.error(`Exec timeout for ${ipAddress}`);
        safeResolve({
          routes: [],
          error: `Command timeout after ${EXEC_TIMEOUT_MS / 1000}s`,
        });
      }, EXEC_TIMEOUT_MS);

      conn.exec('cat /etc/nimble/rules.conf', (err, stream) => {
        if (err) {
          clearTimeout(execTimeout);
          console.error('SSH exec error:', err);
          safeResolve({
            routes: [],
            error: `SSH exec error: ${err.message}`,
          });
          return;
        }

        let data = '';
        let dataLimitReached = false;

        stream.on('data', (chunk: Buffer) => {
          // ✅ Safety: 5MB కంటే ఎక్కువ ఉంటే ఆపు (malformed file protection)
          if (data.length > 5 * 1024 * 1024) {
            dataLimitReached = true;
            stream.destroy();
            return;
          }
          data += chunk.toString();
        });

        stream.on('close', (code: number | null) => {
          clearTimeout(execTimeout);

          if (dataLimitReached) {
            safeResolve({
              routes: [],
              error: 'File too large (>5MB)',
            });
            return;
          }

          if (code && code !== 0) {
            console.error(`SSH command failed with code ${code}`);
            safeResolve({
              routes: [],
              error: `Command failed with code ${code}`,
            });
            return;
          }

          console.log(`Received ${data.length} bytes from ${ipAddress}`);

          try {
            const jsonStart = data.indexOf('{');
            if (jsonStart === -1) {
              safeResolve({
                routes: [],
                error: 'No JSON found in rules.conf',
              });
              return;
            }
            const cleanedData = data.substring(jsonStart).trim();

            if (!cleanedData) {
              safeResolve({
                routes: [],
                error: 'Empty rules.conf file',
              });
              return;
            }

            const parsedData = JSON.parse(cleanedData) as SyncResponse;

            if (parsedData.SyncResponse?.Routes) {
              safeResolve({
                routes: (parsedData.SyncResponse.Routes as Rule[]).map(
                  (route, index) => ({
                    ...route,
                    id: index + 1,
                  })
                ),
              });
            } else if (Array.isArray(parsedData)) {
              safeResolve({
                routes: (parsedData as Rule[]).map((route, index) => ({
                  ...route,
                  id: index + 1,
                })),
              });
            } else if (parsedData.Routes) {
              safeResolve({
                routes: (parsedData.Routes as Rule[]).map((route, index) => ({
                  ...route,
                  id: index + 1,
                })),
              });
            } else {
              safeResolve({
                routes: [],
                error: 'Invalid JSON structure in rules.conf',
              });
            }
          } catch (parseError: unknown) {
            console.error('JSON parse error:', parseError);
            console.log('Raw data received:', data.substring(0, 500));
            const errorMessage =
              parseError instanceof Error
                ? parseError.message
                : 'Unknown parse error';
            safeResolve({
              routes: [],
              error: `JSON parse error: ${errorMessage}. Data: ${data.substring(
                0,
                200
              )}...`,
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
      safeResolve({
        routes: [],
        error: `SSH connection error: ${err.message}`,
      });
    });

    conn.on('timeout', () => {
      console.error(`SSH connection timeout to ${ipAddress}`);
      safeResolve({
        routes: [],
        error: 'SSH connection timeout',
      });
    });

    conn.connect({
      host: ipAddress,
      port: sshPort,
      username: sshUsername,
      password: sshPassword,
      readyTimeout: CONNECT_TIMEOUT_MS, // ✅ 5s (was 10s)
      keepaliveInterval: 0,             // ✅ disable (short connection)
      keepaliveCountMax: 0,
    });
  });
}
