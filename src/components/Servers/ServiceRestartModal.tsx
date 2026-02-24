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
