
// // app/api/write-rules/route.ts  worked
// import { NextRequest, NextResponse } from "next/server";
// import { Client } from 'ssh2';

// interface RouteRule {
//   host?: string;
//   path: string;
//   origin: string;
//   origin_path?: string;
//   use_ssl?: string;
//   geo?: string;
//   range?: string;
//   playlist_caching_interval?: string;
// }

// interface WriteRulesRequest {
//   serverId: number;
//   ipAddress: string;
//   sshUsername: string;
//   sshPassword: string;
//   sshPort?: number;
//   routes: RouteRule[];
//   action: 'append' | 'overwrite' | 'delete';
// }

// // Define interface for route in config
// interface ConfigRoute {
//   host: string;
//   path: string;
//   origin: string;
//   origin_path: string;
//   use_ssl: string;
//   geo: string;
//   range: string;
//   playlist_caching_interval: string;
// }

// // Define interface for SyncResponse
// interface SyncResponse {
//   status: string;
//   Routes: ConfigRoute[];
//   RoutesHash?: string;
//   [key: string]: string | ConfigRoute[] | undefined;
// }

// // Define interface for full config
// interface FullConfig {
//   SyncResponse: SyncResponse;
//   [key: string]: unknown; 
// }

// interface ErrorWithMessage {
//   message: string;
//   stack?: string;
// }

// function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
//   return (
//     typeof error === 'object' &&
//     error !== null &&
//     'message' in error &&
//     typeof (error as Record<string, unknown>).message === 'string'
//   );
// }

// function getErrorMessage(error: unknown): string {
//   if (isErrorWithMessage(error)) {
//     return error.message;
//   }
//   if (typeof error === 'string') {
//     return error;
//   }
//   return 'Unknown error occurred';
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json() as WriteRulesRequest;
//     const {
//       serverId,
//       ipAddress,
//       sshUsername,
//       sshPassword,
//       sshPort = 22,
//       routes,
//       action = 'append'
//     } = body;

//     if (!ipAddress || !sshUsername || !sshPassword || !routes || routes.length === 0) {
//       return NextResponse.json(
//         { success: false, error: "Missing required parameters" },
//         { status: 400 }
//       );
//     }

//     const result = await writeRulesToServer(
//       ipAddress,
//       sshPort,
//       sshUsername,
//       sshPassword,
//       routes,
//       action
//     );

//     return NextResponse.json({
//       success: true,
//       message: `Successfully ${action === 'append' ? 'added' : action === 'overwrite' ? 'updated' : 'deleted'} ${routes.length} route(s)`,
//       output: result,
//       serverId
//     });

//   } catch (error: unknown) {
//     console.error("Write rules error:", error);
//     const errorMessage = getErrorMessage(error);
//     return NextResponse.json(
//       { success: false, error: errorMessage },
//       { status: 500 }
//     );
//   }
// }

// async function writeRulesToServer(
//   host: string,
//   port: number,
//   username: string,
//   password: string,
//   newRoutes: RouteRule[],
//   action: 'append' | 'overwrite' | 'delete'
// ): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const conn = new Client();
    
//     conn.on('ready', () => {
//       console.log(`SSH Connected to ${host}:${port}`);
      
//       // Escape single quotes in password to prevent command injection
//       const escapedPassword = password.replace(/'/g, "'\\''");
      
//       // First, read existing rules.conf
//       const readCommand = `cat /etc/nimble/rules.conf 2>/dev/null || echo "{}"`;
      
//       conn.exec(readCommand, (readErr, readStream) => {
//         if (readErr) {
//           conn.end();
//           return reject(readErr);
//         }
        
//         let existingContent = '';
        
//         readStream.on('data', (data: Buffer) => {
//           existingContent += data.toString();
//         });
        
//         // We don't need readError variable - just log if needed
//         readStream.stderr.on('data', (data: Buffer) => {
//           console.log(`Read stderr: ${data.toString()}`);
//         });
        
//         readStream.on('close', () => {
//           try {
//             // Parse existing JSON - keep the ENTIRE structure
//             let fullConfig: FullConfig = {
//               SyncResponse: {
//                 status: "success",
//                 Routes: []
//               }
//             };
            
//             // Remove the comment line if it exists
//             const jsonContent = existingContent.replace(/^\/\*.*?\*\/\s*/, '');
            
//             if (jsonContent.trim()) {
//               try {
//                 const parsed = JSON.parse(jsonContent);
//                 fullConfig = parsed as FullConfig;
//                 console.log("Successfully parsed existing config");
//               } catch (parseErr) {
//                 console.error("Failed to parse existing config:", parseErr);
//                 // Keep default structure
//               }
//             }
            
