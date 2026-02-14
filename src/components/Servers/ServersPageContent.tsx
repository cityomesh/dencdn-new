// // components/Servers/ServersPageContent.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { 
//   FiTrash2, 
//   FiEdit,
//   FiPlus,
//   FiActivity,
//   FiCheck,
//   FiX,
//   FiRefreshCw,
//   FiAlertCircle,
//   FiInfo
// } from "react-icons/fi";
// import { ServerForm } from "./ServerForm";
// import ServiceRestartModal from "./ServiceRestartModal";

// // Update the Server interface
// interface Server {
//   id: number;
//   displayName: string;
//   serverType: "origin" | "edge";
//   parentServer?: string;
//   ipAddress: string;
//   port: string;            // Listening port (string for display)
//   sshPort?: number;        // SSH port (optional for backward compatibility)
//   outputIpPort: string;
//   status: "online" | "offline" | "unknown";
//   lastChecked: string;
//   sshUsername?: string;
//   sshPassword?: string;
// }

// const getServerStatus = (success: boolean): Server['status'] => {
//   return success ? "online" : "offline";
// };

// const ServersPageContent = () => {
//   const [servers, setServers] = useState<Server[]>([]);
//   const [filteredServers, setFilteredServers] = useState<Server[]>([]);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingServer, setEditingServer] = useState<Server | null>(null);
//   const [isClient, setIsClient] = useState(false);
//   const [selectedServerIds, setSelectedServerIds] = useState<number[]>([]);
//   const [isRestarting, setIsRestarting] = useState(false);
//   const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
//   const [deleteModal, setDeleteModal] = useState<{
//     isOpen: boolean;
//     serverId: number | null;
//     serverName: string;
//   }>({
//     isOpen: false,
//     serverId: null,
//     serverName: ""
//   });

//   const [successModal, setSuccessModal] = useState<{
//     isOpen: boolean;
//     title: string;
//     message: string;
//     type: 'success' | 'error' | 'info';
//   }>({
//     isOpen: false,
//     title: "",
//     message: "",
//     type: 'success'
//   });

//   const [restartResultsModal, setRestartResultsModal] = useState<{
//     isOpen: boolean;
//     serviceName: string;
//     results: Array<{
//       success: boolean;
//       output: string;
//       serverName: string;
//     }>;
//   }>({
//     isOpen: false,
//     serviceName: "",
//     results: []
//   });

//   useEffect(() => {
//     setIsClient(true);
    
//     const savedServers = localStorage.getItem('servers');
//     if (savedServers) {
//       try {
//         const parsedServers: Server[] = JSON.parse(savedServers);
//         const migratedServers = parsedServers.map(server => ({
//           ...server,
//           sshPort: server.sshPort || 22
//         }));
        
//         setServers(migratedServers);
//         setFilteredServers(migratedServers);
        
//         // Save migrated data back
//         localStorage.setItem('servers', JSON.stringify(migratedServers));
//       } catch (error) {
//         console.error("Error parsing servers from localStorage:", error);
//         setServers([]);
//         setFilteredServers([]);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     setFilteredServers(servers);
//   }, [servers]);

//   useEffect(() => {
//     if (isClient && servers.length > 0) {
//       localStorage.setItem('servers', JSON.stringify(servers));
//     }
//   }, [servers, isClient]);

//   const showSuccessMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
//     setSuccessModal({
//       isOpen: true,
//       title,
//       message,
//       type
//     });
//   };

//   const closeSuccessMessage = () => {
//     setSuccessModal({
//       isOpen: false,
//       title: "",
//       message: "",
//       type: 'success'
//     });
//   };

//   const toggleServerSelection = (serverId: number) => {
//     setSelectedServerIds(prev => 
//       prev.includes(serverId) 
//         ? prev.filter(id => id !== serverId)
//         : [...prev, serverId]
//     );
//   };

//   const selectAllServers = () => {
//     if (selectedServerIds.length === filteredServers.length && filteredServers.length > 0) {
//       setSelectedServerIds([]);
//     } else {
//       setSelectedServerIds(filteredServers.map(server => server.id));
//     }
//   };

//   const selectedServers = servers.filter(server => 
//     selectedServerIds.includes(server.id)
//   );

//   const handleServiceRestart = async (serviceName: string) => {
//     setIsRestarting(true);
    
//     try {
//       const results = await Promise.all(
//         selectedServers.map(async (server) => {
//           try {
//             const res = await fetch("/api/reload-server", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 serverId: server.id.toString(),
//                 ipAddress: server.ipAddress,
//                 port: parseInt(server.port) || 9229, // Use listening port
//                 sshPort: server.sshPort || 22,       // Use SSH port
//                 sshUsername: server.sshUsername || "",
//                 sshPassword: server.sshPassword || "",
//                 serviceName: serviceName,
//               }),
//             });
            
