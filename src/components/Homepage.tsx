// // Homepage.tsx
// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import { 
//   FiRefreshCcw, FiSearch, FiTrash2, FiAlertCircle, FiChevronLeft, 
//   FiChevronRight, FiEdit, FiArrowLeft, FiPlus, FiCheckSquare, FiSquare 
// } from "react-icons/fi";
// import Header from "./Header";
// import CreateRouteModal from "../components/CreateRouteModal";

// interface Route {
//   path?: string;
//   request?: string;
//   origin?: string;
//   redirect?: string;
//   host?: string;
//   origin_path?: string;
//   originPath?: string;
//   use_ssl?: string;
//   useSSL?: string;
// }

// interface RouteAssignment {
//   id: number;
//   request: string;
//   redirect: string;
//   assignedServer: string;
//   sourceServer: string;
//   source: string;
//   status: "success" | "error" | "pending";
//   host?: string;
//   origin?: string;
//   originPath?: string;
//   useSSL?: string;
// }

// interface Server {
//   id: number;
//   displayName: string;
//   ipAddress: string;
//   sshUsername: string;
//   sshPassword: string;
//   port: string;
//   sshPort?: number;
//   serverType: "origin" | "edge";
// }

// interface RulesResponse {
//   routes: Route[];
//   error?: string;
// }

// // Bulk delete confirmation modal props
// interface BulkDeleteModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => void;
//   selectedCount: number;
//   isLoading: boolean;
// }

// // Bulk Delete Confirmation Modal Component
// const BulkDeleteModal = ({ isOpen, onClose, onConfirm, selectedCount, isLoading }: BulkDeleteModalProps) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
//       <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
//         <div className="flex items-center gap-3 mb-4">
//           <div className="p-2 bg-red-900/30 rounded-full">
//             <FiAlertCircle className="text-red-400 text-xl" />
//           </div>
//           <div>
//             <h3 className="text-lg font-bold text-white">Confirm Bulk Delete</h3>
//             <p className="text-gray-300 text-sm mt-1">This action cannot be undone</p>
//           </div>
//         </div>
        