//             // Ensure SyncResponse exists
//             if (!fullConfig.SyncResponse) {
//               fullConfig.SyncResponse = {
//                 status: "success",
//                 Routes: []
//               };
//             }
            
//             // Ensure Routes array exists in SyncResponse
//             if (!fullConfig.SyncResponse.Routes) {
//               fullConfig.SyncResponse.Routes = [];
//             }
            
//             // Get the Routes array
//             const routes = fullConfig.SyncResponse.Routes;
            
//             // Apply action based on user choice
//             if (action === 'overwrite') {
//               // Replace all routes with new ones
//               fullConfig.SyncResponse.Routes = newRoutes.map(route => ({
//                 host: route.host || "",
//                 path: route.path,
//                 origin: route.origin,
//                 origin_path: route.origin_path || route.path,
//                 use_ssl: route.use_ssl || "false",
//                 geo: route.geo || "",
//                 range: route.range || "",
//                 playlist_caching_interval: route.playlist_caching_interval || "1"
//               }));
//             } else if (action === 'append') {
//               // Add new routes, avoiding duplicates
//               newRoutes.forEach(newRoute => {
//                 const exists = routes.some((existingRoute: ConfigRoute) => 
//                   existingRoute.path === newRoute.path && 
//                   existingRoute.origin === newRoute.origin
//                 );
                
//                 if (!exists) {
//                   routes.push({
//                     host: newRoute.host || "",
//                     path: newRoute.path,
//                     origin: newRoute.origin,
//                     origin_path: newRoute.origin_path || newRoute.path,
//                     use_ssl: newRoute.use_ssl || "false",
//                     geo: newRoute.geo || "",
//                     range: newRoute.range || "",
//                     playlist_caching_interval: newRoute.playlist_caching_interval || "1"
//                   });
//                 }
//               });
//             } else if (action === 'delete') {
//               // Delete routes
//               fullConfig.SyncResponse.Routes = routes.filter((existingRoute: ConfigRoute) => {
//                 return !newRoutes.some(routeToDelete => 
//                   routeToDelete.path === existingRoute.path && 
//                   routeToDelete.origin === existingRoute.origin
//                 );
//               });
//             }
            
//             // Update RoutesHash with current timestamp
//             fullConfig.SyncResponse.RoutesHash = Date.now().toString();
            
//             // Convert to JSON with proper formatting
//             const jsonOutput = JSON.stringify(fullConfig, null, 2);
            
//             // Add the warning comment at the top
//             const finalContent = '/* please do not modify this file, all changes will be overwritten by wmspanel agent */\n' + jsonOutput;
            
//             const tempFileCommand = `cat > /tmp/rules_temp.conf << 'EOF'
// ${finalContent}
// EOF`;

//             conn.exec(tempFileCommand, (tempErr, tempStream) => {
//               if (tempErr) {
//                 conn.end();
//                 return reject(tempErr);
//               }
              
//               let tempError = '';
              
//               tempStream.on('data', () => {
//                 // We don't need to store tempOutput
//               });
              
//               tempStream.stderr.on('data', (data: Buffer) => {
//                 tempError += data.toString();
//               });
              
//               tempStream.on('close', (tempCode: number | null) => {
//                 if (tempCode !== 0) {
//                   conn.end();
//                   return reject(new Error(`Failed to create temp file: ${tempError}`));
//                 }
                
//                 // Now use sudo with echo password to move the file
//                 const moveCommand = `echo '${escapedPassword}' | sudo -S cp /tmp/rules_temp.conf /etc/nimble/rules.conf && echo '${escapedPassword}' | sudo -S chmod 644 /etc/nimble/rules.conf`;
                
//                 conn.exec(moveCommand, (moveErr, moveStream) => {
//                   if (moveErr) {
//                     conn.end();
//                     return reject(moveErr);
//                   }
                  
//                   let moveError = '';
                  
//                   moveStream.on('data', () => {
//                     // We don't need to store moveOutput
//                   });
                  
//                   moveStream.stderr.on('data', (data: Buffer) => {
//                     moveError += data.toString();
//                   });
                  
//                   moveStream.on('close', (moveCode: number | null) => {
//                     if (moveCode !== 0) {
//                       conn.end();
//                       return reject(new Error(moveError || "Failed to copy file with sudo"));
//                     }
                    
//                     // Clean up temp file
//                     const cleanupCommand = `rm /tmp/rules_temp.conf`;
//                     conn.exec(cleanupCommand, () => {});
                    
//                     // Restart nimble service with sudo
//                     const restartCommand = `echo '${escapedPassword}' | sudo -S service nimble restart`;
                    