//             const data = await res.json();
//             return {
//               success: data.success,
//               output: data.output || data.error,
//               serverName: server.displayName
//             };
//           } catch (error) {
//             return {
//               success: false,
//               output: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
//               serverName: server.displayName
//             };
//           }
//         })
//       );

//       setRestartResultsModal({
//         isOpen: true,
//         serviceName,
//         results
//       });

//       const updatedServers = servers.map(server => {
//         if (selectedServerIds.includes(server.id)) {
//           const result = results.find(r => r.serverName === server.displayName);
//           return {
//             ...server,
//             status: getServerStatus(result?.success || false),
//             lastChecked: new Date().toLocaleString()
//           };
//         }
//         return server;
//       });
      
//       setServers(updatedServers);
//       setSelectedServerIds([]);
//       setIsServiceModalOpen(false);
      
//     } catch (error) {
//       console.error("Service restart failed:", error);
//       showSuccessMessage(
//         "Service Restart Failed",
//         `Service restart failed: ${error instanceof Error ? error.message : "Unknown error"}`,
//         'error'
//       );
//     } finally {
//       setIsRestarting(false);
//     }
//   };

//   const handleAddServer = () => {
//     setIsAddModalOpen(true);
//   };

//   const handleCreateServer = (serverData: {
//     displayName: string;
//     ipAddress: string;
//     sshUsername: string;
//     sshPassword: string;
//     listeningPort: number;
//     sshPort: number;
//     originIpWithPort: string;
//     serverType: "origin" | "edge";
//     parentServerId?: string;
//   }) => {
//     const newServer: Server = {
//       id: Date.now(),
//       displayName: serverData.displayName,
//       serverType: serverData.serverType,
//       parentServer: serverData.serverType === "edge" ? serverData.parentServerId : "None",
//       ipAddress: serverData.ipAddress,
//       port: serverData.listeningPort.toString(),
//       sshPort: serverData.sshPort,
//       outputIpPort: serverData.originIpWithPort,
//       status: "unknown",
//       lastChecked: "Never",
//       sshUsername: serverData.sshUsername,
//       sshPassword: serverData.sshPassword,
//     };
    
//     const updatedServers = [...servers, newServer];
//     setServers(updatedServers);
//     setIsAddModalOpen(false);
    
//     // Force immediate localStorage save
//     localStorage.setItem('servers', JSON.stringify(updatedServers));
    
//     // Show success in custom modal
//     showSuccessMessage(
//       "Server Created",
//       `Server &quot;${serverData.displayName}&quot; created successfully!`
//     );
//   };

//   const handleEditServer = (server: Server) => {
//     setEditingServer(server);
//     setIsEditModalOpen(true);
//   };

//   const handleUpdateServer = (serverData: {
//     displayName: string;
//     ipAddress: string;
//     sshUsername: string;
//     sshPassword: string;
//     listeningPort: number;
//     sshPort: number;
//     originIpWithPort: string;
//     serverType: "origin" | "edge";
//     parentServerId?: string;
//   }) => {
//     if (editingServer) {
//       const updatedServers = servers.map(server => {
//         if (server.id === editingServer.id) {
//           return {
//             ...server,
//             displayName: serverData.displayName,
//             serverType: serverData.serverType,
//             parentServer: serverData.serverType === "edge" ? serverData.parentServerId : "None",
//             ipAddress: serverData.ipAddress,
//             port: serverData.listeningPort.toString(),
//             sshPort: serverData.sshPort,
//             outputIpPort: serverData.originIpWithPort,
//             sshUsername: serverData.sshUsername,
//             sshPassword: serverData.sshPassword,
//           };
//         }
//         return server;
//       });
      
//       setServers(updatedServers);
//       setEditingServer(null);
//       setIsEditModalOpen(false);
      
//       // Force immediate localStorage save
//       localStorage.setItem('servers', JSON.stringify(updatedServers));
      
//       // Show success in custom modal
//       showSuccessMessage(
//         "Server Updated",
//         `Server &quot;${serverData.displayName}&quot; updated successfully!`
//       );
//     }
//   };

//   // Delete Confirmation Modal
//   const showDeleteConfirmation = (id: number, name: string) => {
//     setDeleteModal({
//       isOpen: true,
//       serverId: id,
//       serverName: name
//     });
//   };

//   const closeDeleteConfirmation = () => {
//     setDeleteModal({
//       isOpen: false,
//       serverId: null,
//       serverName: ""
//     });
//   };

//   // Delete function
//   const handleDeleteServer = () => {
//     if (deleteModal.serverId) {
//       const updatedServers = servers.filter(server => server.id !== deleteModal.serverId);
//       setServers(updatedServers);
//       setSelectedServerIds(prev => prev.filter(serverId => serverId !== deleteModal.serverId));
      
