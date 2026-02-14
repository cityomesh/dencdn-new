// // app/api/servers/route.ts
// import { NextRequest, NextResponse } from "next/server";

// interface Server {
//   id: number;
//   name: string;
//   ipAddress: string;
//   status: string;
//   lastChecked?: string;
//   [key: string]: unknown; 
// }

// interface ServerAction {
//   action: string;
//   server: {
//     serverId: number;
//     status: string;
//     [key: string]: unknown;
//   };
// }

// // Empty array - will be populated from database in actual implementation
// let serversData: Server[] = [];

// export async function GET() {
//   try {
//     // Connect to database here (example with placeholder)
//     // const servers = await db.select().from(serversTable);
    
//     return NextResponse.json({
//       success: true,
//       servers: serversData
//     });
//   } catch {
//     return NextResponse.json(
//       { success: false, error: "Failed to fetch servers" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json() as ServerAction;
//     const { action, server } = body;
    
//     if (action === "updateStatus") {
//       // Update server status after restart
//       const { serverId, status } = server;
      
//       serversData = serversData.map(s => 
//         s.id === serverId 
//           ? { ...s, status, lastChecked: new Date().toISOString() } 
//           : s
//       );
      
//       return NextResponse.json({
//         success: true,
//         message: "Status updated successfully"
//       });
//     }
    
//     return NextResponse.json(
//       { success: false, error: "Invalid action" }, 
//       { status: 400 }
//     );
//   } catch {
//     return NextResponse.json(
//       { success: false, error: "Failed to update server" },
//       { status: 500 }
//     );
//   }
// }



// app/api/servers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

// File path to store servers data
const dataFilePath = path.join(process.cwd(), 'data', 'servers.json');

interface Server {
  id: number;
  displayName: string;
  serverType: "origin" | "edge";
  parentServer?: string;
  ipAddress: string;
  port: string;
  sshPort?: number;
  outputIpPort: string;
  status: "online" | "offline" | "unknown";
  lastChecked: string;
  sshUsername?: string;
  sshPassword?: string;
}

// Helper function to read servers from file
async function readServersFromFile(): Promise<Server[]> {
  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // Read file
    try {
      const data = await fs.readFile(dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch {
      // File doesn't exist or is empty, return empty array
      return [];
    }
  } catch (error) {
    console.error("Error reading servers file:", error);
    return [];
  }
}

// Helper function to write servers to file
async function writeServersToFile(servers: Server[]): Promise<boolean> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    await fs.writeFile(dataFilePath, JSON.stringify(servers, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Error writing servers file:", error);
    return false;
  }
}

// GET /api/servers - Get all servers
export async function GET() {
  try {
    const servers = await readServersFromFile();
    
    return NextResponse.json({
      success: true,
      servers: servers
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}

// POST /api/servers - Create/Update/Delete servers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, server } = body;

    // Read current servers
    const currentServers = await readServersFromFile();

    if (action === "create") {
      const newServer = {
        id: Date.now(),
        ...server,
        status: "unknown" as const,
        lastChecked: "Never"
      };
      
      currentServers.push(newServer);
      await writeServersToFile(currentServers);
      
      return NextResponse.json({
        success: true,
        message: "Server created successfully",
        server: newServer
      });
    }
    
    if (action === "update") {
      const { id, ...updateData } = server;
      const index = currentServers.findIndex(s => s.id === id);
      
      if (index !== -1) {
        currentServers[index] = { 
          ...currentServers[index], 
          ...updateData,
          // Ensure status is one of the allowed values
          status: updateData.status || currentServers[index].status
        };
        
        await writeServersToFile(currentServers);
        
        return NextResponse.json({
          success: true,
          message: "Server updated successfully"
        });
      }
      
      return NextResponse.json(
        { success: false, error: "Server not found" },
        { status: 404 }
      );
    }
    
    if (action === "delete") {
      const { id } = server;
      const filteredServers = currentServers.filter(s => s.id !== id);
      await writeServersToFile(filteredServers);
      
      return NextResponse.json({
        success: true,
        message: "Server deleted successfully"
      });
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
    
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// DELETE /api/servers?id=123 - Delete a server
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Server ID required" },
        { status: 400 }
      );
    }
    
    const currentServers = await readServersFromFile();
    const filteredServers = currentServers.filter(s => s.id !== parseInt(id));
    await writeServersToFile(filteredServers);
    
    return NextResponse.json({
      success: true,
      message: "Server deleted successfully"
    });
    
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete server" },
      { status: 500 }
    );
  }
}