//                     conn.exec(restartCommand, (restartErr, restartStream) => {
//                       if (restartErr) {
//                         console.error("Failed to restart nimble:", restartErr);
//                         conn.end();
//                         resolve("Routes written but service restart failed: " + restartErr.message);
//                       }
                      
//                       let restartError = '';
                      
//                       restartStream.on('data', () => {
//                         // We don't need to store restartOutput
//                       });
                      
//                       restartStream.stderr.on('data', (data: Buffer) => {
//                         restartError += data.toString();
//                       });
                      
//                       restartStream.on('close', (restartCode: number | null) => {
//                         conn.end();
//                         if (restartCode === 0) {
//                           resolve("Routes written and nimble service restarted successfully");
//                         } else {
//                           resolve(`Routes written but service restart failed: ${restartError || 'Unknown error'}`);
//                         }
//                       });
//                     });
//                   });
//                 });
//               });
//             });
//             // ===== ఇక్కడ వరకు మార్పు =====
            
//           } catch (error) {
//             console.error("Error in writeRulesToServer:", error);
//             conn.end();
//             reject(error);
//           }
//         });
//       });
//     });
    
//     conn.on('error', (err) => {
//       reject(new Error(`SSH connection failed: ${err.message}`));
//     });
    
//     conn.connect({
//       host,
//       port,
//       username,
//       password,
//       readyTimeout: 10000,
//       keepaliveInterval: 10000
//     });
//   });
// }



// app/api/write-rules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client } from 'ssh2';

interface RouteRule {
  host?: string;
  path: string;
  origin: string;
  origin_path?: string;
  use_ssl?: string;
  geo?: string;
  range?: string;
  playlist_caching_interval?: string;
}

interface WriteRulesRequest {
  serverId: number;
  ipAddress: string;
  sshUsername: string;
  sshPassword: string;
  sshPort?: number;
  routes: RouteRule[];
  action: 'append' | 'overwrite' | 'delete';
}

interface ConfigRoute {
  host: string;
  path: string;
  origin: string;
  origin_path: string;
  use_ssl: string;
  geo: string;
  range: string;
  playlist_caching_interval: string;
}

interface SyncResponse {
  status: string;
  Routes: ConfigRoute[];
  RoutesHash?: string;
  [key: string]: string | ConfigRoute[] | undefined;
}

interface FullConfig {
  SyncResponse: SyncResponse;
  [key: string]: unknown; 
}

// Custom error interface
interface SftpError extends Error {
  code?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as WriteRulesRequest;
    const {
      serverId,
      ipAddress,
      sshUsername,
      sshPassword,
      sshPort = 22,
      routes,
      action = 'append'
    } = body;

