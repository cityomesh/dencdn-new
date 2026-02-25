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
//   routeToDelete?: {
//     path: string;
//     origin: string;
//   };
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
//         let readError = '';
        
//         readStream.on('data', (data: Buffer) => {
//           existingContent += data.toString();
//         });
        
//         readStream.stderr.on('data', (data: Buffer) => {
//           readError += data.toString();
//         });
        
//         readStream.on('close', () => {
//           try {
//             // Parse existing JSON - keep the ENTIRE structure
//             let fullConfig: any = {};
            
//             // Remove the comment line if it exists
//             const jsonContent = existingContent.replace(/^\/\*.*?\*\/\s*/, '');
            
//             if (jsonContent.trim()) {
//               try {
//                 fullConfig = JSON.parse(jsonContent);
//                 console.log("Successfully parsed existing config");
//               } catch (parseErr) {
//                 console.error("Failed to parse existing config:", parseErr);
//                 // If parsing fails, create default structure
//                 fullConfig = {
//                   SyncResponse: {
//                     status: "success",
//                     Routes: []
//                   }
//                 };
//               }
//             } else {
//               // No existing content, create default structure
//               fullConfig = {
//                 SyncResponse: {
//                   status: "success",
//                   Routes: []
//                 }
//               };
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
//                 const exists = routes.some((existingRoute: any) => 
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
//               fullConfig.SyncResponse.Routes = routes.filter((existingRoute: any) => {
//                 return !newRoutes.some(routeToDelete => 
//                   routeToDelete.path === existingRoute.path && 
//                   routeToDelete.origin === existingRoute.origin
//                 );
//               });
//             }
            
//             // Update RoutesHash with current timestamp
//             fullConfig.SyncResponse.RoutesHash = Date.now().toString();
            
//             // IMPORTANT: Keep ALL other properties exactly as they were
//             // Do NOT modify or remove any other fields
            
//             // Convert to JSON with proper formatting
//             const jsonOutput = JSON.stringify(fullConfig, null, 2);
            
//             // Add the warning comment at the top
//             const finalContent = '/* please do not modify this file, all changes will be overwritten by wmspanel agent */\n' + jsonOutput;
            
//             // Write to a temporary file first (without sudo)
//             const tempFileCommand = `echo '${finalContent.replace(/'/g, "'\\''")}' > /tmp/rules_temp.conf`;
            
//             conn.exec(tempFileCommand, (tempErr, tempStream) => {
//               if (tempErr) {
//                 conn.end();
//                 return reject(tempErr);
//               }
              
//               let tempOutput = '';
//               tempStream.on('data', (data: Buffer) => {
//                 tempOutput += data.toString();
//               });
              
//               tempStream.on('close', (tempCode: number | null) => {
//                 if (tempCode !== 0) {
//                   conn.end();
//                   return reject(new Error("Failed to create temp file"));
//                 }
                
//                 // Now use sudo with echo password to move the file
//                 const moveCommand = `echo '${escapedPassword}' | sudo -S cp /tmp/rules_temp.conf /etc/nimble/rules.conf && echo '${escapedPassword}' | sudo -S chmod 644 /etc/nimble/rules.conf`;
                
//                 conn.exec(moveCommand, (moveErr, moveStream) => {
//                   if (moveErr) {
//                     conn.end();
//                     return reject(moveErr);
//                   }
                  
//                   let moveOutput = '';
//                   let moveError = '';
                  
//                   moveStream.on('data', (data: Buffer) => {
//                     moveOutput += data.toString();
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
                      
//                       let restartOutput = '';
//                       let restartError = '';
                      
//                       restartStream.on('data', (data: Buffer) => {
//                         restartOutput += data.toString();
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
            
//             // IMPORTANT: Keep ALL other properties exactly as they were
//             // Do NOT modify or remove any other fields
            
//             // Convert to JSON with proper formatting
//             const jsonOutput = JSON.stringify(fullConfig, null, 2);
            
//             // Add the warning comment at the top
//             const finalContent = '/* please do not modify this file, all changes will be overwritten by wmspanel agent */\n' + jsonOutput;
            
//             // Write to a temporary file first (without sudo)
//             const tempFileCommand = `echo '${finalContent.replace(/'/g, "'\\''")}' > /tmp/rules_temp.conf`;
            
//             conn.exec(tempFileCommand, (tempErr, tempStream) => {
//               if (tempErr) {
//                 conn.end();
//                 return reject(tempErr);
//               }
              
//               tempStream.on('data', () => {
//                 // We don't need to store tempOutput
//               });
              
//               tempStream.on('close', (tempCode: number | null) => {
//                 if (tempCode !== 0) {
//                   conn.end();
//                   return reject(new Error("Failed to create temp file"));
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

// Define interface for route in config
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

// Define interface for SyncResponse
interface SyncResponse {
  status: string;
  Routes: ConfigRoute[];
  RoutesHash?: string;
  [key: string]: string | ConfigRoute[] | undefined;
}