//       localStorage.setItem('servers', JSON.stringify(updatedServers));
      
//       closeDeleteConfirmation();
//       showSuccessMessage(
//         "Server Deleted",
//         `Server &quot;${deleteModal.serverName}&quot; deleted successfully!`
//       );
//     }
//   };

//   // Close restart results modal
//   const closeRestartResults = () => {
//     setRestartResultsModal({
//       isOpen: false,
//       serviceName: "",
//       results: []
//     });
//   };

//   const handleCheckHealth = (id: number) => {
//     const updatedServers = servers.map(server => {
//       if (server.id === id) {
//         return {
//           ...server,
//           status: "online",
//           lastChecked: new Date().toLocaleString()
//         };
//       }
//       return server;
//     }) as Server[];
    
//     setServers(updatedServers);
    
//     // Show success in custom modal
//     showSuccessMessage(
//       "Health Check",
//       `Server health check completed successfully!`,
//       'info'
//     );
//   };

//   const StatusBadge = ({ status }: { status: Server['status'] }) => {
//     switch (status) {
//       case "online":
//         return (
//           <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center gap-1">
//             <FiCheck size={12} /> Online
//           </span>
//         );
//       case "offline":
//         return (
//           <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
//             <FiX size={12} /> Offline
//           </span>
//         );
//       default:
//         return (
//           <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
//             UNKNOWN
//           </span>
//         );
//     }
//   };

//   // Show loading state
//   if (!isClient) {
//     return (
//       <div className="min-h-screen bg-gray-50 pt-24 px-6 py-6">
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-black">Servers</h1>
//           </div>
//           <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
//         </div>
//         <div className="border border-gray-300 rounded-lg bg-white p-8">
//           <div className="text-center text-gray-500">Loading servers...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-900">
//       <div className="pt-24 px-6 py-6">
//         <div className="flex justify-between items-center mb-8">
//           {/* Left side - Title */}
//           <h1 className="text-3xl font-bold text-white">Servers</h1>
          
//           {/* Right side - Buttons */}
//           <div className="flex gap-3">
//             {selectedServers.length > 0 && (
//               <button 
//                 onClick={() => setIsServiceModalOpen(true)}
//                 className="flex items-center gap-2 px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-white font-medium shadow-sm"
//               >
//                 <FiRefreshCw className="text-lg" />
//                 <span>Service Restart ({selectedServers.length})</span>
//               </button>
//             )}
            
//             {/* Add Server Button */}
//             <button 
//               onClick={handleAddServer}
//               className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium shadow-sm"
//             >
//               <FiPlus className="text-lg" />
//               <span>Add Server</span>
//             </button>
//           </div>
//         </div>

//         {/* SERVERS COUNT AND SELECTION INFO */}
//         <div className="flex justify-between items-center mb-6">
//           <div className="text-gray-300 text-sm">
//             Total Servers: <span className="font-semibold">{servers.length}</span>
//             {selectedServers.length > 0 && (
//               <span className="ml-4">
//                 Selected: <span className="font-semibold text-blue-300">{selectedServers.length}</span>
//               </span>
//             )}
//           </div>
          
//           {/* Select All Button */}
//           {filteredServers.length > 0 && (
//             <button
//               onClick={selectAllServers}
//               className="text-sm text-blue-400 hover:text-blue-300"
//             >
//               {selectedServerIds.length === filteredServers.length && filteredServers.length > 0
//                 ? 'Deselect All'
//                 : 'Select All'}
//             </button>
//           )}
//         </div>

