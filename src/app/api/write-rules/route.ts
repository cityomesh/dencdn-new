// // app/api/write-rules/route.ts
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

// interface SyncResponse {
//   status: string;
//   Routes: ConfigRoute[];
//   RoutesHash?: string;
//   [key: string]: string | ConfigRoute[] | undefined;
// }

// interface FullConfig {
//   SyncResponse: SyncResponse;
//   [key: string]: unknown; 
// }

// // Custom error interface
// interface SftpError extends Error {
//   code?: number;
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

//     // Send immediate response and process in background
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
//       message: `Route creation started. This may take 30-60 seconds for ${routes.length} route(s).`,
//       output: result,
//       serverId
//     });

//   } catch (error: unknown) {
//     console.error("Write rules error:", error);
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
      
//       // Step 1: Read existing file
//       conn.sftp((sftpErr, sftp) => {
//         if (sftpErr) {
//           conn.end();
//           return reject(new Error(`SFTP failed: ${sftpErr.message}`));
//         }
        
//         sftp.readFile('/etc/nimble/rules.conf', (readErr, data) => {
//           const sftpReadErr = readErr as SftpError;
//           if (readErr && sftpReadErr.code !== 2) {
//             conn.end();
//             return reject(new Error(`Failed to read file: ${readErr.message}`));
//           }
          
//           try {
//             // Parse existing JSON
//             let existingContent = '{}';
//             if (data) {
//               existingContent = data.toString('utf8');
//             }
            
//             let fullConfig: FullConfig = {
//               SyncResponse: {
//                 status: "success",
//                 Routes: []
//               }
//             };
            
//             const jsonContent = existingContent.replace(/^\/\*.*?\*\/\s*/, '');
            
//             if (jsonContent.trim()) {
//               try {
//                 const parsed = JSON.parse(jsonContent);
//                 fullConfig = parsed as FullConfig;
//                 console.log(`Parsed existing config with ${fullConfig.SyncResponse?.Routes?.length || 0} routes`);
//               } catch {
//                 // Remove the variable name since we don't need it
//                 console.error("Failed to parse existing config, using default");
//               }
//             }
            
//             // Ensure structure exists
//             if (!fullConfig.SyncResponse) {
//               fullConfig.SyncResponse = {
//                 status: "success",
//                 Routes: []
//               };
//             }
            
//             if (!fullConfig.SyncResponse.Routes) {
//               fullConfig.SyncResponse.Routes = [];
//             }
            
//             const routes = fullConfig.SyncResponse.Routes;
            
//             // Apply action
//             if (action === 'overwrite') {
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
//               fullConfig.SyncResponse.Routes = routes.filter((existingRoute: ConfigRoute) => {
//                 return !newRoutes.some(routeToDelete => 
//                   routeToDelete.path === existingRoute.path && 
//                   routeToDelete.origin === existingRoute.origin
//                 );
//               });
//             }
            
//             // Update RoutesHash
//             fullConfig.SyncResponse.RoutesHash = Date.now().toString();
            
//             console.log(`Writing ${fullConfig.SyncResponse.Routes.length} routes to file...`);
            
//             // Convert to JSON
//             const jsonOutput = JSON.stringify(fullConfig, null, 2);
//             const finalContent = '/* please do not modify this file, all changes will be overwritten by wmspanel agent */\n' + jsonOutput;
            
//             // Write to temp file using streams (faster for large files)
//             //const tempFilePath = '/tmp/rules_temp.conf';
//             const tempFilePath = `/home/${username}/rules_temp.conf`; 
            
//             // Use writeFile with buffer (faster for large files)
//             sftp.writeFile(tempFilePath, Buffer.from(finalContent, 'utf8'), (writeErr) => {
//               if (writeErr) {
//                 conn.end();
//                 return reject(new Error(`Failed to write temp file: ${writeErr.message}`));
//               }
              
//               console.log("Temp file written successfully");
              
//               // Now use sudo to move the file
//               const escapedPassword = password.replace(/'/g, "'\\''");
//               const moveCommand = `echo '${escapedPassword}' | sudo -S cp ${tempFilePath} /etc/nimble/rules.conf && echo '${escapedPassword}' | sudo -S chmod 644 /etc/nimble/rules.conf`;
              
//               conn.exec(moveCommand, (moveErr, moveStream) => {
//                 if (moveErr) {
//                   conn.end();
//                   return reject(moveErr);
//                 }
                
//                 let moveError = '';
                
//                 moveStream.stderr.on('data', (data: Buffer) => {
//                   moveError += data.toString();
//                 });
                
//                 moveStream.on('close', (moveCode: number | null) => {
//                   if (moveCode !== 0) {
//                     conn.end();
//                     return reject(new Error(moveError || "Failed to copy file with sudo"));
//                   }
                  