//         <div className="mb-6">
//           <p className="text-gray-300">
//             Are you sure you want to delete <span className="font-semibold text-red-300">{selectedCount}</span> selected route(s) from their respective servers?
//           </p>
//           <p className="text-xs text-gray-400 mt-2">
//             Note: Routes will be deleted from the servers they belong to. This may take a few moments.
//           </p>
//         </div>
        
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             disabled={isLoading}
//             className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-white font-medium disabled:opacity-50"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onConfirm}
//             disabled={isLoading}
//             className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white font-medium disabled:opacity-50 flex items-center gap-2"
//           >
//             {isLoading ? (
//               <>
//                 <span className="animate-spin">⟳</span>
//                 <span>Deleting...</span>
//               </>
//             ) : (
//               <>
//                 <FiTrash2 />
//                 <span>Delete {selectedCount} Routes</span>
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Homepage = () => {
//   const [search, setSearch] = useState("");
//   const [stream, setStream] = useState("all");
//   const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
//   const [filteredAssignments, setFilteredAssignments] = useState<RouteAssignment[]>([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(100);
//   const [isLoading, setIsLoading] = useState(false);
//   const [servers, setServers] = useState<Server[]>([]);
//   const [lastReloadTime, setLastReloadTime] = useState<string>("Never");
//   const [selectedAssignment, setSelectedAssignment] = useState<RouteAssignment | null>(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [editFormData, setEditFormData] = useState({
//     request: "",
//     redirect: "",
//     host: "",
//     originPath: "",
//     useSSL: "false"
//   });

//   // Bulk selection states
//   const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
//   const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
//   const [isBulkDeleting, setIsBulkDeleting] = useState(false);

//   // Add ref to track assignments for useCallback
//   const assignmentsRef = useRef(assignments);
  
//   useEffect(() => {
//     assignmentsRef.current = assignments;
//   }, [assignments]);

//   // Load servers from API
//   useEffect(() => {
//     fetchServers();
//   }, []);

//   const fetchServers = async () => {
//     try {
//       const response = await fetch('/api/servers');
//       const data = await response.json();
      
//       if (data.success) {
//         setServers(data.servers);
//         console.log("Loaded servers from API:", data.servers.length);
//       } else {
//         console.error("Failed to load servers:", data.error);
//       }
//     } catch (error) {
//       console.error("Error fetching servers:", error);
//     }
//   };

//   // Filter assignments based on search
//   useEffect(() => {
//     if (search.trim() === "") {
//       setFilteredAssignments(assignments);
//     } else {
//       const filtered = assignments.filter(item =>
//         item.request.toLowerCase().includes(search.toLowerCase()) ||
//         item.redirect.toLowerCase().includes(search.toLowerCase()) ||
//         item.assignedServer.toLowerCase().includes(search.toLowerCase()) ||
//         item.sourceServer.toLowerCase().includes(search.toLowerCase()) ||
//         (item.host && item.host.toLowerCase().includes(search.toLowerCase()))
//       );
//       setFilteredAssignments(filtered);
//     }
//     setCurrentPage(1);
//     // Clear selections when filter changes
//     setSelectedRouteIds([]);
//   }, [search, assignments]);

//   // Filter by stream
//   useEffect(() => {
//     if (stream === "all") {
//       setFilteredAssignments(assignments);
//     } else {
//       const filtered = assignments.filter(item => {
//         if (stream === "hls") {
//           return item.request.includes(".m3u8") || 
//                  item.redirect.includes(".m3u8") || 
//                  item.request.toLowerCase().includes("hls");
//         } else if (stream === "dash") {
//           return item.request.includes(".mpd") || 
//                  item.redirect.includes(".mpd") ||
//                  item.request.toLowerCase().includes("dash");
//         } else if (stream === "tv") {
//           return !item.request.includes(".m3u8") && 
//                  !item.redirect.includes(".m3u8") &&
//                  !item.request.includes(".mpd") && 
//                  !item.redirect.includes(".mpd");
//         }
//         return true;
//       });
//       setFilteredAssignments(filtered);
//     }
//     setCurrentPage(1);
//     // Clear selections when stream filter changes
//     setSelectedRouteIds([]);
//   }, [stream, assignments]);

//   const fetchRulesFromServer = async (server: Server): Promise<RulesResponse | null> => {
//     try {
//       console.log(`Fetching rules from ${server.ipAddress}...`);
      
//       const response = await fetch('/api/fetch-rules', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ipAddress: server.ipAddress,
//           sshUsername: server.sshUsername,
//           sshPassword: server.sshPassword,
//           sshPort: server.sshPort || 22
//         })
//       });

//       const data = await response.json();
      
//       console.log(`Response from ${server.ipAddress}:`, {
//         success: data.success,
//         routesCount: data.data?.routes?.length || 0,
//         error: data.data?.error
//       });
      
//       if (!data.success) {
//         throw new Error(data.message || data.data?.error || "Failed to fetch rules");
//       }

//       return data.data;

//     } catch {
//       console.error(`Error fetching rules from ${server.ipAddress}`);
//       return { 
//         routes: [], 
//         error: "Connection failed" 
//       };
//     }
//   };

//   const fetchRulesFromAllServers = useCallback(async () => {
//     if (servers.length === 0) {
//       console.log("No servers available to fetch rules from");
//       alert("No servers found. Please add servers first.");
//       return;
//     }

//     setIsLoading(true);
    
//     const newAssignments: RouteAssignment[] = [];
//     let assignmentId = 1;

//     for (const server of servers) {
//       try {
//         console.log(`Fetching rules from server: ${server.displayName} (${server.ipAddress})`);
        
//         newAssignments.push({
//           id: assignmentId++,
//           request: `Connecting to ${server.ipAddress}...`,
//           redirect: "Fetching rules.conf...",
//           assignedServer: server.ipAddress,
//           sourceServer: server.displayName,
//           source: "Connecting",
//           status: "pending"
//         });

//         setAssignments([...newAssignments]);

//         const rulesData = await fetchRulesFromServer(server);
        
//         // Remove the connecting message
//         const updatedAssignments = newAssignments.filter(a => 
//           !(a.request === `Connecting to ${server.ipAddress}...` && a.status === "pending")
//         );
        
//         if (rulesData && rulesData.routes && Array.isArray(rulesData.routes) && rulesData.routes.length > 0) {
//           console.log(`Found ${rulesData.routes.length} routes in ${server.displayName}`);
                  
//           rulesData.routes.forEach((route: Route) => {
//             const requestPath = route.path || route.request || '';
//             let redirectUrl = route.origin || route.redirect || '';
//             const originPath = route.origin_path || route.originPath || '';
            
//             // Construct full URL with origin_path or requestPath
//             if (redirectUrl && !redirectUrl.includes('Error')) {
//               redirectUrl = redirectUrl.replace(/\/$/, '');
              
//               if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
//                 redirectUrl = `http://${redirectUrl}`;
//               }
              
//               const pathToAdd = originPath || requestPath;
//               if (pathToAdd && pathToAdd !== '/' && !redirectUrl.includes(pathToAdd)) {
//                 redirectUrl = `${redirectUrl}${pathToAdd}`;
//               }
//             }
            
//             if (!requestPath || !redirectUrl) {
//               console.warn('Skipping route missing path or origin:', route);
//               return;
//             }
            
//             updatedAssignments.push({
//               id: assignmentId++,
//               request: requestPath,
//               redirect: redirectUrl,
//               assignedServer: server.ipAddress,
//               sourceServer: server.displayName,
//               source: "rules.conf",
//               status: "success",
//               host: route.host || '',
//               origin: route.origin || '',
//               originPath: originPath || requestPath,
//               useSSL: route.use_ssl || route.useSSL || 'false'
//             });
//           });
//         } else {
//           const errorMessage = rulesData?.error || "No routes found in rules.conf";
//           console.log(`No routes for ${server.displayName}: ${errorMessage}`);
          
//           updatedAssignments.push({
//             id: assignmentId++,
//             request: `/server-${server.ipAddress}/`,
//             redirect: errorMessage,
//             assignedServer: server.ipAddress,
//             sourceServer: server.displayName,
//             source: rulesData?.error ? "Error" : "Empty Config",
//             status: rulesData?.error ? "error" : "success"
//           });
//         }

//         newAssignments.length = 0;
//         newAssignments.push(...updatedAssignments);
//         setAssignments([...newAssignments]);

//       } catch {
//         console.error(`Failed to fetch rules from ${server.displayName}`);
        
//         const updatedAssignments = newAssignments.filter(a => 
//           !(a.request === `Connecting to ${server.ipAddress}...` && a.status === "pending")
//         );

//         updatedAssignments.push({
//           id: assignmentId++,
//           request: `/server-${server.ipAddress}/`,
//           redirect: `SSH Error: Connection failed`,
//           assignedServer: server.ipAddress,
//           sourceServer: server.displayName,
//           source: "SSH Error",
//           status: "error"
//         });

//         newAssignments.length = 0;
//         newAssignments.push(...updatedAssignments);
//         setAssignments([...newAssignments]);
//       }
//     }

//     setIsLoading(false);
//     setLastReloadTime(new Date().toLocaleString());
//     // Clear selections after reload
//     setSelectedRouteIds([]);
//   }, [servers]);

//   const handleReload = async () => {
//     await fetchRulesFromAllServers();
//     setCurrentPage(1);
//   };

//   useEffect(() => {
//     if (servers.length > 0) {
//       fetchRulesFromAllServers();
//     }
//   }, [servers, fetchRulesFromAllServers]);

//   const handleCreateRoute = async (data: {
//     originUrls: string[];
//     selectedServers: Server[];
//   }) => {
//     const { originUrls, selectedServers } = data;
    
//     if (originUrls.length === 0 || selectedServers.length === 0) {
//       alert("Please add at least one URL and select at least one server");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       interface RouteToAdd {
//         host: string;
//         path: string;
//         origin: string;
//         origin_path: string;
//         use_ssl: string;
//         geo: string;
//         range: string;
//         playlist_caching_interval: string;
//       }

//       const routesToAdd: RouteToAdd[] = [];
      
//       for (const url of originUrls) {
//         try {
//           const urlObj = new URL(url);
//           const path = urlObj.pathname || "/";
//           const origin = urlObj.host;
//           const useSSL = url.startsWith('https') ? 'true' : 'false';
          
//           routesToAdd.push({
//             host: "",
//             path: path,
//             origin: origin,
//             origin_path: path,
//             use_ssl: useSSL,
//             geo: "",
//             range: "",
//             playlist_caching_interval: "1"
//           });
//         } catch {
//           routesToAdd.push({
//             host: "",
//             path: "/stream/",
//             origin: url,
//             origin_path: "/stream/",
//             use_ssl: "false",
//             geo: "",
//             range: "",
//             playlist_caching_interval: "1"
//           });
//         }
//       }

//       const writePromises = selectedServers.map(async (server) => {
//         const response = await fetch('/api/write-rules', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             serverId: server.id,
//             ipAddress: server.ipAddress,
//             sshUsername: server.sshUsername,
//             sshPassword: server.sshPassword,
//             sshPort: server.sshPort || 22,
//             routes: routesToAdd,
//             action: 'append'
//           })
//         });

//         const result = await response.json();
//         return { server: server.displayName, success: result.success, message: result.message };
//       });

//       const results = await Promise.all(writePromises);
      
//       const allSuccess = results.every(r => r.success);
      
//       if (allSuccess) {
//         await fetchRulesFromAllServers();
//         alert(`Routes created successfully on ${selectedServers.length} server(s)!`);
//       } else {
//         const failed = results.filter(r => !r.success).map(r => r.server);
//         alert(`Failed to write routes to: ${failed.join(', ')}`);
//       }
      
//     } catch (error) {
//       console.error("Error creating routes:", error);
//       alert("Failed to create routes. Please try again.");
//     } finally {
//       setIsLoading(false);
//       setShowCreateModal(false);
//     }
//   };

//   // Toggle single route selection
//   const toggleRouteSelection = (routeId: number) => {
//     setSelectedRouteIds(prev => 
//       prev.includes(routeId) 
//         ? prev.filter(id => id !== routeId)
//         : [...prev, routeId]
//     );
//   };

//   // Select/Deselect all routes on current page
//   const toggleSelectAll = () => {
//     const currentPageIds = currentPageData
//       .filter(a => a.source === "rules.conf") // Only selectable routes
//       .map(a => a.id);
    
//     if (selectedRouteIds.length === currentPageIds.length && currentPageIds.length > 0) {
//       // Deselect all
//       setSelectedRouteIds([]);
//     } else {
//       // Select all
//       setSelectedRouteIds(currentPageIds);
//     }
//   };

//   // Handle bulk delete
//   const handleBulkDelete = async () => {
//     if (selectedRouteIds.length === 0) return;

//     setIsBulkDeleting(true);

//     try {
//       // Group selected routes by server
//       const routesByServer = new Map<string, { server: Server; routes: RouteAssignment[] }>();
      
//       selectedRouteIds.forEach(id => {
//         const route = assignments.find(a => a.id === id);
//         if (!route || route.source !== "rules.conf") return;
        
//         const server = servers.find(s => s.displayName === route.sourceServer);
//         if (!server) return;
        
//         const key = `${server.id}`;
//         if (!routesByServer.has(key)) {
//           routesByServer.set(key, { server, routes: [] });
//         }
//         routesByServer.get(key)!.routes.push(route);
//       });

//       // Delete routes from each server
//       const deletePromises = Array.from(routesByServer.values()).map(async ({ server, routes }) => {
//         const routesToDelete = routes.map(route => ({
//           host: route.host || "",
//           path: route.request,
//           origin: route.origin || new URL(route.redirect).host || server.ipAddress,
//           origin_path: route.originPath || route.request,
//           use_ssl: route.useSSL || "false",
//           geo: "",
//           range: "",
//           playlist_caching_interval: "1"
//         }));

//         const response = await fetch('/api/write-rules', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             serverId: server.id,
//             ipAddress: server.ipAddress,
//             sshUsername: server.sshUsername,
//             sshPassword: server.sshPassword,
//             sshPort: server.sshPort || 22,
//             routes: routesToDelete,
//             action: 'delete'
//           })
//         });

//         const result = await response.json();
//         return { server: server.displayName, success: result.success, count: routes.length };
//       });

//       const results = await Promise.all(deletePromises);
      
//       // Reload data
//       await fetchRulesFromAllServers();
      
//       // Show summary
//       const successful = results.filter(r => r.success);
//       const failed = results.filter(r => !r.success);
      
//       if (failed.length === 0) {
//         alert(`Successfully deleted ${selectedRouteIds.length} route(s) from ${successful.length} server(s)!`);
//       } else {
//         alert(`Partially completed: Deleted from ${successful.length} servers, failed on ${failed.length} servers. Please check individual servers.`);
//       }
      
//       setSelectedRouteIds([]);
//       setShowBulkDeleteModal(false);
      
//     } catch (error) {
//       console.error("Error in bulk delete:", error);
//       alert("Failed to delete routes. Please try again.");
//     } finally {
//       setIsBulkDeleting(false);
//     }
//   };

//   const handleDelete = async (id: number) => {
//     const assignmentToDelete = assignments.find(a => a.id === id);
//     if (!assignmentToDelete) return;

//     const server = servers.find(s => s.displayName === assignmentToDelete.sourceServer);
//     if (!server) {
//       alert("Server not found");
//       return;
//     }

//     if (!window.confirm(`Are you sure you want to delete this route from server ${server.displayName}?`)) {
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const routesToDelete = [{
//         host: assignmentToDelete.host || "",
//         path: assignmentToDelete.request,
//         origin: assignmentToDelete.origin || new URL(assignmentToDelete.redirect).host || server.ipAddress,
//         origin_path: assignmentToDelete.originPath || assignmentToDelete.request,
//         use_ssl: assignmentToDelete.useSSL || "false",
//         geo: "",
//         range: "",
//         playlist_caching_interval: "1"
//       }];

//       const response = await fetch('/api/write-rules', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           serverId: server.id,
//           ipAddress: server.ipAddress,
//           sshUsername: server.sshUsername,
//           sshPassword: server.sshPassword,
//           sshPort: server.sshPort || 22,
//           routes: routesToDelete,
//           action: 'delete'
//         })
//       });

//       const result = await response.json();
      
//       if (result.success) {
//         await fetchRulesFromAllServers();
        
//         if (showDetailsModal && selectedAssignment?.id === id) {
//           setShowDetailsModal(false);
//         }
        
//         // Remove from selected IDs if present
//         setSelectedRouteIds(prev => prev.filter(selectedId => selectedId !== id));
        
//         alert("Route deleted successfully from server!");
//       } else {
//         alert(`Failed to delete route: ${result.error}`);
//       }
      
//     } catch (error) {
//       console.error("Error deleting route:", error);
//       alert("Failed to delete route. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleViewDetails = (assignment: RouteAssignment) => {
//     setSelectedAssignment(assignment);
//     setShowDetailsModal(true);
//     setShowEditModal(false);
//   };

//   const handleRowClick = (assignment: RouteAssignment, e: React.MouseEvent) => {
//     // Don't trigger if clicking on checkbox or action buttons
//     const target = e.target as HTMLElement;
//     if (target.closest('input[type="checkbox"]') || target.closest('button')) {
//       return;
//     }
//     handleViewDetails(assignment);
//   };

//   const handleEditClick = (assignment: RouteAssignment, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setSelectedAssignment(assignment);
//     setEditFormData({
//       request: assignment.request,
//       redirect: assignment.redirect,
//       host: assignment.host || '',
//       originPath: assignment.originPath || '',
//       useSSL: assignment.useSSL || 'false'
//     });
//     setShowEditModal(true);
//     setShowDetailsModal(false);
//   };

//   const handleDeleteClick = (assignment: RouteAssignment, e: React.MouseEvent) => {
//     e.stopPropagation();
//     handleDelete(assignment.id);
//   };

//   const handleEditSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!selectedAssignment) return;
    
//     const server = servers.find(s => s.displayName === selectedAssignment.sourceServer);
//     if (!server) {
//       alert("Server not found");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const deleteRoutes = [{
//         host: selectedAssignment.host || "",
//         path: selectedAssignment.request,
//         origin: selectedAssignment.origin || new URL(selectedAssignment.redirect).host || server.ipAddress,
//         origin_path: selectedAssignment.originPath || selectedAssignment.request,
//         use_ssl: selectedAssignment.useSSL || "false",
//         geo: "",
//         range: "",
//         playlist_caching_interval: "1"
//       }];

//       await fetch('/api/write-rules', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           serverId: server.id,
//           ipAddress: server.ipAddress,
//           sshUsername: server.sshUsername,
//           sshPassword: server.sshPassword,
//           sshPort: server.sshPort || 22,
//           routes: deleteRoutes,
//           action: 'delete'
//         })
//       });

//       const addRoutes = [{
//         host: editFormData.host,
//         path: editFormData.request,
//         origin: new URL(editFormData.redirect).host || server.ipAddress,
//         origin_path: editFormData.originPath || editFormData.request,
//         use_ssl: editFormData.useSSL,
//         geo: "",
//         range: "",
//         playlist_caching_interval: "1"
//       }];

//       const response = await fetch('/api/write-rules', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           serverId: server.id,
//           ipAddress: server.ipAddress,
//           sshUsername: server.sshUsername,
//           sshPassword: server.sshPassword,
//           sshPort: server.sshPort || 22,
//           routes: addRoutes,
//           action: 'append'
//         })
//       });

//       const result = await response.json();
      
//       if (result.success) {
//         await fetchRulesFromAllServers();
//         setShowEditModal(false);
//         alert("Route updated successfully on server!");
//       } else {
//         alert(`Failed to update route: ${result.error}`);
//       }
      
//     } catch (error) {
//       console.error("Error updating route:", error);
//       alert("Failed to update route. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleBackToDetails = () => {
//     setShowEditModal(false);
//     setShowDetailsModal(true);
//   };

//   const totalItems = filteredAssignments.length;
//   const totalPages = Math.ceil(totalItems / pageSize);
//   const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
//   const endItem = Math.min(currentPage * pageSize, totalItems);
//   const currentPageData = filteredAssignments.slice(startItem - 1, endItem);

//   const handlePageSizeChange = (newSize: number) => {
//     setPageSize(newSize);
//     setCurrentPage(1);
//     setSelectedRouteIds([]); // Clear selections when page size changes
//   };

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//     setSelectedRouteIds([]); // Clear selections when page changes
//   };

//   // Check if all selectable routes on current page are selected
//   const selectableRoutesOnPage = currentPageData.filter(a => a.source === "rules.conf");
//   const allSelected = selectableRoutesOnPage.length > 0 && 
//     selectableRoutesOnPage.every(route => selectedRouteIds.includes(route.id));

//   return (
//     <div className="min-h-screen bg-black text-white">
//       <Header onCreateRoute={handleCreateRoute} />
      
//       <div className="px-20 py-28">
//         <div className="mb-6 flex justify-between items-center">
//           <h1 className="text-3xl font-bold mb-2">Route Server Assignments</h1>
          
//           <div className="flex gap-3">
//             {/* Bulk Delete Button - Shows when routes are selected */}
//             {selectedRouteIds.length > 0 && (
//               <button
//                 onClick={() => setShowBulkDeleteModal(true)}
//                 disabled={isLoading || isBulkDeleting}
//                 className="px-4 py-2 rounded-lg flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white transition-colors"
//                 title={`Delete ${selectedRouteIds.length} selected routes`}
//               >
//                 <FiTrash2 className="text-lg" />
//                 <span>Delete Selected ({selectedRouteIds.length})</span>
//               </button>
//             )}
            
//             <button
//               onClick={() => setShowCreateModal(true)}
//               disabled={servers.length === 0}
//               className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
//                 servers.length > 0
//                   ? "bg-green-600 hover:bg-green-700 text-white"
//                   : "bg-gray-700 text-gray-400 cursor-not-allowed"
//               }`}
//               title={servers.length === 0 ? "Add servers first" : "Create new route"}
//             >
//               <FiPlus className="text-lg" />
//               <span>Create Route</span>
//             </button>
//           </div>
//         </div>

//         <div className="mb-6">
//           <div className="flex flex-wrap items-center gap-4 mb-4">
//             <div className="flex-1 relative">
//               <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search routes or servers..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500"
//               />
//             </div>

//             <select
//               value={stream}
//               onChange={(e) => setStream(e.target.value)}
//               className="px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 text-sm"
//             >
//               <option value="all">All Routes</option>
//               <option value="hls">HLS Streams</option>
//               <option value="dash">DASH Streams</option>
//               <option value="tv">TV Channels</option>
//             </select>

//             <button 
//               onClick={handleReload}
//               disabled={isLoading || servers.length === 0}
//               className="p-2 rounded bg-[#1a1a1a] border border-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//             >
//               {isLoading ? (
//                 <>
//                   <span className="animate-spin">⟳</span>
//                   <span>Fetching...</span>
//                 </>
//               ) : (
//                 <>
//                   <FiRefreshCcw className="text-lg" />
//                   <span>Reload Rules</span>
//                 </>
//               )}
//             </button>

//             <div className={`px-3 py-1 rounded text-sm ${
//               servers.length === 0 
//                 ? "bg-red-900/30 text-red-300" 
//                 : "bg-blue-900/30 text-blue-300"
//             }`}>
//               Servers: {servers.length}
//               {servers.length === 0 && " (Add servers first)"}
//             </div>

//             {lastReloadTime !== "Never" && (
//               <div className="px-3 py-1 bg-green-900/30 text-green-300 rounded text-sm">
//                 Last: {lastReloadTime}
//               </div>
//             )}
//           </div>
//         </div>
        
//         <div className="h-px bg-gray-700 mb-4"></div>

//         <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
//           <div className="flex flex-col">
//             <div className="text-gray-400 text-sm">
//               Showing <span className="text-white font-bold">{totalItems}</span> of <span className="text-white font-bold">{totalItems}</span> assignments
//               {selectedRouteIds.length > 0 && (
//                 <span className="ml-4 text-blue-400">
//                   {selectedRouteIds.length} selected
//                 </span>
//               )}
//             </div>
//           </div>
          
//           <div className="flex items-center gap-4">
//             <div className="px-3 py-1 rounded bg-purple-900/30 text-purple-300 text-sm">
//               {stream.toUpperCase()}: {totalItems}
//             </div>
//           </div>
//         </div>

//         <div className="border border-gray-700 rounded-lg overflow-hidden bg-yellow-700">
//           <div className="p-4 border-b border-gray-700">
//             <div className="flex justify-between items-center">
//               <div className="text-sm text-gray-400">
//                 Showing routes from {servers.length} server{servers.length !== 1 ? 's' : ''}
//               </div>
              
//               {servers.length === 0 && (
//                 <button 
//                   onClick={() => window.location.href = '/servers'}
//                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
//                 >
//                   Add Servers First
//                 </button>
//               )}
//             </div>
//           </div>

//           <div className="overflow-x-auto max-h-[500px]">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="bg-[#1a1a1a] text-gray-300 sticky top-0 z-10">
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700 w-12">
//                     {/* Select All Checkbox */}
//                     {selectableRoutesOnPage.length > 0 && (
//                       <button
//                         onClick={toggleSelectAll}
//                         className="text-gray-400 hover:text-white transition-colors"
//                         title={allSelected ? "Deselect all" : "Select all"}
//                       >
//                         {allSelected ? (
//                           <FiCheckSquare className="text-xl" />
//                         ) : (
//                           <FiSquare className="text-xl" />
//                         )}
//                       </button>
//                     )}
//                   </th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[300px]">
//                     Request comes to...
//                   </th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[400px]">
//                     ...and is redirected to
//                   </th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[150px]">
//                     Assigned server
//                   </th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[150px]">
//                     Source Server
//                   </th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[120px]">
//                     Source
//                   </th>
//                   <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[150px]">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredAssignments.length === 0 ? (
//                   <tr>
//                     <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
//                       <div className="flex flex-col items-center justify-center">
//                         {servers.length === 0 ? (
//                           <>
//                             <FiAlertCircle className="text-3xl text-red-500 mb-4" />
//                             <div className="text-lg mb-2">No servers configured</div>
//                             <div className="text-sm mb-4">Add servers first to fetch rules.conf data</div>
//                             <button 
//                               onClick={() => window.location.href = '/servers'}
//                               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
//                             >
//                               Go to Servers Page
//                             </button>
//                           </>
//                         ) : isLoading ? (
//                           <>
//                             <div className="animate-spin text-3xl mb-4">⟳</div>
//                             <div className="text-lg mb-2">Fetching rules from servers...</div>
//                             <div className="text-sm">Please wait while we connect to your servers</div>
//                           </>
//                         ) : (
//                           <>
//                             <div className="text-lg mb-2">No assignments found</div>
//                             <div className="text-sm mb-4">Click &quot;Reload Rules&quot; to fetch data from servers or create a new route</div>
//                             <div className="flex gap-3">
//                               <button 
//                                 onClick={handleReload}
//                                 className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
//                               >
//                                 Reload Rules
//                               </button>
//                               <button 
//                                 onClick={() => setShowCreateModal(true)}
//                                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2"
//                               >
//                                 <FiPlus />
//                                 Create Route
//                               </button>
//                             </div>
//                           </>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   currentPageData.map((assignment, index) => {
//                     const isSelectable = assignment.source === "rules.conf";
                    
//                     return (
//                       <tr 
//                         key={assignment.id} 
//                         onClick={(e) => handleRowClick(assignment, e)}
//                         className={`border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
//                           index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'
//                         } ${
//                           assignment.status === "error" ? "bg-red-900/20" :
//                           assignment.status === "pending" ? "bg-yellow-900/20" : ""
//                         } ${selectedRouteIds.includes(assignment.id) ? 'bg-blue-900/20' : ''}`}
//                       >
//                         <td className="px-4 py-3">
//                           {isSelectable ? (
//                             <input
//                               type="checkbox"
//                               checked={selectedRouteIds.includes(assignment.id)}
//                               onChange={() => toggleRouteSelection(assignment.id)}
//                               onClick={(e) => e.stopPropagation()}
//                               className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
//                             />
//                           ) : (
//                             <span className="text-gray-600 text-xs">-</span>
//                           )}
//                         </td>
//                         <td className="px-4 py-3">
//                           <div className="font-mono text-blue-300 break-all">
//                             {assignment.request}
//                             {assignment.status === "pending" && (
//                               <div className="flex items-center gap-2 mt-1">
//                                 <span className="animate-spin text-xs">⟳</span>
//                                 <span className="text-xs text-yellow-400">Connecting...</span>
//                               </div>
//                             )}
//                           </div>
//                           {assignment.host && assignment.host.trim() && (
//                             <div className="text-xs text-gray-400 mt-1">
//                               Host: {assignment.host}
//                             </div>
//                           )}
//                         </td>
                        
//                         <td className="px-4 py-3">
//                           <div className="font-mono text-green-300 break-all">
//                             {assignment.redirect && typeof assignment.redirect === 'string' && assignment.redirect.startsWith('http') 
//                               ? assignment.redirect 
//                               : assignment.redirect 
//                                 ? `http://${assignment.redirect}`
//                                 : 'No redirect URL'}
//                             {assignment.status === "error" && assignment.redirect && assignment.redirect.includes("Error") && (
//                               <div className="text-xs text-red-400 mt-1">
//                                 {assignment.redirect}
//                               </div>
//                             )}
//                           </div>
//                           {assignment.originPath && assignment.originPath !== assignment.request && (
//                             <div className="text-xs text-gray-400 mt-1">
//                               Origin Path: {assignment.originPath}
//                             </div>
//                           )}
//                         </td>
                        
//                         <td className="px-4 py-3">
//                           <span className={`px-3 py-1 rounded text-xs font-medium ${
//                             assignment.source === "rules.conf"
//                               ? "bg-blue-900/30 text-blue-300" 
//                               : assignment.status === "error"
//                               ? "bg-red-900/30 text-red-300"
//                               : assignment.status === "pending"
//                               ? "bg-yellow-900/30 text-yellow-300"
//                               : "bg-gray-800 text-gray-300"
//                           }`}>
//                             {assignment.assignedServer}
//                           </span>
//                         </td>
                        
//                         <td className="px-4 py-3">
//                           <div className="bg-white text-black font-medium px-3 py-1 rounded text-sm inline-block">
//                             {assignment.sourceServer}
//                           </div>
//                         </td>
                        
//                         <td className="px-4 py-3">
//                           <span className={`px-3 py-1 rounded text-xs font-medium ${
//                             assignment.source === "rules.conf" 
//                               ? "bg-green-900/30 text-green-300" 
//                               : assignment.source === "Error" || assignment.source === "SSH Error"
//                               ? "bg-red-900/30 text-red-300"
//                               : assignment.source === "Connecting"
//                               ? "bg-yellow-900/30 text-yellow-300"
//                               : "bg-gray-800 text-gray-300"
//                           }`}>
//                             {assignment.source}
//                           </span>
//                           {assignment.useSSL && assignment.useSSL === 'true' && (
//                             <div className="text-xs text-yellow-400 mt-1">SSL Enabled</div>
//                           )}
//                         </td>
                        
//                         <td className="px-4 py-3">
//                           <div className="flex gap-2">
//                             <button 
//                               onClick={(e) => handleEditClick(assignment, e)}
//                               className="bg-blue-600/20 hover:bg-blue-600/40 rounded-lg border border-blue-500/30 transition-all duration-200 shadow-lg hover:shadow-blue-500/20 p-2"
//                               title="Edit route"
//                               disabled={assignment.source !== "rules.conf"}
//                             >
//                               <FiEdit className={`text-xl font-bold ${assignment.source === "rules.conf" ? "text-blue-400" : "text-gray-500"}`} size={20} />
//                             </button>
//                             <button 
//                               onClick={(e) => handleDeleteClick(assignment, e)}
//                               className="bg-red-600/20 hover:bg-red-600/40 rounded-lg border border-red-500/30 transition-all duration-200 shadow-lg hover:shadow-red-500/20 p-2"
//                               title="Delete route"
//                               disabled={assignment.source !== "rules.conf"}
//                             >
//                               <FiTrash2 className={`text-xl font-bold ${assignment.source === "rules.conf" ? "text-red-400" : "text-gray-500"}`} size={20} />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {filteredAssignments.length > 0 && totalPages > 1 && (
//             <div className="flex flex-wrap justify-between items-center p-4 border-t border-gray-700">
//               <div className="text-sm text-gray-400 mb-2 md:mb-0">
//                 Page Size: 
//                 <select 
//                   value={pageSize}
//                   onChange={(e) => handlePageSizeChange(Number(e.target.value))}
//                   className="ml-2 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1"
//                 >
//                   <option value={10}>10</option>
//                   <option value={25}>25</option>
//                   <option value={50}>50</option>
//                   <option value={100}>100</option>
//                   <option value={200}>200</option>
//                 </select>
//               </div>
              
//               <div className="text-sm text-gray-400 mb-2 md:mb-0">
//                 {startItem} to {endItem} of {totalItems}
//               </div>
              
//               <div className="flex items-center gap-2">
//                 <button 
//                   onClick={() => handlePageChange(currentPage - 1)}
//                   disabled={currentPage === 1}
//                   className="px-3 py-1 bg-[#1a1a1a] border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
//                 >
//                   <FiChevronLeft size={14} />
//                   <span>Prev</span>
//                 </button>
                
//                 <div className="flex items-center gap-1">
//                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                     let pageNum;
//                     if (totalPages <= 5) {
//                       pageNum = i + 1;
//                     } else if (currentPage <= 3) {
//                       pageNum = i + 1;
//                     } else if (currentPage >= totalPages - 2) {
//                       pageNum = totalPages - 4 + i;
//                     } else {
//                       pageNum = currentPage - 2 + i;
//                     }
                    
//                     return (
//                       <button
//                         key={pageNum}
//                         onClick={() => handlePageChange(pageNum)}
//                         className={`px-3 py-1 rounded ${
//                           currentPage === pageNum
//                             ? 'bg-blue-600 text-white'
//                             : 'bg-[#1a1a1a] border border-gray-700 text-gray-300 hover:bg-gray-800'
//                         }`}
//                       >
//                         {pageNum}
//                       </button>
//                     );
//                   })}
                  
//                   {totalPages > 5 && currentPage < totalPages - 2 && (
//                     <>
//                       <span className="text-gray-500">...</span>
//                       <button
//                         onClick={() => handlePageChange(totalPages)}
//                         className={`px-3 py-1 rounded ${
//                           currentPage === totalPages
//                             ? 'bg-blue-600 text-white'
//                             : 'bg-[#1a1a1a] border border-gray-700 text-gray-300 hover:bg-gray-800'
//                         }`}
//                       >
//                         {totalPages}
//                       </button>
//                     </>
//                   )}
//                 </div>
                
//                 <button 
//                   onClick={() => handlePageChange(currentPage + 1)}
//                   disabled={currentPage === totalPages}
//                   className="px-3 py-1 bg-[#1a1a1a] border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
//                 >
//                   <span>Next</span>
//                   <FiChevronRight size={14} />
//                 </button>
                
//                 <span className="text-sm text-gray-300 ml-2">
//                   Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
//                 </span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <CreateRouteModal
//         isOpen={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         onSubmit={handleCreateRoute}
//         availableServers={servers}
//       />

//       {/* Bulk Delete Confirmation Modal */}
//       <BulkDeleteModal
//         isOpen={showBulkDeleteModal}
//         onClose={() => setShowBulkDeleteModal(false)}
//         onConfirm={handleBulkDelete}
//         selectedCount={selectedRouteIds.length}
//         isLoading={isBulkDeleting}
//       />

//       {showDetailsModal && selectedAssignment && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
//           <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700">
//             <div className="flex justify-between items-center mb-4">
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={() => setShowDetailsModal(false)}
//                   className="p-2 hover:bg-gray-700 rounded transition-colors"
//                   title="Back"
//                 >
//                   <FiArrowLeft className="text-gray-400" size={20} />
//                 </button>
//                 <div>
//                   <h3 className="text-lg font-bold text-white">Route Server Assignment Details</h3>
//                   <p className="text-sm text-gray-400">From {selectedAssignment.sourceServer}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowDetailsModal(false)}
//                 className="p-2 hover:bg-gray-700 rounded transition-colors"
//               >
//                 <FiAlertCircle className="text-gray-400" />
//               </button>
//             </div>
            
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-xs text-gray-400">Request Path</label>
//                   <div className="font-mono text-blue-300 p-2 bg-gray-900 rounded mt-1 break-all">
//                     {selectedAssignment.request}
//                   </div>
//                 </div>
//                 <div>
//                   <label className="text-xs text-gray-400">Redirect To</label>
//                   <div className="font-mono text-green-300 p-2 bg-gray-900 rounded mt-1 break-all">
//                     {selectedAssignment.redirect}
//                   </div>
//                 </div>
//               </div>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-xs text-gray-400">Assigned Server</label>
//                   <div className="text-white p-2 bg-gray-900 rounded mt-1">
//                     {selectedAssignment.assignedServer}
//                   </div>
//                 </div>
//                 <div>
//                   <label className="text-xs text-gray-400">Source Server</label>
//                   <div className="text-white p-2 bg-gray-900 rounded mt-1">
//                     {selectedAssignment.sourceServer}
//                   </div>
//                 </div>
//               </div>
              
//               <div>
//                 <label className="text-xs text-gray-400">Source</label>
//                 <div className="text-white p-2 bg-gray-900 rounded mt-1">
//                   {selectedAssignment.source}
//                 </div>
//               </div>
              
//               {selectedAssignment.host && (
//                 <div>
//                   <label className="text-xs text-gray-400">Host</label>
//                   <div className="text-white p-2 bg-gray-900 rounded mt-1 break-all">
//                     {selectedAssignment.host || '(empty)'}
//                   </div>
//                 </div>
//               )}
              
//               {selectedAssignment.originPath && selectedAssignment.originPath !== selectedAssignment.request && (
//                 <div>
//                   <label className="text-xs text-gray-400">Origin Path</label>
//                   <div className="text-white p-2 bg-gray-900 rounded mt-1 break-all">
//                     {selectedAssignment.originPath}
//                   </div>
//                 </div>
//               )}
              
//               {selectedAssignment.useSSL && (
//                 <div>
//                   <label className="text-xs text-gray-400">SSL</label>
//                   <div className={`p-2 rounded mt-1 ${selectedAssignment.useSSL === 'true' ? 'bg-green-900/30 text-green-300' : 'bg-gray-900 text-gray-300'}`}>
//                     {selectedAssignment.useSSL === 'true' ? 'Enabled' : 'Disabled'}
//                   </div>
//                 </div>
//               )}
              
//               <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
//                 <button
//                   onClick={() => setShowDetailsModal(false)}
//                   className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
//                 >
//                   Close
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     handleEditClick(selectedAssignment, e);
//                     setShowDetailsModal(false);
//                   }}
//                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2"
//                   disabled={selectedAssignment.source !== "rules.conf"}
//                 >
//                   <FiEdit />
//                   Edit
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     handleDeleteClick(selectedAssignment, e);
//                     setShowDetailsModal(false);
//                   }}
//                   className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center gap-2"
//                   disabled={selectedAssignment.source !== "rules.conf"}
//                 >
//                   <FiTrash2 />
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {showEditModal && selectedAssignment && (
//         <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
//           <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700">
//             <div className="flex justify-between items-center mb-4">
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={handleBackToDetails}
//                   className="p-2 hover:bg-gray-700 rounded transition-colors"
//                   title="Back to details"
//                 >
//                   <FiArrowLeft className="text-gray-400" size={20} />
//                 </button>
//                 <div>
//                   <h3 className="text-lg font-bold text-white">Edit Re-streaming Route</h3>
//                   <p className="text-sm text-gray-400">Edit the re-streaming setup for {selectedAssignment.sourceServer}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowEditModal(false)}
//                 className="p-2 hover:bg-gray-700 rounded transition-colors"
//               >
//                 <FiAlertCircle className="text-gray-400" />
//               </button>
//             </div>
            
//             <form onSubmit={handleEditSubmit}>
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-1">
//                     Request Path:
//                   </label>
//                   <input
//                     type="text"
//                     value={editFormData.request}
//                     onChange={(e) => setEditFormData({...editFormData, request: e.target.value})}
//                     className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
//                     placeholder="/stream/"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-1">
//                     Redirect URL:
//                   </label>
//                   <input
//                     type="text"
//                     value={editFormData.redirect}
//                     onChange={(e) => setEditFormData({...editFormData, redirect: e.target.value})}
//                     className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
//                     placeholder="http://example.com:9229/stream/"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-1">
//                     Host (Optional):
//                   </label>
//                   <input
//                     type="text"
//                     value={editFormData.host}
//                     onChange={(e) => setEditFormData({...editFormData, host: e.target.value})}
//                     className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
//                     placeholder="example.com"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-1">
//                     Origin Path (Optional):
//                   </label>
//                   <input
//                     type="text"
//                     value={editFormData.originPath}
//                     onChange={(e) => setEditFormData({...editFormData, originPath: e.target.value})}
//                     className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
//                     placeholder="/stream/"
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-300 mb-1">
//                     Use SSL:
//                   </label>
//                   <select
//                     value={editFormData.useSSL}
//                     onChange={(e) => setEditFormData({...editFormData, useSSL: e.target.value})}
//                     className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
//                   >
//                     <option value="false">No</option>
//                     <option value="true">Yes</option>
//                   </select>
//                 </div>
                
//                 <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
//                   <button
//                     type="button"
//                     onClick={handleBackToDetails}
//                     className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
//                     disabled={isLoading}
//                   >
//                     {isLoading ? 'Saving...' : 'Save Changes'}
//                   </button>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Homepage;



// Homepage.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  FiRefreshCcw, FiSearch, FiTrash2, FiAlertCircle, FiChevronLeft, 
  FiChevronRight, FiEdit, FiArrowLeft, FiPlus, FiCheckSquare, FiSquare 
} from "react-icons/fi";
import Header from "./Header";
import CreateRouteModal from "../components/CreateRouteModal";

interface Route {
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

interface RouteAssignment {
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
}

interface Server {
  id: number;
  displayName: string;
  ipAddress: string;
  sshUsername: string;
  sshPassword: string;
  port: string;
  sshPort?: number;
  serverType: "origin" | "edge";
}

interface RulesResponse {
  routes: Route[];
  error?: string;
}

// Bulk delete confirmation modal props
interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isLoading: boolean;
}

// Bulk Delete Confirmation Modal Component
const BulkDeleteModal = ({ isOpen, onClose, onConfirm, selectedCount, isLoading }: BulkDeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-900/30 rounded-full">
            <FiAlertCircle className="text-red-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Confirm Bulk Delete</h3>
            <p className="text-gray-300 text-sm mt-1">This action cannot be undone</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300">
            Are you sure you want to delete <span className="font-semibold text-red-300">{selectedCount}</span> selected route(s) from their respective servers?
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Note: Routes will be deleted from the servers they belong to. This may take a few moments.
          </p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-white font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⟳</span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <FiTrash2 />
                <span>Delete {selectedCount} Routes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Homepage = () => {
  const [search, setSearch] = useState("");
  const [stream, setStream] = useState("all");
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<RouteAssignment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [lastReloadTime, setLastReloadTime] = useState<string>("Never");
  const [selectedAssignment, setSelectedAssignment] = useState<RouteAssignment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    request: "",
    redirect: "",
    host: "",
    originPath: "",
    useSSL: "false"
  });

  // Bulk selection states
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Add ref to track assignments for useCallback
  const assignmentsRef = useRef(assignments);
  
  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  // Load servers from API
  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers');
      const data = await response.json();
      
      if (data.success) {
        setServers(data.servers);
        console.log("Loaded servers from API:", data.servers.length);
      } else {
        console.error("Failed to load servers:", data.error);
      }
    } catch (error) {
      console.error("Error fetching servers:", error);
    }
  };

  // Filter assignments based on search
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredAssignments(assignments);
    } else {
      const filtered = assignments.filter(item =>
        item.request.toLowerCase().includes(search.toLowerCase()) ||
        item.redirect.toLowerCase().includes(search.toLowerCase()) ||
        item.assignedServer.toLowerCase().includes(search.toLowerCase()) ||
        item.sourceServer.toLowerCase().includes(search.toLowerCase()) ||
        (item.host && item.host.toLowerCase().includes(search.toLowerCase()))
      );
      setFilteredAssignments(filtered);
    }
    setCurrentPage(1);
    // Clear selections when filter changes
    setSelectedRouteIds([]);
  }, [search, assignments]);

  // Filter by stream
  useEffect(() => {
    if (stream === "all") {
      setFilteredAssignments(assignments);
    } else {
      const filtered = assignments.filter(item => {
        if (stream === "hls") {
          return item.request.includes(".m3u8") || 
                 item.redirect.includes(".m3u8") || 
                 item.request.toLowerCase().includes("hls");
        } else if (stream === "dash") {
          return item.request.includes(".mpd") || 
                 item.redirect.includes(".mpd") ||
                 item.request.toLowerCase().includes("dash");
        } else if (stream === "tv") {
          return !item.request.includes(".m3u8") && 
                 !item.redirect.includes(".m3u8") &&
                 !item.request.includes(".mpd") && 
                 !item.redirect.includes(".mpd");
        }
        return true;
      });
      setFilteredAssignments(filtered);
    }
    setCurrentPage(1);
    // Clear selections when stream filter changes
    setSelectedRouteIds([]);
  }, [stream, assignments]);

  const fetchRulesFromServer = async (server: Server): Promise<RulesResponse | null> => {
    try {
      console.log(`Fetching rules from ${server.ipAddress}...`);
      
      const response = await fetch('/api/fetch-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          sshUsername: server.sshUsername,
          sshPassword: server.sshPassword,
          sshPort: server.sshPort || 22
        })
      });

      const data = await response.json();
      
      console.log(`Response from ${server.ipAddress}:`, {
        success: data.success,
        routesCount: data.data?.routes?.length || 0,
        error: data.data?.error
      });
      
      if (!data.success) {
        throw new Error(data.message || data.data?.error || "Failed to fetch rules");
      }

      return data.data;

    } catch {
      console.error(`Error fetching rules from ${server.ipAddress}`);
      return { 
        routes: [], 
        error: "Connection failed" 
      };
    }
  };

  const fetchRulesFromAllServers = useCallback(async () => {
    if (servers.length === 0) {
      console.log("No servers available to fetch rules from");
      alert("No servers found. Please add servers first.");
      return;
    }

    setIsLoading(true);
    
    const newAssignments: RouteAssignment[] = [];
    let assignmentId = 1;

    for (const server of servers) {
      try {
        console.log(`Fetching rules from server: ${server.displayName} (${server.ipAddress})`);
        
        newAssignments.push({
          id: assignmentId++,
          request: `Connecting to ${server.ipAddress}...`,
          redirect: "Fetching rules.conf...",
          assignedServer: server.ipAddress,
          sourceServer: server.displayName,
          source: "Connecting",
          status: "pending"
        });

        setAssignments([...newAssignments]);

        const rulesData = await fetchRulesFromServer(server);
        
        // Remove the connecting message
        const updatedAssignments = newAssignments.filter(a => 
          !(a.request === `Connecting to ${server.ipAddress}...` && a.status === "pending")
        );
        
        if (rulesData && rulesData.routes && Array.isArray(rulesData.routes) && rulesData.routes.length > 0) {
          console.log(`Found ${rulesData.routes.length} routes in ${server.displayName}`);
                  
          rulesData.routes.forEach((route: Route) => {
            const requestPath = route.path || route.request || '';
            let redirectUrl = route.origin || route.redirect || '';
            const originPath = route.origin_path || route.originPath || '';
            
            // Construct full URL with origin_path or requestPath
            if (redirectUrl && !redirectUrl.includes('Error')) {
              redirectUrl = redirectUrl.replace(/\/$/, '');
              
              if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
                redirectUrl = `http://${redirectUrl}`;
              }
              
              const pathToAdd = originPath || requestPath;
              if (pathToAdd && pathToAdd !== '/' && !redirectUrl.includes(pathToAdd)) {
                redirectUrl = `${redirectUrl}${pathToAdd}`;
              }
            }
            
            if (!requestPath || !redirectUrl) {
              console.warn('Skipping route missing path or origin:', route);
              return;
            }
            
            updatedAssignments.push({
              id: assignmentId++,
              request: requestPath,
              redirect: redirectUrl,
              assignedServer: server.ipAddress,
              sourceServer: server.displayName,
              source: "rules.conf",
              status: "success",
              host: route.host || '',
              origin: route.origin || '',
              originPath: originPath || requestPath,
              useSSL: route.use_ssl || route.useSSL || 'false'
            });
          });
        } else {
          const errorMessage = rulesData?.error || "No routes found in rules.conf";
          console.log(`No routes for ${server.displayName}: ${errorMessage}`);
          
          updatedAssignments.push({
            id: assignmentId++,
            request: `/server-${server.ipAddress}/`,
            redirect: errorMessage,
            assignedServer: server.ipAddress,
            sourceServer: server.displayName,
            source: rulesData?.error ? "Error" : "Empty Config",
            status: rulesData?.error ? "error" : "success"
          });
        }

        newAssignments.length = 0;
        newAssignments.push(...updatedAssignments);
        setAssignments([...newAssignments]);

      } catch {
        console.error(`Failed to fetch rules from ${server.displayName}`);
        
        const updatedAssignments = newAssignments.filter(a => 
          !(a.request === `Connecting to ${server.ipAddress}...` && a.status === "pending")
        );

        updatedAssignments.push({
          id: assignmentId++,
          request: `/server-${server.ipAddress}/`,
          redirect: `SSH Error: Connection failed`,
          assignedServer: server.ipAddress,
          sourceServer: server.displayName,
          source: "SSH Error",
          status: "error"
        });

        newAssignments.length = 0;
        newAssignments.push(...updatedAssignments);
        setAssignments([...newAssignments]);
      }
    }

    setIsLoading(false);
    setLastReloadTime(new Date().toLocaleString());
    // Clear selections after reload
    setSelectedRouteIds([]);
  }, [servers]);

  const handleReload = async () => {
    await fetchRulesFromAllServers();
    setCurrentPage(1);
  };

  useEffect(() => {
    if (servers.length > 0) {
      fetchRulesFromAllServers();
    }
  }, [servers, fetchRulesFromAllServers]);

  const handleCreateRoute = async (data: {
    originUrls: string[];
    selectedServers: Server[];
  }) => {
    const { originUrls, selectedServers } = data;
    
    if (originUrls.length === 0 || selectedServers.length === 0) {
      alert("Please add at least one URL and select at least one server");
      return;
    }

    setIsLoading(true);

    try {
      interface RouteToAdd {
        host: string;
        path: string;
        origin: string;
        origin_path: string;
        use_ssl: string;
        geo: string;
        range: string;
        playlist_caching_interval: string;
      }

      const routesToAdd: RouteToAdd[] = [];
      
      for (const url of originUrls) {
        try {
          const urlObj = new URL(url);
          
          // Get the pathname (e.g., /Allocal2/Allocal2/manifest.mpd)
          const fullPath = urlObj.pathname;
          
          // Split the path and remove the last part (filename)
          const pathParts = fullPath.split('/').filter(part => part.length > 0);
          
          // Remove the last part if it contains a file extension (.mpd, .m3u8, etc.)
          if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart.includes('.')) {
              // Remove the filename, keep only the directory path
              pathParts.pop();
            }
          }
          
          // Reconstruct the path (ensure it starts and ends with /)
          let finalPath = '/' + pathParts.join('/') + '/';
          
          // If somehow we got just '/', use a default
          if (finalPath === '/') {
            finalPath = '/stream/';
          }
          
          const origin = urlObj.host;
          const useSSL = url.startsWith('https') ? 'true' : 'false';
          
          console.log(`Processing URL: ${url}`);
          console.log(`Original path: ${fullPath}`);
          console.log(`Final path: ${finalPath}`);
          
          routesToAdd.push({
            host: "",
            path: finalPath,
            origin: origin,
            origin_path: finalPath,
            use_ssl: useSSL,
            geo: "",
            range: "",
            playlist_caching_interval: "1"
          });
          
        } catch (error) {
          console.error(`Error parsing URL ${url}:`, error);
          // If URL parsing fails, use a simple default
          routesToAdd.push({
            host: "",
            path: "/stream/",
            origin: url,
            origin_path: "/stream/",
            use_ssl: "false",
            geo: "",
            range: "",
            playlist_caching_interval: "1"
          });
        }
      }

      // Write to each selected server
      const writePromises = selectedServers.map(async (server) => {
        const response = await fetch('/api/write-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverId: server.id,
            ipAddress: server.ipAddress,
            sshUsername: server.sshUsername,
            sshPassword: server.sshPassword,
            sshPort: server.sshPort || 22,
            routes: routesToAdd,
            action: 'append'
          })
        });

        const result = await response.json();
        return { server: server.displayName, success: result.success, message: result.message };
      });

      const results = await Promise.all(writePromises);
      
      const allSuccess = results.every(r => r.success);
      
      if (allSuccess) {
        await fetchRulesFromAllServers();
        alert(`Routes created successfully on ${selectedServers.length} server(s)!`);
      } else {
        const failed = results.filter(r => !r.success).map(r => r.server);
        alert(`Failed to write routes to: ${failed.join(', ')}`);
      }
      
    } catch (error) {
      console.error("Error creating routes:", error);
      alert("Failed to create routes. Please try again.");
    } finally {
      setIsLoading(false);
      setShowCreateModal(false);
    }
  };

  // Toggle single route selection
  const toggleRouteSelection = (routeId: number) => {
    setSelectedRouteIds(prev => 
      prev.includes(routeId) 
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  // Select/Deselect all routes on current page
  const toggleSelectAll = () => {
    const currentPageIds = currentPageData
      .filter(a => a.source === "rules.conf") // Only selectable routes
      .map(a => a.id);
    
    if (selectedRouteIds.length === currentPageIds.length && currentPageIds.length > 0) {
      // Deselect all
      setSelectedRouteIds([]);
    } else {
      // Select all
      setSelectedRouteIds(currentPageIds);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRouteIds.length === 0) return;

    setIsBulkDeleting(true);

    try {
      // Group selected routes by server
      const routesByServer = new Map<string, { server: Server; routes: RouteAssignment[] }>();
      
      selectedRouteIds.forEach(id => {
        const route = assignments.find(a => a.id === id);
        if (!route || route.source !== "rules.conf") return;
        
        const server = servers.find(s => s.displayName === route.sourceServer);
        if (!server) return;
        
        const key = `${server.id}`;
        if (!routesByServer.has(key)) {
          routesByServer.set(key, { server, routes: [] });
        }
        routesByServer.get(key)!.routes.push(route);
      });

      // Delete routes from each server
      const deletePromises = Array.from(routesByServer.values()).map(async ({ server, routes }) => {
        const routesToDelete = routes.map(route => ({
          host: route.host || "",
          path: route.request,
          origin: route.origin || new URL(route.redirect).host || server.ipAddress,
          origin_path: route.originPath || route.request,
          use_ssl: route.useSSL || "false",
          geo: "",
          range: "",
          playlist_caching_interval: "1"
        }));

        const response = await fetch('/api/write-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverId: server.id,
            ipAddress: server.ipAddress,
            sshUsername: server.sshUsername,
            sshPassword: server.sshPassword,
            sshPort: server.sshPort || 22,
            routes: routesToDelete,
            action: 'delete'
          })
        });

        const result = await response.json();
        return { server: server.displayName, success: result.success, count: routes.length };
      });

      const results = await Promise.all(deletePromises);
      
      // Reload data
      await fetchRulesFromAllServers();
      
      // Show summary
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (failed.length === 0) {
        alert(`Successfully deleted ${selectedRouteIds.length} route(s) from ${successful.length} server(s)!`);
      } else {
        alert(`Partially completed: Deleted from ${successful.length} servers, failed on ${failed.length} servers. Please check individual servers.`);
      }
      
      setSelectedRouteIds([]);
      setShowBulkDeleteModal(false);
      
    } catch (error) {
      console.error("Error in bulk delete:", error);
      alert("Failed to delete routes. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const assignmentToDelete = assignments.find(a => a.id === id);
    if (!assignmentToDelete) return;

    const server = servers.find(s => s.displayName === assignmentToDelete.sourceServer);
    if (!server) {
      alert("Server not found");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this route from server ${server.displayName}?`)) {
      return;
    }

    setIsLoading(true);

    try {
      const routesToDelete = [{
        host: assignmentToDelete.host || "",
        path: assignmentToDelete.request,
        origin: assignmentToDelete.origin || new URL(assignmentToDelete.redirect).host || server.ipAddress,
        origin_path: assignmentToDelete.originPath || assignmentToDelete.request,
        use_ssl: assignmentToDelete.useSSL || "false",
        geo: "",
        range: "",
        playlist_caching_interval: "1"
      }];

      const response = await fetch('/api/write-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: server.id,
          ipAddress: server.ipAddress,
          sshUsername: server.sshUsername,
          sshPassword: server.sshPassword,
          sshPort: server.sshPort || 22,
          routes: routesToDelete,
          action: 'delete'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchRulesFromAllServers();
        
        if (showDetailsModal && selectedAssignment?.id === id) {
          setShowDetailsModal(false);
        }
        
        // Remove from selected IDs if present
        setSelectedRouteIds(prev => prev.filter(selectedId => selectedId !== id));
        
        alert("Route deleted successfully from server!");
      } else {
        alert(`Failed to delete route: ${result.error}`);
      }
      
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (assignment: RouteAssignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
    setShowEditModal(false);
  };

  const handleRowClick = (assignment: RouteAssignment, e: React.MouseEvent) => {
    // Don't trigger if clicking on checkbox or action buttons
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || target.closest('button')) {
      return;
    }
    handleViewDetails(assignment);
  };

  const handleEditClick = (assignment: RouteAssignment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAssignment(assignment);
    setEditFormData({
      request: assignment.request,
      redirect: assignment.redirect,
      host: assignment.host || '',
      originPath: assignment.originPath || '',
      useSSL: assignment.useSSL || 'false'
    });
    setShowEditModal(true);
    setShowDetailsModal(false);
  };

  const handleDeleteClick = (assignment: RouteAssignment, e: React.MouseEvent) => {
    e.stopPropagation();
    handleDelete(assignment.id);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignment) return;
    
    const server = servers.find(s => s.displayName === selectedAssignment.sourceServer);
    if (!server) {
      alert("Server not found");
      return;
    }

    setIsLoading(true);

    try {
      const deleteRoutes = [{
        host: selectedAssignment.host || "",
        path: selectedAssignment.request,
        origin: selectedAssignment.origin || new URL(selectedAssignment.redirect).host || server.ipAddress,
        origin_path: selectedAssignment.originPath || selectedAssignment.request,
        use_ssl: selectedAssignment.useSSL || "false",
        geo: "",
        range: "",
        playlist_caching_interval: "1"
      }];

      await fetch('/api/write-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: server.id,
          ipAddress: server.ipAddress,
          sshUsername: server.sshUsername,
          sshPassword: server.sshPassword,
          sshPort: server.sshPort || 22,
          routes: deleteRoutes,
          action: 'delete'
        })
      });

      const addRoutes = [{
        host: editFormData.host,
        path: editFormData.request,
        origin: new URL(editFormData.redirect).host || server.ipAddress,
        origin_path: editFormData.originPath || editFormData.request,
        use_ssl: editFormData.useSSL,
        geo: "",
        range: "",
        playlist_caching_interval: "1"
      }];

      const response = await fetch('/api/write-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: server.id,
          ipAddress: server.ipAddress,
          sshUsername: server.sshUsername,
          sshPassword: server.sshPassword,
          sshPort: server.sshPort || 22,
          routes: addRoutes,
          action: 'append'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchRulesFromAllServers();
        setShowEditModal(false);
        alert("Route updated successfully on server!");
      } else {
        alert(`Failed to update route: ${result.error}`);
      }
      
    } catch (error) {
      console.error("Error updating route:", error);
      alert("Failed to update route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setShowEditModal(false);
    setShowDetailsModal(true);
  };

  const totalItems = filteredAssignments.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const currentPageData = filteredAssignments.slice(startItem - 1, endItem);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setSelectedRouteIds([]); // Clear selections when page size changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedRouteIds([]); // Clear selections when page changes
  };

  // Check if all selectable routes on current page are selected
  const selectableRoutesOnPage = currentPageData.filter(a => a.source === "rules.conf");
  const allSelected = selectableRoutesOnPage.length > 0 && 
    selectableRoutesOnPage.every(route => selectedRouteIds.includes(route.id));

  return (
    <div className="min-h-screen bg-black text-white">
      <Header onCreateRoute={handleCreateRoute} />
      
      <div className="px-20 py-28">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-2">Route Server Assignments</h1>
          
          <div className="flex gap-3">
            {/* Bulk Delete Button - Shows when routes are selected */}
            {selectedRouteIds.length > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={isLoading || isBulkDeleting}
                className="px-4 py-2 rounded-lg flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white transition-colors"
                title={`Delete ${selectedRouteIds.length} selected routes`}
              >
                <FiTrash2 className="text-lg" />
                <span>Delete Selected ({selectedRouteIds.length})</span>
              </button>
            )}
            
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={servers.length === 0}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                servers.length > 0
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
              title={servers.length === 0 ? "Add servers first" : "Create new route"}
            >
              <FiPlus className="text-lg" />
              <span>Create Route</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes or servers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              className="px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 text-sm"
            >
              <option value="all">All Routes</option>
              <option value="hls">HLS Streams</option>
              <option value="dash">DASH Streams</option>
              <option value="tv">TV Channels</option>
            </select>

            <button 
              onClick={handleReload}
              disabled={isLoading || servers.length === 0}
              className="p-2 rounded bg-[#1a1a1a] border border-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <FiRefreshCcw className="text-lg" />
                  <span>Reload Rules</span>
                </>
              )}
            </button>

            <div className={`px-3 py-1 rounded text-sm ${
              servers.length === 0 
                ? "bg-red-900/30 text-red-300" 
                : "bg-blue-900/30 text-blue-300"
            }`}>
              Servers: {servers.length}
              {servers.length === 0 && " (Add servers first)"}
            </div>

            {lastReloadTime !== "Never" && (
              <div className="px-3 py-1 bg-green-900/30 text-green-300 rounded text-sm">
                Last: {lastReloadTime}
              </div>
            )}
          </div>
        </div>
        
        <div className="h-px bg-gray-700 mb-4"></div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-col">
            <div className="text-gray-400 text-sm">
              Showing <span className="text-white font-bold">{totalItems}</span> of <span className="text-white font-bold">{totalItems}</span> assignments
              {selectedRouteIds.length > 0 && (
                <span className="ml-4 text-blue-400">
                  {selectedRouteIds.length} selected
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded bg-purple-900/30 text-purple-300 text-sm">
              {stream.toUpperCase()}: {totalItems}
            </div>
          </div>
        </div>

        <div className="border border-gray-700 rounded-lg overflow-hidden bg-yellow-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Showing routes from {servers.length} server{servers.length !== 1 ? 's' : ''}
              </div>
              
              {servers.length === 0 && (
                <button 
                  onClick={() => window.location.href = '/servers'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Add Servers First
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a1a1a] text-gray-300 sticky top-0 z-10">
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700 w-12">
                    {/* Select All Checkbox */}
                    {selectableRoutesOnPage.length > 0 && (
                      <button
                        onClick={toggleSelectAll}
                        className="text-gray-400 hover:text-white transition-colors"
                        title={allSelected ? "Deselect all" : "Select all"}
                      >
                        {allSelected ? (
                          <FiCheckSquare className="text-xl" />
                        ) : (
                          <FiSquare className="text-xl" />
                        )}
                      </button>
                    )}
                  </th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[300px]">
                    Request comes to...
                  </th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[400px]">
                    ...and is redirected to
                  </th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[150px]">
                    Assigned server
                  </th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[150px]">
                    Source Server
                  </th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[120px]">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left font-medium border-b border-gray-700 min-w-[150px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        {servers.length === 0 ? (
                          <>
                            <FiAlertCircle className="text-3xl text-red-500 mb-4" />
                            <div className="text-lg mb-2">No servers configured</div>
                            <div className="text-sm mb-4">Add servers first to fetch rules.conf data</div>
                            <button 
                              onClick={() => window.location.href = '/servers'}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                            >
                              Go to Servers Page
                            </button>
                          </>
                        ) : isLoading ? (
                          <>
                            <div className="animate-spin text-3xl mb-4">⟳</div>
                            <div className="text-lg mb-2">Fetching rules from servers...</div>
                            <div className="text-sm">Please wait while we connect to your servers</div>
                          </>
                        ) : (
                          <>
                            <div className="text-lg mb-2">No assignments found</div>
                            <div className="text-sm mb-4">Click &quot;Reload Rules&quot; to fetch data from servers or create a new route</div>
                            <div className="flex gap-3">
                              <button 
                                onClick={handleReload}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                              >
                                Reload Rules
                              </button>
                              <button 
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2"
                              >
                                <FiPlus />
                                Create Route
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((assignment, index) => {
                    const isSelectable = assignment.source === "rules.conf";
                    
                    return (
                      <tr 
                        key={assignment.id} 
                        onClick={(e) => handleRowClick(assignment, e)}
                        className={`border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
                          index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'
                        } ${
                          assignment.status === "error" ? "bg-red-900/20" :
                          assignment.status === "pending" ? "bg-yellow-900/20" : ""
                        } ${selectedRouteIds.includes(assignment.id) ? 'bg-blue-900/20' : ''}`}
                      >
                        <td className="px-4 py-3">
                          {isSelectable ? (
                            <input
                              type="checkbox"
                              checked={selectedRouteIds.includes(assignment.id)}
                              onChange={() => toggleRouteSelection(assignment.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-gray-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-blue-300 break-all">
                            {assignment.request}
                            {assignment.status === "pending" && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="animate-spin text-xs">⟳</span>
                                <span className="text-xs text-yellow-400">Connecting...</span>
                              </div>
                            )}
                          </div>
                          {assignment.host && assignment.host.trim() && (
                            <div className="text-xs text-gray-400 mt-1">
                              Host: {assignment.host}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="font-mono text-green-300 break-all">
                            {assignment.redirect && typeof assignment.redirect === 'string' && assignment.redirect.startsWith('http') 
                              ? assignment.redirect 
                              : assignment.redirect 
                                ? `http://${assignment.redirect}`
                                : 'No redirect URL'}
                            {assignment.status === "error" && assignment.redirect && assignment.redirect.includes("Error") && (
                              <div className="text-xs text-red-400 mt-1">
                                {assignment.redirect}
                              </div>
                            )}
                          </div>
                          {assignment.originPath && assignment.originPath !== assignment.request && (
                            <div className="text-xs text-gray-400 mt-1">
                              Origin Path: {assignment.originPath}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded text-xs font-medium ${
                            assignment.source === "rules.conf"
                              ? "bg-blue-900/30 text-blue-300" 
                              : assignment.status === "error"
                              ? "bg-red-900/30 text-red-300"
                              : assignment.status === "pending"
                              ? "bg-yellow-900/30 text-yellow-300"
                              : "bg-gray-800 text-gray-300"
                          }`}>
                            {assignment.assignedServer}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="bg-white text-black font-medium px-3 py-1 rounded text-sm inline-block">
                            {assignment.sourceServer}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded text-xs font-medium ${
                            assignment.source === "rules.conf" 
                              ? "bg-green-900/30 text-green-300" 
                              : assignment.source === "Error" || assignment.source === "SSH Error"
                              ? "bg-red-900/30 text-red-300"
                              : assignment.source === "Connecting"
                              ? "bg-yellow-900/30 text-yellow-300"
                              : "bg-gray-800 text-gray-300"
                          }`}>
                            {assignment.source}
                          </span>
                          {assignment.useSSL && assignment.useSSL === 'true' && (
                            <div className="text-xs text-yellow-400 mt-1">SSL Enabled</div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => handleEditClick(assignment, e)}
                              className="bg-blue-600/20 hover:bg-blue-600/40 rounded-lg border border-blue-500/30 transition-all duration-200 shadow-lg hover:shadow-blue-500/20 p-2"
                              title="Edit route"
                              disabled={assignment.source !== "rules.conf"}
                            >
                              <FiEdit className={`text-xl font-bold ${assignment.source === "rules.conf" ? "text-blue-400" : "text-gray-500"}`} size={20} />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteClick(assignment, e)}
                              className="bg-red-600/20 hover:bg-red-600/40 rounded-lg border border-red-500/30 transition-all duration-200 shadow-lg hover:shadow-red-500/20 p-2"
                              title="Delete route"
                              disabled={assignment.source !== "rules.conf"}
                            >
                              <FiTrash2 className={`text-xl font-bold ${assignment.source === "rules.conf" ? "text-red-400" : "text-gray-500"}`} size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredAssignments.length > 0 && totalPages > 1 && (
            <div className="flex flex-wrap justify-between items-center p-4 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-2 md:mb-0">
                Page Size: 
                <select 
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="ml-2 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-400 mb-2 md:mb-0">
                {startItem} to {endItem} of {totalItems}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-[#1a1a1a] border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <FiChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1a1a1a] border border-gray-700 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className={`px-3 py-1 rounded ${
                          currentPage === totalPages
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1a1a1a] border border-gray-700 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-[#1a1a1a] border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Next</span>
                  <FiChevronRight size={14} />
                </button>
                
                <span className="text-sm text-gray-300 ml-2">
                  Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateRouteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRoute}
        availableServers={servers}
      />

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        selectedCount={selectedRouteIds.length}
        isLoading={isBulkDeleting}
      />

      {showDetailsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-700 rounded transition-colors"
                  title="Back"
                >
                  <FiArrowLeft className="text-gray-400" size={20} />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-white">Route Server Assignment Details</h3>
                  <p className="text-sm text-gray-400">From {selectedAssignment.sourceServer}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <FiAlertCircle className="text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Request Path</label>
                  <div className="font-mono text-blue-300 p-2 bg-gray-900 rounded mt-1 break-all">
                    {selectedAssignment.request}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Redirect To</label>
                  <div className="font-mono text-green-300 p-2 bg-gray-900 rounded mt-1 break-all">
                    {selectedAssignment.redirect}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Assigned Server</label>
                  <div className="text-white p-2 bg-gray-900 rounded mt-1">
                    {selectedAssignment.assignedServer}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Source Server</label>
                  <div className="text-white p-2 bg-gray-900 rounded mt-1">
                    {selectedAssignment.sourceServer}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-400">Source</label>
                <div className="text-white p-2 bg-gray-900 rounded mt-1">
                  {selectedAssignment.source}
                </div>
              </div>
              
              {selectedAssignment.host && (
                <div>
                  <label className="text-xs text-gray-400">Host</label>
                  <div className="text-white p-2 bg-gray-900 rounded mt-1 break-all">
                    {selectedAssignment.host || '(empty)'}
                  </div>
                </div>
              )}
              
              {selectedAssignment.originPath && selectedAssignment.originPath !== selectedAssignment.request && (
                <div>
                  <label className="text-xs text-gray-400">Origin Path</label>
                  <div className="text-white p-2 bg-gray-900 rounded mt-1 break-all">
                    {selectedAssignment.originPath}
                  </div>
                </div>
              )}
              
              {selectedAssignment.useSSL && (
                <div>
                  <label className="text-xs text-gray-400">SSL</label>
                  <div className={`p-2 rounded mt-1 ${selectedAssignment.useSSL === 'true' ? 'bg-green-900/30 text-green-300' : 'bg-gray-900 text-gray-300'}`}>
                    {selectedAssignment.useSSL === 'true' ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Close
                </button>
                <button
                  onClick={(e) => {
                    handleEditClick(selectedAssignment, e);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2"
                  disabled={selectedAssignment.source !== "rules.conf"}
                >
                  <FiEdit />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    handleDeleteClick(selectedAssignment, e);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center gap-2"
                  disabled={selectedAssignment.source !== "rules.conf"}
                >
                  <FiTrash2 />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToDetails}
                  className="p-2 hover:bg-gray-700 rounded transition-colors"
                  title="Back to details"
                >
                  <FiArrowLeft className="text-gray-400" size={20} />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Re-streaming Route</h3>
                  <p className="text-sm text-gray-400">Edit the re-streaming setup for {selectedAssignment.sourceServer}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <FiAlertCircle className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Request Path:
                  </label>
                  <input
                    type="text"
                    value={editFormData.request}
                    onChange={(e) => setEditFormData({...editFormData, request: e.target.value})}
                    className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                    placeholder="/stream/"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Redirect URL:
                  </label>
                  <input
                    type="text"
                    value={editFormData.redirect}
                    onChange={(e) => setEditFormData({...editFormData, redirect: e.target.value})}
                    className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                    placeholder="http://example.com:9229/stream/"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Host (Optional):
                  </label>
                  <input
                    type="text"
                    value={editFormData.host}
                    onChange={(e) => setEditFormData({...editFormData, host: e.target.value})}
                    className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                    placeholder="example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Origin Path (Optional):
                  </label>
                  <input
                    type="text"
                    value={editFormData.originPath}
                    onChange={(e) => setEditFormData({...editFormData, originPath: e.target.value})}
                    className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                    placeholder="/stream/"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Use SSL:
                  </label>
                  <select
                    value={editFormData.useSSL}
                    onChange={(e) => setEditFormData({...editFormData, useSSL: e.target.value})}
                    className="w-full px-4 py-2 rounded bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={handleBackToDetails}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;