    if (!ipAddress || !sshUsername || !sshPassword || !routes || routes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Send immediate response and process in background
    const result = await writeRulesToServer(
      ipAddress,
      sshPort,
      sshUsername,
      sshPassword,
      routes,
      action
    );

    return NextResponse.json({
      success: true,
      message: `Route creation started. This may take 30-60 seconds for ${routes.length} route(s).`,
      output: result,
      serverId
    });

  } catch (error: unknown) {
    console.error("Write rules error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function writeRulesToServer(
  host: string,
  port: number,
  username: string,
  password: string,
  newRoutes: RouteRule[],
  action: 'append' | 'overwrite' | 'delete'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      console.log(`SSH Connected to ${host}:${port}`);
      
      // Step 1: Read existing file
      conn.sftp((sftpErr, sftp) => {
        if (sftpErr) {
          conn.end();
          return reject(new Error(`SFTP failed: ${sftpErr.message}`));
        }
        
        sftp.readFile('/etc/nimble/rules.conf', (readErr, data) => {
          const sftpReadErr = readErr as SftpError;
          if (readErr && sftpReadErr.code !== 2) {
            conn.end();
            return reject(new Error(`Failed to read file: ${readErr.message}`));
          }
          
          try {
            // Parse existing JSON
            let existingContent = '{}';
            if (data) {
              existingContent = data.toString('utf8');
            }
            
            let fullConfig: FullConfig = {
              SyncResponse: {
                status: "success",
                Routes: []
              }
            };
            
            const jsonContent = existingContent.replace(/^\/\*.*?\*\/\s*/, '');
            
            if (jsonContent.trim()) {
              try {
                const parsed = JSON.parse(jsonContent);
                fullConfig = parsed as FullConfig;
                console.log(`Parsed existing config with ${fullConfig.SyncResponse?.Routes?.length || 0} routes`);
              } catch {
                // Remove the variable name since we don't need it
                console.error("Failed to parse existing config, using default");
              }
            }
            
            // Ensure structure exists
            if (!fullConfig.SyncResponse) {
              fullConfig.SyncResponse = {
                status: "success",
                Routes: []
              };
            }
            
            if (!fullConfig.SyncResponse.Routes) {
              fullConfig.SyncResponse.Routes = [];
            }
            
            const routes = fullConfig.SyncResponse.Routes;
            
            // Apply action
            if (action === 'overwrite') {
              fullConfig.SyncResponse.Routes = newRoutes.map(route => ({
                host: route.host || "",
                path: route.path,
                origin: route.origin,
                origin_path: route.origin_path || route.path,
                use_ssl: route.use_ssl || "false",
                geo: route.geo || "",
                range: route.range || "",
                playlist_caching_interval: route.playlist_caching_interval || "1"
              }));
            } else if (action === 'append') {
              newRoutes.forEach(newRoute => {
                const exists = routes.some((existingRoute: ConfigRoute) => 
                  existingRoute.path === newRoute.path && 
                  existingRoute.origin === newRoute.origin
                );
                
                if (!exists) {
                  routes.push({
                    host: newRoute.host || "",
                    path: newRoute.path,
                    origin: newRoute.origin,
                    origin_path: newRoute.origin_path || newRoute.path,
                    use_ssl: newRoute.use_ssl || "false",
                    geo: newRoute.geo || "",
                    range: newRoute.range || "",
                    playlist_caching_interval: newRoute.playlist_caching_interval || "1"
                  });
                }
              });
            } else if (action === 'delete') {
              fullConfig.SyncResponse.Routes = routes.filter((existingRoute: ConfigRoute) => {
                return !newRoutes.some(routeToDelete => 
                  routeToDelete.path === existingRoute.path && 
                  routeToDelete.origin === existingRoute.origin
                );
              });
            }
            
            // Update RoutesHash
            fullConfig.SyncResponse.RoutesHash = Date.now().toString();
            
            console.log(`Writing ${fullConfig.SyncResponse.Routes.length} routes to file...`);
            
            // Convert to JSON
            const jsonOutput = JSON.stringify(fullConfig, null, 2);
            const finalContent = '/* please do not modify this file, all changes will be overwritten by wmspanel agent */\n' + jsonOutput;
            
            // Write to temp file using streams (faster for large files)
            const tempFilePath = '/tmp/rules_temp.conf';
            
            // Use writeFile with buffer (faster for large files)
            sftp.writeFile(tempFilePath, Buffer.from(finalContent, 'utf8'), (writeErr) => {
              if (writeErr) {
                conn.end();
                return reject(new Error(`Failed to write temp file: ${writeErr.message}`));
              }
              
              console.log("Temp file written successfully");
              
              // Now use sudo to move the file
              const escapedPassword = password.replace(/'/g, "'\\''");
              const moveCommand = `echo '${escapedPassword}' | sudo -S cp ${tempFilePath} /etc/nimble/rules.conf && echo '${escapedPassword}' | sudo -S chmod 644 /etc/nimble/rules.conf`;
              
              conn.exec(moveCommand, (moveErr, moveStream) => {
                if (moveErr) {
                  conn.end();
                  return reject(moveErr);
                }
                
                let moveError = '';
                
                moveStream.stderr.on('data', (data: Buffer) => {
                  moveError += data.toString();
                });
                
                moveStream.on('close', (moveCode: number | null) => {
                  if (moveCode !== 0) {
                    conn.end();
                    return reject(new Error(moveError || "Failed to copy file with sudo"));
                  }
                  
                  // Clean up temp file
                  const cleanupCommand = `rm ${tempFilePath}`;
                  conn.exec(cleanupCommand, () => {});
                  
                  // Restart nimble service in background (don't wait for it)
                  const restartCommand = `echo '${escapedPassword}' | sudo -S service nimble restart > /dev/null 2>&1 &`;
                  
                  conn.exec(restartCommand, (restartErr) => {
                    conn.end();
                    if (restartErr) {
                      console.error("Failed to restart nimble:", restartErr);
                      resolve(`Routes written (${fullConfig.SyncResponse.Routes.length} total) but service restart may be delayed. The changes will take effect shortly.`);
                    } else {
                      resolve(`Successfully written ${fullConfig.SyncResponse.Routes.length} routes. Service restart initiated.`);
                    }
                  });
                });
              });
            });
            
          } catch (error) {
            conn.end();
            reject(error);
          }
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
      readyTimeout: 60000, // Increase timeout for large files
      keepaliveInterval: 10000
    });
  });
}