//                   // Clean up temp file
//                   const cleanupCommand = `rm ${tempFilePath}`;
//                   conn.exec(cleanupCommand, () => {});
                  
//                   // Restart nimble service in background (don't wait for it)
//                   const restartCommand = `echo '${escapedPassword}' | sudo -S service nimble restart > /dev/null 2>&1 &`;
                  
//                   conn.exec(restartCommand, (restartErr) => {
//                     conn.end();
//                     if (restartErr) {
//                       console.error("Failed to restart nimble:", restartErr);
//                       resolve(`Routes written (${fullConfig.SyncResponse.Routes.length} total) but service restart may be delayed. The changes will take effect shortly.`);
//                     } else {
//                       resolve(`Successfully written ${fullConfig.SyncResponse.Routes.length} routes. Service restart initiated.`);
//                     }
//                   });
//                 });
//               });
//             });
            
//           } catch (error) {
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
//       readyTimeout: 60000, // Increase timeout for large files
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
      message: `Route creation successful. ${routes.length} route(s) written.`,
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
                console.error("Failed to parse existing config, using default");
              }
            }
            
            if (!fullConfig.SyncResponse) {
              fullConfig.SyncResponse = { status: "success", Routes: [] };
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
            
            fullConfig.SyncResponse.RoutesHash = Date.now().toString();
            
            console.log(`Writing ${fullConfig.SyncResponse.Routes.length} routes to file...`);
            
            const jsonOutput = JSON.stringify(fullConfig, null, 2);
            const finalContent = '/* please do not modify this file, all changes will be overwritten by wmspanel agent */\n' + jsonOutput;
            
            // --- STEP 1: TRY DIRECT WRITE ---
            sftp.writeFile('/etc/nimble/rules.conf', Buffer.from(finalContent, 'utf8'), (writeErr) => {
              if (!writeErr) {
                console.log("✅ Rules.conf written successfully (without sudo).");
                conn.end();
                resolve(`Successfully written ${fullConfig.SyncResponse.Routes.length} routes. File updated.`);
                return;
              }
              
              // --- STEP 2: PERMISSION DENIED? FALLBACK TO SUDO ---
              // SFTP error codes: 4 = permission denied, 2 = no such file
              const errCode = (writeErr as any).code;
              console.log(`Direct write error: code=${errCode}, message=${writeErr.message}`);
              
              if (errCode === 4) { // Permission denied
                console.warn("⚠️ Direct write failed (Permission denied). Falling back to sudo method.");
                const tempFilePath = `/home/${username}/rules_temp.conf`;
                sftp.writeFile(tempFilePath, Buffer.from(finalContent, 'utf8'), (tempWriteErr) => {
                  if (tempWriteErr) {
                    conn.end();
                    return reject(new Error(`Failed to write temp file: ${tempWriteErr.message}`));
                  }
                  
                  const escapedPassword = password.replace(/'/g, "'\\''");
                  const moveCommand = `echo '${escapedPassword}' | sudo -S cp ${tempFilePath} /etc/nimble/rules.conf && echo '${escapedPassword}' | sudo -S chmod 644 /etc/nimble/rules.conf`;
                  
                  conn.exec(moveCommand, (moveErr, moveStream) => {
                    if (moveErr) {
                      conn.end();
                      return reject(new Error(`Sudo exec error: ${moveErr.message}`));
                    }
                    
                    let moveError = '';
                    moveStream.stderr.on('data', (data: Buffer) => {
                      moveError += data.toString();
                    });
                    
                    moveStream.on('close', (moveCode: number | null) => {
                      if (moveCode !== 0) {
                        conn.end();
                        // Provide detailed error
                        const errMsg = moveError || `sudo command failed with code ${moveCode}`;
                        return reject(new Error(`Sudo copy failed: ${errMsg}`));
                      }
                      
                      // Clean up temp file
                      conn.exec(`rm ${tempFilePath}`, () => {});
                      
                      // Restart nimble (optional)
                      const restartCommand = `echo '${escapedPassword}' | sudo -S service nimble restart > /dev/null 2>&1 &`;
                      conn.exec(restartCommand, (restartErr) => {
                        conn.end();
                        if (restartErr) {
                          console.error("Failed to restart nimble:", restartErr);
                          resolve(`Routes written (${fullConfig.SyncResponse.Routes.length} total) but service restart may be delayed. Changes will take effect shortly.`);
                        } else {
                          resolve(`Successfully written ${fullConfig.SyncResponse.Routes.length} routes. Service restart initiated.`);
                        }
                      });
                    });
                  });
                });
              } else {
                // Some other SFTP error
                conn.end();
                return reject(new Error(`Failed to write rules.conf: ${writeErr.message} (code ${errCode})`));
              }
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
      readyTimeout: 60000,
      keepaliveInterval: 10000
    });
  });
}