// Define interface for full config
interface FullConfig {
  SyncResponse: SyncResponse;
  [key: string]: unknown; 
}

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
      message: `Successfully ${action === 'append' ? 'added' : action === 'overwrite' ? 'updated' : 'deleted'} ${routes.length} route(s)`,
      output: result,
      serverId
    });

  } catch (error: unknown) {
    console.error("Write rules error:", error);
    const errorMessage = getErrorMessage(error);
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
      
      // Escape single quotes in password to prevent command injection
      const escapedPassword = password.replace(/'/g, "'\\''");
      
      // First, read existing rules.conf
      const readCommand = `cat /etc/nimble/rules.conf 2>/dev/null || echo "{}"`;
      
      conn.exec(readCommand, (readErr, readStream) => {
        if (readErr) {
          conn.end();
          return reject(readErr);
        }
        
        let existingContent = '';
        
        readStream.on('data', (data: Buffer) => {
          existingContent += data.toString();
        });
        
        // We don't need readError variable - just log if needed
        readStream.stderr.on('data', (data: Buffer) => {
          console.log(`Read stderr: ${data.toString()}`);
        });
        
        readStream.on('close', () => {
          try {
            // Parse existing JSON - keep the ENTIRE structure
            let fullConfig: FullConfig = {
              SyncResponse: {
                status: "success",
                Routes: []
              }
            };
            
            // Remove the comment line if it exists
            const jsonContent = existingContent.replace(/^\/\*.*?\*\/\s*/, '');
            
            if (jsonContent.trim()) {
              try {
                const parsed = JSON.parse(jsonContent);
                fullConfig = parsed as FullConfig;
                console.log("Successfully parsed existing config");
              } catch (parseErr) {
                console.error("Failed to parse existing config:", parseErr);
                // Keep default structure
              }
            }
            
            // Ensure SyncResponse exists
            if (!fullConfig.SyncResponse) {
              fullConfig.SyncResponse = {
                status: "success",
                Routes: []
              };
            }
            
            // Ensure Routes array exists in SyncResponse
            if (!fullConfig.SyncResponse.Routes) {
              fullConfig.SyncResponse.Routes = [];
            }
            
            // Get the Routes array
            const routes = fullConfig.SyncResponse.Routes;
            
            // Apply action based on user choice
            if (action === 'overwrite') {
              // Replace all routes with new ones
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
              // Add new routes, avoiding duplicates
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
              // Delete routes
              fullConfig.SyncResponse.Routes = routes.filter((existingRoute: ConfigRoute) => {
                return !newRoutes.some(routeToDelete => 
                  routeToDelete.path === existingRoute.path && 
                  routeToDelete.origin === existingRoute.origin
                );
              });
            }
            
            // Update RoutesHash with current timestamp
            fullConfig.SyncResponse.RoutesHash = Date.now().toString();
            
            // Convert to JSON with proper formatting
            const jsonOutput = JSON.stringify(fullConfig, null, 2);
            
            // Add the warning comment at the top
            const finalContent = '/* please do not modify this file, all changes will be overwritten by wmspanel agent */\n' + jsonOutput;
            
            const tempFileCommand = `cat > /tmp/rules_temp.conf << 'EOF'
${finalContent}
EOF`;

            conn.exec(tempFileCommand, (tempErr, tempStream) => {
              if (tempErr) {
                conn.end();
                return reject(tempErr);
              }
              
              let tempError = '';
              
              tempStream.on('data', () => {
                // We don't need to store tempOutput
              });
              
              tempStream.stderr.on('data', (data: Buffer) => {
                tempError += data.toString();
              });
              
              tempStream.on('close', (tempCode: number | null) => {
                if (tempCode !== 0) {
                  conn.end();
                  return reject(new Error(`Failed to create temp file: ${tempError}`));
                }
                
                // Now use sudo with echo password to move the file
                const moveCommand = `echo '${escapedPassword}' | sudo -S cp /tmp/rules_temp.conf /etc/nimble/rules.conf && echo '${escapedPassword}' | sudo -S chmod 644 /etc/nimble/rules.conf`;
                
                conn.exec(moveCommand, (moveErr, moveStream) => {
                  if (moveErr) {
                    conn.end();
                    return reject(moveErr);
                  }
                  
                  let moveError = '';
                  
                  moveStream.on('data', () => {
                    // We don't need to store moveOutput
                  });
                  
                  moveStream.stderr.on('data', (data: Buffer) => {
                    moveError += data.toString();
                  });
                  
                  moveStream.on('close', (moveCode: number | null) => {
                    if (moveCode !== 0) {
                      conn.end();
                      return reject(new Error(moveError || "Failed to copy file with sudo"));
                    }
                    
                    // Clean up temp file
                    const cleanupCommand = `rm /tmp/rules_temp.conf`;
                    conn.exec(cleanupCommand, () => {});
                    
                    // Restart nimble service with sudo
                    const restartCommand = `echo '${escapedPassword}' | sudo -S service nimble restart`;
                    
                    conn.exec(restartCommand, (restartErr, restartStream) => {
                      if (restartErr) {
                        console.error("Failed to restart nimble:", restartErr);
                        conn.end();
                        resolve("Routes written but service restart failed: " + restartErr.message);
                      }
                      
                      let restartError = '';
                      
                      restartStream.on('data', () => {
                        // We don't need to store restartOutput
                      });
                      
                      restartStream.stderr.on('data', (data: Buffer) => {
                        restartError += data.toString();
                      });
                      
                      restartStream.on('close', (restartCode: number | null) => {
                        conn.end();
                        if (restartCode === 0) {
                          resolve("Routes written and nimble service restarted successfully");
                        } else {
                          resolve(`Routes written but service restart failed: ${restartError || 'Unknown error'}`);
                        }
                      });
                    });
                  });
                });
              });
            });
            // ===== ఇక్కడ వరకు మార్పు =====
            
          } catch (error) {
            console.error("Error in writeRulesToServer:", error);
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
      readyTimeout: 10000,
      keepaliveInterval: 10000
    });
  });
}
