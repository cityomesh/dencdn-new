// types/Server.ts
export interface IServer {  // Server నుండి IServer కి మార్చండి
  id: number;
  displayName: string;
  ipAddress: string;
  sshUsername: string;
  sshPassword: string;
  port: string;
  sshPort?: number;
  serverType: "origin" | "edge";
}
export interface RouteAssignment {
  id: number;
  request: string;
  redirect: string;
  assignedServer: string;
  sourceServer: string;
  source: string;
  status: "success" | "error" | "pending";
  host?: string;
  origin?: string;
  originPath?: string;
  useSSL?: string;
  createdAt?: string;
  type?: "manual" | "fetched";
}

export interface Route {
  path?: string;
  request?: string;
  origin?: string;
  redirect?: string;
  host?: string;
  origin_path?: string;
  originPath?: string;
  use_ssl?: string;
  useSSL?: string;
}

export interface Server {
  id: number;
  displayName: string;
  ipAddress: string;
  sshUsername: string;
  sshPassword: string;
  port: string;
  sshPort?: number;
  serverType: "origin" | "edge";
}

export interface RulesResponse {
  routes: Route[];
  error?: string;
}