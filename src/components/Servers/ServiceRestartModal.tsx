// // components/Servers/ServiceRestartModal.tsx
// "use client";

// import { FiRefreshCw, FiX } from "react-icons/fi";
// import { useState } from "react";

// interface Server {
//   id: number;
//   displayName: string;
//   ipAddress: string;
//   port: string;
//   sshUsername?: string;
//   sshPassword?: string;
//   sshPort?: number;
// }

// interface ServiceRestartModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   selectedServers: Server[];
//   onConfirm: (serviceName: string) => Promise<void>;
//   isRestarting: boolean;
// }

// const ServiceRestartModal = ({
//   isOpen,
//   onClose,
//   selectedServers,
//   onConfirm,
//   isRestarting
// }: ServiceRestartModalProps) => {
//   const [serviceName, setServiceName] = useState<string>("nimble");
  
//   if (!isOpen) return null;

//   const handleSubmit = async () => {
//     // Call the parent's onConfirm function
//     await onConfirm(serviceName);
//   };

//   return (
//     <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//       <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700">
//         {/* Header */}

//         {/* Selected Servers Info */}
//         <div className="mb-6">
//           <p className="text-gray-300 mb-2">
//             Restart service on <span className="text-blue-400 font-semibold">{selectedServers.length}</span> selected servers:
//           </p>
//           <div className="max-h-40 overflow-y-auto bg-gray-900 rounded p-3 border border-gray-700">
//             {selectedServers.map(server => (
//               <div key={server.id} className="text-sm text-gray-300 py-1 border-b border-gray-700 last:border-0">
//                 <span className="font-medium text-white">{server.displayName}</span>
//                 <span className="text-gray-400 ml-2">
//                   ({server.ipAddress}:{server.port}) 
//                   {server.sshPort && <span className="text-blue-400 ml-1">[SSH: {server.sshPort}]</span>}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             disabled={isRestarting}
//             className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-white font-medium disabled:opacity-50"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={isRestarting}
//             className={`flex items-center gap-2 px-5 py-2 rounded-lg ${
//               isRestarting ? 'bg-blue-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
//             } transition-colors text-white font-medium`}
//           >
//             <FiRefreshCw className={`text-lg ${isRestarting ? 'animate-spin' : ''}`} />
//             <span>{isRestarting ? 'Restarting...' : 'Restart Service'}</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ServiceRestartModal;


"use client";

import { FiRefreshCw, FiX } from "react-icons/fi"; // FiX is now used below
import { useState } from "react";

interface Server {
  id: number;
  displayName: string;
  ipAddress: string;
  port: string;
  sshUsername?: string;
  sshPassword?: string;
  sshPort?: number;
}

interface ServiceRestartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServers: Server[];
  onConfirm: (serviceName: string) => Promise<void>;
  isRestarting: boolean;
}

const ServiceRestartModal = ({
  isOpen,
  onClose,
  selectedServers,
  onConfirm,
  isRestarting
}: ServiceRestartModalProps) => {
  const [serviceName, setServiceName] = useState<string>("nimble"); // setServiceName is now used
  
  if (!isOpen) return null;

  const handleSubmit = async () => {
    await onConfirm(serviceName);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700 relative">
        {/* Header with Close Icon */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Restart Service</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} /> {/* FiX Error Resolved */}
          </button>
        </div>

        {/* Service Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Service Name
          </label>
          <input 
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selected Servers Info */}
        <div className="mb-6">
          <p className="text-gray-300 mb-2 text-sm">
            Targeting <span className="text-blue-400 font-semibold">{selectedServers.length}</span> servers:
          </p>
          <div className="max-h-32 overflow-y-auto bg-gray-900 rounded p-3 border border-gray-700">
            {selectedServers.map(server => (
              <div key={server.id} className="text-sm text-gray-300 py-1 border-b border-gray-700 last:border-0">
                <span className="font-medium text-white">{server.displayName}</span>
                <span className="text-gray-400 ml-2">({server.ipAddress})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isRestarting}
            className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-white font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isRestarting || !serviceName}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg ${
              isRestarting ? 'bg-blue-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            } transition-colors text-white font-medium`}
          >
            <FiRefreshCw className={`text-lg ${isRestarting ? 'animate-spin' : ''}`} />
            <span>{isRestarting ? 'Restarting...' : 'Confirm Restart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRestartModal;
