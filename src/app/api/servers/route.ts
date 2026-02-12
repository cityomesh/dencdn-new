// app/api/servers/route.ts
import { NextRequest, NextResponse } from "next/server";

interface Server {
  id: number;
  name: string;
  ipAddress: string;
  status: string;
  lastChecked?: string;
  [key: string]: unknown; 
}

interface ServerAction {
  action: string;
  server: {
    serverId: number;
    status: string;
    [key: string]: unknown;
  };
}

// Empty array - will be populated from database in actual implementation
let serversData: Server[] = [];

export async function GET() {
  try {
    // Connect to database here (example with placeholder)
    // const servers = await db.select().from(serversTable);
    
    return NextResponse.json({
      success: true,
      servers: serversData
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ServerAction;
    const { action, server } = body;
    
    if (action === "updateStatus") {
      // Update server status after restart
      const { serverId, status } = server;
      
      serversData = serversData.map(s => 
        s.id === serverId 
          ? { ...s, status, lastChecked: new Date().toISOString() } 
          : s
      );
      
      return NextResponse.json({
        success: true,
        message: "Status updated successfully"
      });
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid action" }, 
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update server" },
      { status: 500 }
    );
  }
}
