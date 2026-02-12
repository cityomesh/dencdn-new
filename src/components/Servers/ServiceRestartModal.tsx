// components/Servers/ServiceRestartModal.tsx
"use client";

import { FiRefreshCw, FiX } from "react-icons/fi";

interface ServiceRestartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServers: Array<{
    id: number;
    displayName: string;
    ipAddress: string;
    port: string;
    sshUsername?: string;
    sshPassword?: string;
  }>;
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
  
  if (!isOpen) return null;

  const handleSubmit = () => {
    // Nimble service restart ni matrame confirm chesthunnam
    onConfirm("nimble");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Service Restart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            disabled={isRestarting}
          >
            <FiX className="text-gray-600" size={20} />
          </button>
        </div>

        {/* Selected Servers Info */}
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Restart service on <span className="text-blue-600 font-semibold">{selectedServers.length}</span> selected servers:
          </p>
          <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-3 border">
            {selectedServers.map(server => (
              <div key={server.id} className="text-sm text-gray-600 py-1 border-b border-gray-200 last:border-0">
                <span className="font-medium text-gray-900">{server.displayName}</span>
                <span className="text-gray-500 ml-2">({server.ipAddress}:{server.port})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Service Info   nimble restart command */}
        {/* <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">Service Name</label>
          
          <div className="mb-3">
            <div className="px-4 py-3 rounded border border-blue-500 bg-blue-50 text-blue-700 font-medium">
              Nimble
            </div>
          </div>

          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-300">
            <p className="text-xs uppercase text-gray-500 font-bold mb-1">
              Command to be executed:
            </p>
            <code className="block px-3 py-2 bg-gray-900 text-gray-900 rounded text-sm font-mono">
              sudo service nimble restart
            </code>
          </div>
        </div> */}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isRestarting}
            className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors text-gray-800 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isRestarting}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg ${
              isRestarting ? 'bg-blue-400' : 'bg-green-600 hover:bg-green-700'
            } transition-colors text-white font-medium`}
          >
            <FiRefreshCw className={`text-lg ${isRestarting ? 'animate-spin' : ''}`} />
            <span>{isRestarting ? 'Restarting...' : 'Restart Service'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRestartModal;