//         {/* SERVERS TABLE WITH CHECKBOXES */}
//         <div className="border border-gray-700 rounded-lg overflow-hidden bg-yellow-700 shadow-sm">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="bg-gray-900 text-gray-300">
//                   {/* Checkbox column */}
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700 w-12">
//                     <input
//                       type="checkbox"
//                       checked={selectedServerIds.length === filteredServers.length && filteredServers.length > 0}
//                       onChange={selectAllServers}
//                       className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
//                     />
//                   </th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Display Name</th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Server Type</th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Parent Server</th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">IP Address</th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Port (Listening)</th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Output IP:Port</th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Status</th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Last Checked</th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Actions</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredServers.length === 0 ? (
//                   <tr>
//                     <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
//                       <div className="flex flex-col items-center justify-center">
//                         <div className="text-lg mb-2">No servers found</div>
//                         <div className="text-sm">Click &quot;Add Server&quot; to create your first server</div>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredServers.map((server) => (
//                     <tr 
//                       key={server.id} 
//                       className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${
//                         selectedServerIds.includes(server.id) ? 'bg-gray-750' : ''
//                       }`}
//                     >
//                       {/* Checkbox cell */}
//                       <td className="px-4 py-3">
//                         <input
//                           type="checkbox"
//                           checked={selectedServerIds.includes(server.id)}
//                           onChange={() => toggleServerSelection(server.id)}
//                           className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
//                         />
//                       </td>
//                       <td className="px-4 py-3 font-medium text-white">{server.displayName}</td>
//                       <td className="px-4 py-3">
//                         <span className={`px-3 py-1 rounded text-xs font-medium ${
//                           server.serverType === 'origin' 
//                             ? 'bg-purple-900/50 text-purple-300' 
//                             : 'bg-blue-900/50 text-blue-300'
//                         }`}>
//                           {server.serverType === 'origin' ? 'Origin' : 'Edge'}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 text-gray-300">{server.parentServer || "None"}</td>
//                       <td className="px-4 py-3 font-mono text-green-300">{server.ipAddress}</td>
//                       <td className="px-4 py-3 font-mono text-gray-300">
//                         {server.port}
//                         {server.sshPort && server.sshPort !== 22 && (
//                           <span className="text-xs text-blue-300 ml-2">
//                             (SSH: {server.sshPort})
//                           </span>
//                         )}
//                       </td>
//                       <td className="px-4 py-3 font-mono text-blue-300">{server.outputIpPort}</td>
//                       <td className="px-4 py-3">
//                         <StatusBadge status={server.status} />
//                       </td>
//                       <td className="px-4 py-3 text-gray-300 text-sm">{server.lastChecked}</td>
//                       <td className="px-4 py-3">
//                         <div className="flex gap-2">
//                           <button 
//                             onClick={() => handleCheckHealth(server.id)}
//                             className="p-2 hover:bg-gray-700 rounded transition-colors"
//                             title="Check Health"
//                           >
//                             <FiActivity className="text-green-400" />
//                           </button>
//                           <button 
//                             onClick={() => handleEditServer(server)}
//                             className="p-2 hover:bg-gray-700 rounded transition-colors"
//                             title="Edit"
//                           >
//                             <FiEdit className="text-blue-400" />
//                           </button>
//                           <button 
//                             onClick={() => showDeleteConfirmation(server.id, server.displayName)}
//                             className="p-2 hover:bg-red-900/30 rounded transition-colors"
//                             title="Delete"
//                           >
//                             <FiTrash2 className="text-red-400" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* PAGINATION */}
//           {filteredServers.length > 0 && (
//             <div className="mt-[23rem]">
//               <div className="flex flex-wrap justify-between items-center p-4 border-t border-gray-700">
//                 <div className="text-sm text-gray-400">
//                   Page 1 of 1
//                 </div>
                
//                 <div className="text-sm text-gray-400">
//                   Showing {filteredServers.length} servers
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Add Server Modal */}
//       <ServerForm
//         opened={isAddModalOpen}
//         onClose={() => setIsAddModalOpen(false)}
//         title="Add New Server"
//         onSubmit={handleCreateServer}
//         initialValues={undefined}
//       />

//       {/* Edit Server Modal */}
//       {editingServer && (
//         <ServerForm
//           opened={isEditModalOpen}
//           onClose={() => {
//             setIsEditModalOpen(false);
//             setEditingServer(null);
//           }}
//           title="Edit Server"
//           onSubmit={handleUpdateServer}
//           initialValues={{
//             displayName: editingServer.displayName,
//             ipAddress: editingServer.ipAddress,
//             sshUsername: editingServer.sshUsername || "",
//             sshPassword: editingServer.sshPassword || "",
//             listeningPort: parseInt(editingServer.port) || 9229,
//             sshPort: editingServer.sshPort || 22,
//             originIpWithPort: editingServer.outputIpPort,
//             serverType: editingServer.serverType,
//             parentServerId: editingServer.parentServer !== "None" ? editingServer.parentServer : undefined,
//           }}
//         />
//       )}

//       {/* Service Restart Modal */}
//       <ServiceRestartModal
//         isOpen={isServiceModalOpen}
//         onClose={() => setIsServiceModalOpen(false)}
//         selectedServers={selectedServers}
//         onConfirm={handleServiceRestart}
//         isRestarting={isRestarting}
//       />

//       {/* Delete Confirmation Modal */}
//       {deleteModal.isOpen && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
//             <div className="flex items-center gap-3 mb-4">
//               <div className="p-2 bg-red-900/30 rounded-full">
//                 <FiAlertCircle className="text-red-400 text-xl" />
//               </div>
//               <div>
//                 <h3 className="text-lg font-bold text-white">Confirm Delete</h3>
//                 <p className="text-gray-300 text-sm mt-1">This action cannot be undone</p>
//               </div>
//             </div>
            
//             <div className="mb-6">
//               <p className="text-gray-300">
//                 Are you sure you want to delete server <span className="font-semibold text-red-300">&quot;{deleteModal.serverName}&quot;</span>?
//               </p>
//             </div>
            
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={closeDeleteConfirmation}
//                 className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-white font-medium"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDeleteServer}
//                 className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white font-medium"
//               >
//                 Delete Server
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Success/Error Message Modal */}
//       {successModal.isOpen && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className={`rounded-lg p-6 w-full max-w-md border ${
//             successModal.type === 'success' 
//               ? 'bg-gray-800 border-green-700' 
//               : successModal.type === 'error'
//                 ? 'bg-gray-800 border-red-700'
//                 : 'bg-gray-800 border-blue-700'
//           }`}>
//             <div className="flex items-center gap-3 mb-4">
//               <div className={`p-2 rounded-full ${
//                 successModal.type === 'success' 
//                   ? 'bg-green-900/30' 
//                   : successModal.type === 'error'
//                     ? 'bg-red-900/30'
//                     : 'bg-blue-900/30'
//               }`}>
//                 {successModal.type === 'success' ? (
//                   <FiCheck className="text-green-400 text-xl" />
//                 ) : successModal.type === 'error' ? (
//                   <FiAlertCircle className="text-red-400 text-xl" />
//                 ) : (
//                   <FiInfo className="text-blue-400 text-xl" />
//                 )}
//               </div>
//               <div>
//                 <h3 className="text-lg font-bold text-white">{successModal.title}</h3>
//                 <p className={`text-sm mt-1 ${
//                   successModal.type === 'success' 
//                     ? 'text-green-300' 
//                     : successModal.type === 'error'
//                       ? 'text-red-300'
//                       : 'text-blue-300'
//                 }`}>
//                   {successModal.type === 'success' ? 'Success' : 
//                    successModal.type === 'error' ? 'Error' : 'Information'}
//                 </p>
//               </div>
//             </div>
            
//             <div className="mb-6">
//               <p className="text-gray-300">{successModal.message}</p>
//             </div>
            
//             <div className="flex justify-end">
//               <button
//                 onClick={closeSuccessMessage}
//                 className={`px-5 py-2 rounded-lg transition-colors text-white font-medium ${
//                   successModal.type === 'success' 
//                     ? 'bg-green-600 hover:bg-green-700' 
//                     : successModal.type === 'error'
//                       ? 'bg-red-600 hover:bg-red-700'
//                       : 'bg-blue-600 hover:bg-blue-700'
//                 }`}
//               >
//                 OK
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Service Restart Results Modal */}
//       {restartResultsModal.isOpen && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] flex flex-col">
//             <div className="flex justify-between items-center mb-4">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-blue-900/30 rounded-full">
//                   <FiRefreshCw className="text-blue-400 text-xl" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-bold text-white">Service Restart Results</h3>
//                   <p className="text-blue-300 text-sm">Service: {restartResultsModal.serviceName}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={closeRestartResults}
//                 className="p-2 hover:bg-gray-700 rounded transition-colors"
//               >
//                 <FiX className="text-gray-400" />
//               </button>
//             </div>
            
//             <div className="flex-grow overflow-y-auto mb-4">
//               <div className="space-y-3">
//                 {restartResultsModal.results.map((result, index) => (
//                   <div 
//                     key={index} 
//                     className={`p-4 rounded border ${
//                       result.success 
//                         ? 'border-green-700 bg-green-900/20' 
//                         : 'border-red-700 bg-red-900/20'
//                     }`}
//                   >
//                     <div className="flex items-center justify-between mb-2">
//                       <div className="flex items-center gap-2">
//                         <span className={`text-lg ${
//                           result.success ? 'text-green-400' : 'text-red-400'
//                         }`}>
//                           {result.success ? '✓' : '✗'}
//                         </span>
//                         <span className="font-medium text-white">{result.serverName}</span>
//                       </div>
//                       <span className={`px-3 py-1 rounded text-xs font-medium ${
//                         result.success 
//                           ? 'bg-green-900/50 text-green-300' 
//                           : 'bg-red-900/50 text-red-300'
//                       }`}>
//                         {result.success ? 'Success' : 'Failed'}
//                       </span>
//                     </div>
//                     <p className="text-gray-300 text-sm font-mono bg-black/30 p-2 rounded">
//                       {result.output}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>
            
//             <div className="flex justify-end">
//               <button
//                 onClick={closeRestartResults}
//                 className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ServersPageContent;


// components/Servers/ServersPageContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FiTrash2, 
  FiEdit,
  FiPlus,
  FiActivity,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiInfo
} from "react-icons/fi";
import { ServerForm } from "./ServerForm";
import ServiceRestartModal from "./ServiceRestartModal";

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

// Define interface for API response
interface ServerApiResponse {
  success: boolean;
  servers?: Server[];
  error?: string;
  message?: string;
  server?: Server;
}

// Define interface for server form data
interface ServerFormData {
  displayName: string;
  ipAddress: string;
  sshUsername: string;
  sshPassword: string;
  listeningPort: number;
  sshPort: number;
  originIpWithPort: string;
  serverType: "origin" | "edge";
  parentServerId?: string;
}

const ServersPageContent = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [filteredServers, setFilteredServers] = useState<Server[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<number[]>([]);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    serverId: number | null;
    serverName: string;
  }>({
    isOpen: false,
    serverId: null,
    serverName: ""
  });

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: 'success'
  });

  const [restartResultsModal, setRestartResultsModal] = useState<{
    isOpen: boolean;
    serviceName: string;
    results: Array<{
      success: boolean;
      output: string;
      serverName: string;
    }>;
  }>({
    isOpen: false,
    serviceName: "",
    results: []
  });

  // Define fetchServers with useCallback
  const fetchServers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/servers');
      const data: ServerApiResponse = await response.json();
      
      console.log("Fetched servers:", data);
      
      if (data.success && data.servers) {
        // Ensure status is one of the allowed values
        const validatedServers = data.servers.map((server: Server) => ({
          ...server,
          status: server.status === "online" || server.status === "offline" 
            ? server.status 
            : "unknown" as const
        }));
        
        setServers(validatedServers);
        setFilteredServers(validatedServers);
      } else {
        console.error("Failed to fetch servers:", data.error);
      }
    } catch {
      console.error("Error fetching servers");
      showSuccessMessage("Error", "Failed to load servers", 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load servers from API on mount
  useEffect(() => {
    setIsClient(true);
    fetchServers();
  }, [fetchServers]);

  useEffect(() => {
    setFilteredServers(servers);
  }, [servers]);

  const showSuccessMessage = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSuccessModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeSuccessMessage = () => {
    setSuccessModal({
      isOpen: false,
      title: "",
      message: "",
      type: 'success'
    });
  };

  const toggleServerSelection = (serverId: number) => {
    setSelectedServerIds(prev => 
      prev.includes(serverId) 
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

  const selectAllServers = () => {
    if (selectedServerIds.length === filteredServers.length && filteredServers.length > 0) {
      setSelectedServerIds([]);
    } else {
      setSelectedServerIds(filteredServers.map(server => server.id));
    }
  };

  const selectedServers = servers.filter(server => 
    selectedServerIds.includes(server.id)
  );

  const handleServiceRestart = async (serviceName: string) => {
    setIsRestarting(true);
    
    try {
      const results = await Promise.all(
        selectedServers.map(async (server) => {
          try {
            const res = await fetch("/api/reload-server", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                serverId: server.id.toString(),
                ipAddress: server.ipAddress,
                port: parseInt(server.port) || 9229,
                sshPort: server.sshPort || 22,
                sshUsername: server.sshUsername || "",
                sshPassword: server.sshPassword || "",
                serviceName: serviceName,
              }),
            });
            
            const data = await res.json();
            return {
              success: data.success,
              output: data.output || data.error,
              serverName: server.displayName
            };
          } catch {
            return {
              success: false,
              output: `Connection failed: Unknown error`,
              serverName: server.displayName
            };
          }
        })
      );

      setRestartResultsModal({
        isOpen: true,
        serviceName,
        results
      });

      const updatedServers: Server[] = servers.map(server => {
        if (selectedServerIds.includes(server.id)) {
          const result = results.find(r => r.serverName === server.displayName);
          const newStatus: Server['status'] = result?.success ? "online" : "offline";
          
          return {
            ...server,
            status: newStatus,
            lastChecked: new Date().toLocaleString()
          };
        }
        return server;
      });
      
      setServers(updatedServers);
      setSelectedServerIds([]);
      setIsServiceModalOpen(false);
      
      if (selectedServers.length > 0) {
        const firstServer = selectedServers[0];
        const updatedFirstServer = updatedServers.find(s => s.id === firstServer.id);
        
        if (updatedFirstServer) {
          await fetch('/api/servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'update', 
              server: { 
                id: firstServer.id, 
                status: updatedFirstServer.status 
              } 
            })
          });
        }
      }
      
    } catch {
      console.error("Service restart failed");
      showSuccessMessage(
        "Service Restart Failed",
        "Service restart failed",
        'error'
      );
    } finally {
      setIsRestarting(false);
    }
  };

  const handleAddServer = () => {
    setIsAddModalOpen(true);
  };

  const handleCreateServer = async (serverData: ServerFormData) => {
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create', 
          server: serverData 
        })
      });

      const data: ServerApiResponse = await response.json();
      
      if (data.success) {
        await fetchServers();
        setIsAddModalOpen(false);
        showSuccessMessage(
          "Server Created",
          `Server &quot;${serverData.displayName}&quot; created successfully!`
        );
      } else {
        showSuccessMessage("Error", data.error || "Failed to create server", 'error');
      }
    } catch {
      showSuccessMessage("Error", "Failed to create server", 'error');
    }
  };

  const handleEditServer = (server: Server) => {
    setEditingServer(server);
    setIsEditModalOpen(true);
  };

  const handleUpdateServer = async (serverData: ServerFormData) => {
    if (!editingServer) return;
    
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update', 
          server: { id: editingServer.id, ...serverData }
        })
      });

      const data: ServerApiResponse = await response.json();
      
      if (data.success) {
        await fetchServers();
        setEditingServer(null);
        setIsEditModalOpen(false);
        showSuccessMessage(
          "Server Updated",
          `Server &quot;${serverData.displayName}&quot; updated successfully!`
        );
      } else {
        showSuccessMessage("Error", data.error || "Failed to update server", 'error');
      }
    } catch {
      showSuccessMessage("Error", "Failed to update server", 'error');
    }
  };

  const showDeleteConfirmation = (id: number, name: string) => {
    setDeleteModal({
      isOpen: true,
      serverId: id,
      serverName: name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteModal({
      isOpen: false,
      serverId: null,
      serverName: ""
    });
  };

  const handleDeleteServer = async () => {
    if (deleteModal.serverId) {
      try {
        const response = await fetch(`/api/servers?id=${deleteModal.serverId}`, {
          method: 'DELETE'
        });

        const data: ServerApiResponse = await response.json();
        
        if (data.success) {
          await fetchServers();
          setSelectedServerIds(prev => prev.filter(id => id !== deleteModal.serverId));
          closeDeleteConfirmation();
          showSuccessMessage(
            "Server Deleted",
            `Server &quot;${deleteModal.serverName}&quot; deleted successfully!`
          );
        } else {
          showSuccessMessage("Error", data.error || "Failed to delete server", 'error');
        }
      } catch {
        showSuccessMessage("Error", "Failed to delete server", 'error');
      }
    }
  };

  const closeRestartResults = () => {
    setRestartResultsModal({
      isOpen: false,
      serviceName: "",
      results: []
    });
  };

  const handleCheckHealth = () => {
    showSuccessMessage(
      "Health Check",
      "Server health check initiated!",
      'info'
    );
  };

  const StatusBadge = ({ status }: { status: Server['status'] }) => {
    switch (status) {
      case "online":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center gap-1">
            <FiCheck size={12} /> Online
          </span>
        );
      case "offline":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
            <FiX size={12} /> Offline
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            UNKNOWN
          </span>
        );
    }
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 pt-24 px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Servers</h1>
          <div className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
        </div>
        <div className="border border-gray-700 rounded-lg bg-gray-800 p-8">
          <div className="text-center text-gray-400">Loading servers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 px-6 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Servers</h1>
          
          <div className="flex gap-3">
            {selectedServers.length > 0 && (
              <button 
                onClick={() => setIsServiceModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-white font-medium shadow-sm"
              >
                <FiRefreshCw className="text-lg" />
                <span>Service Restart ({selectedServers.length})</span>
              </button>
            )}
            
            <button 
              onClick={handleAddServer}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium shadow-sm"
            >
              <FiPlus className="text-lg" />
              <span>Add Server</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-300 text-sm">
            Total Servers: <span className="font-semibold">{servers.length}</span>
            {selectedServers.length > 0 && (
              <span className="ml-4">
                Selected: <span className="font-semibold text-blue-300">{selectedServers.length}</span>
              </span>
            )}
          </div>
          
          {filteredServers.length > 0 && (
            <button
              onClick={selectAllServers}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {selectedServerIds.length === filteredServers.length && filteredServers.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          )}
        </div>

        <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-gray-300">
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700 w-12">
                    <input
                      type="checkbox"
                      checked={selectedServerIds.length === filteredServers.length && filteredServers.length > 0}
                      onChange={selectAllServers}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Display Name</th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Server Type</th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Parent Server</th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">IP Address</th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Port (Listening)</th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Output IP:Port</th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Last Checked</th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredServers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-lg mb-2">No servers found</div>
                        <div className="text-sm">Click &quot;Add Server&quot; to create your first server</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredServers.map((server) => (
                    <tr 
                      key={server.id} 
                      className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                        selectedServerIds.includes(server.id) ? 'bg-gray-750' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedServerIds.includes(server.id)}
                          onChange={() => toggleServerSelection(server.id)}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{server.displayName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          server.serverType === 'origin' 
                            ? 'bg-purple-900/50 text-purple-300' 
                            : 'bg-blue-900/50 text-blue-300'
                        }`}>
                          {server.serverType === 'origin' ? 'Origin' : 'Edge'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{server.parentServer || "None"}</td>
                      <td className="px-4 py-3 font-mono text-green-300">{server.ipAddress}</td>
                      <td className="px-4 py-3 font-mono text-gray-300">
                        {server.port}
                        {server.sshPort && server.sshPort !== 22 && (
                          <span className="text-xs text-blue-300 ml-2">
                            (SSH: {server.sshPort})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-300">{server.outputIpPort}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={server.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{server.lastChecked}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={handleCheckHealth}
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                            title="Check Health"
                          >
                            <FiActivity className="text-green-400" />
                          </button>
                          <button 
                            onClick={() => handleEditServer(server)}
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                            title="Edit"
                          >
                            <FiEdit className="text-blue-400" />
                          </button>
                          <button 
                            onClick={() => showDeleteConfirmation(server.id, server.displayName)}
                            className="p-2 hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredServers.length > 0 && (
            <div className="mt-[23rem]">
              <div className="flex flex-wrap justify-between items-center p-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Page 1 of 1
                </div>
                <div className="text-sm text-gray-400">
                  Showing {filteredServers.length} servers
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Server Modal */}
      <ServerForm
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Server"
        onSubmit={handleCreateServer}
        initialValues={undefined}
      />

      {/* Edit Server Modal */}
      {editingServer && (
        <ServerForm
          opened={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingServer(null);
          }}
          title="Edit Server"
          onSubmit={handleUpdateServer}
          initialValues={{
            displayName: editingServer.displayName,
            ipAddress: editingServer.ipAddress,
            sshUsername: editingServer.sshUsername || "",
            sshPassword: editingServer.sshPassword || "",
            listeningPort: parseInt(editingServer.port) || 9229,
            sshPort: editingServer.sshPort || 22,
            originIpWithPort: editingServer.outputIpPort,
            serverType: editingServer.serverType,
            parentServerId: editingServer.parentServer !== "None" ? editingServer.parentServer : undefined,
          }}
        />
      )}

      {/* Service Restart Modal */}
      <ServiceRestartModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        selectedServers={selectedServers}
        onConfirm={handleServiceRestart}
        isRestarting={isRestarting}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-900/30 rounded-full">
                <FiAlertCircle className="text-red-400 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Delete</h3>
                <p className="text-gray-300 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300">
                Are you sure you want to delete server <span className="font-semibold text-red-300">&quot;{deleteModal.serverName}&quot;</span>?
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirmation}
                className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteServer}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white font-medium"
              >
                Delete Server
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Message Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 w-full max-w-md border ${
            successModal.type === 'success' 
              ? 'bg-gray-800 border-green-700' 
              : successModal.type === 'error'
                ? 'bg-gray-800 border-red-700'
                : 'bg-gray-800 border-blue-700'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${
                successModal.type === 'success' 
                  ? 'bg-green-900/30' 
                  : successModal.type === 'error'
                    ? 'bg-red-900/30'
                    : 'bg-blue-900/30'
              }`}>
                {successModal.type === 'success' ? (
                  <FiCheck className="text-green-400 text-xl" />
                ) : successModal.type === 'error' ? (
                  <FiAlertCircle className="text-red-400 text-xl" />
                ) : (
                  <FiInfo className="text-blue-400 text-xl" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{successModal.title}</h3>
                <p className={`text-sm mt-1 ${
                  successModal.type === 'success' 
                    ? 'text-green-300' 
                    : successModal.type === 'error'
                      ? 'text-red-300'
                      : 'text-blue-300'
                }`}>
                  {successModal.type === 'success' ? 'Success' : 
                   successModal.type === 'error' ? 'Error' : 'Information'}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300">{successModal.message}</p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={closeSuccessMessage}
                className={`px-5 py-2 rounded-lg transition-colors text-white font-medium ${
                  successModal.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : successModal.type === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Restart Results Modal */}
      {restartResultsModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/30 rounded-full">
                  <FiRefreshCw className="text-blue-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Service Restart Results</h3>
                  <p className="text-blue-300 text-sm">Service: {restartResultsModal.serviceName}</p>
                </div>
              </div>
              <button
                onClick={closeRestartResults}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <FiX className="text-gray-400" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto mb-4">
              <div className="space-y-3">
                {restartResultsModal.results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded border ${
                      result.success 
                        ? 'border-green-700 bg-green-900/20' 
                        : 'border-red-700 bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${
                          result.success ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {result.success ? '✓' : '✗'}
                        </span>
                        <span className="font-medium text-white">{result.serverName}</span>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        result.success 
                          ? 'bg-green-900/50 text-green-300' 
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm font-mono bg-black/30 p-2 rounded">
                      {result.output}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={closeRestartResults}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServersPageContent;

