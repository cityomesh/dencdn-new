"use client";

import React, { useState, useEffect } from "react";
import { 
  FiX, 
  FiPlus, 
  FiServer, 
  FiGlobe, 
  FiUser, 
  FiLock, 
  FiAlertCircle,
  FiCpu,
  FiTerminal
} from "react-icons/fi";

// Internal interface for server selection
interface AvailableServer {
  id: string | number;
  displayName: string;
  ipAddress: string;
  serverType?: string;
}

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

interface ServerFormProps {
  opened: boolean;
  onClose: () => void;
  initialValues?: ServerFormData;
  onSubmit: (values: ServerFormData) => void;
  title: string;
}

export function ServerForm({
  opened,
  onClose,
  initialValues,
  onSubmit,
  title,
}: ServerFormProps) {
  const [formData, setFormData] = useState<ServerFormData>({
    displayName: "",
    ipAddress: "",
    sshUsername: "",
    sshPassword: "",
    listeningPort: 9229,
    sshPort: 22,
    originIpWithPort: "",
    serverType: "origin",
    parentServerId: undefined,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableServers, setAvailableServers] = useState<AvailableServer[]>([]);

  useEffect(() => {
    if (opened) {
      loadAvailableServers();
    }
  }, [opened]);

  const loadAvailableServers = () => {
    const savedServers = localStorage.getItem('servers');
    if (savedServers) {
      try {
        const parsedServers = JSON.parse(savedServers) as AvailableServer[];
        
        const originServers = parsedServers.filter((server) => 
          server.serverType === 'origin'
        );
        
        const formattedServers = originServers.map((server) => ({
          id: server.id,
          displayName: server.displayName,
          ipAddress: server.ipAddress
        }));
        
        setAvailableServers(formattedServers);
      } catch (error) {
        console.error("Error loading servers:", error);
        setAvailableServers([]);
      }
    }
  };

  useEffect(() => {
    if (!opened) {
      setFormData({
        displayName: "",
        ipAddress: "",
        sshUsername: "",
        sshPassword: "",
        listeningPort: 9229,
        sshPort: 22,
        originIpWithPort: "",
        serverType: "origin",
        parentServerId: undefined,
      });
      setErrors({});
    }
  }, [opened]);

  useEffect(() => {
    if (initialValues && opened) {
      setFormData(initialValues);
    }
  }, [initialValues, opened]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (!formData.ipAddress.trim()) {
      newErrors.ipAddress = "IP address is required";
    } else {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(formData.ipAddress)) {
        newErrors.ipAddress = "Invalid IP address format";
      }
    }

    if (!formData.sshUsername.trim()) {
      newErrors.sshUsername = "SSH username is required";
    }

    if (!formData.sshPassword.trim()) {
      newErrors.sshPassword = "SSH password is required";
    }

    if (formData.serverType === "edge" && !formData.parentServerId) {
      newErrors.parentServerId = "Parent server is required for edge servers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof ServerFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const showParentSelection = formData.serverType === "edge";

  if (!opened) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiX size={20} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="sticky top-0 bg-white pb-2">
                <h3 className="text-md font-semibold uppercase text-gray-700 tracking-wider border-b-2 border-blue-500 pb-2 inline-block">
                  Server Details
                </h3>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium mb-3 text-gray-700">Server Type *</label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="serverType"
                      value="origin"
                      checked={formData.serverType === "origin"}
                      onChange={(e) => handleChange("serverType", e.target.value as "origin")}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-600">
                      <span className="font-medium">Origin Server</span>
                      <span className="text-xs text-gray-500 ml-2">(Content source)</span>
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="serverType"
                      value="edge"
                      checked={formData.serverType === "edge"}
                      onChange={(e) => handleChange("serverType", e.target.value as "edge")}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-blue-600">
                      <span className="font-medium">Edge Server</span>
                      <span className="text-xs text-gray-500 ml-2">(Content distributor)</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-white">
                <label className="block text-sm font-medium mb-1 text-gray-700">Display Name *</label>
                <div className="relative">
                  <FiServer className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleChange("displayName", e.target.value)}
                    placeholder="e.g., Edge-London-01"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.displayName ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  />
                </div>
                {errors.displayName && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><FiAlertCircle size={14} />{errors.displayName}</p>}
              </div>

              {showParentSelection && (
                <div className="bg-white">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Parent Server *</label>
                  <select
                    value={formData.parentServerId || ""}
                    onChange={(e) => handleChange("parentServerId", e.target.value)}
                    className={`w-full border rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                      errors.parentServerId ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <option value="">-- Select parent origin server --</option>
                    {availableServers.map((server) => (
                      <option key={server.id} value={server.id}>
                        {server.displayName} ({server.ipAddress})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-white">
                <label className="block text-sm font-medium mb-1 text-gray-700">IP Address *</label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) => handleChange("ipAddress", e.target.value)}
                    placeholder="192.168.1.1"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg ${errors.ipAddress ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="bg-white">
                <label className="block text-sm font-medium mb-1 text-gray-700">Output IP:Port *</label>
                <div className="relative">
                  <FiCpu className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="text"
                    value={formData.originIpWithPort}
                    onChange={(e) => handleChange("originIpWithPort", e.target.value)}
                    placeholder="192.168.1.1:8080"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="sticky top-0 bg-white pb-2">
                <h3 className="text-md font-semibold uppercase text-gray-700 tracking-wider border-b-2 border-green-500 pb-2 inline-block">
                  SSH Configuration
                </h3>
              </div>
              
              <div className="bg-white">
                <label className="block text-sm font-medium mb-1 text-gray-700">SSH Port *</label>
                <div className="relative">
                  <FiTerminal className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="number"
                    value={formData.sshPort}
                    onChange={(e) => handleChange("sshPort", parseInt(e.target.value) || 22)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-white">
                <label className="block text-sm font-medium mb-1 text-gray-700">SSH Username *</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="text"
                    value={formData.sshUsername}
                    onChange={(e) => handleChange("sshUsername", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-white">
                <label className="block text-sm font-medium mb-1 text-gray-700">SSH Password *</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="password"
                    value={formData.sshPassword}
                    onChange={(e) => handleChange("sshPassword", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-4">
                <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-2">
                  <FiAlertCircle size={18} /> SSH Configuration Notes
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• SSH credentials are used to fetch /etc/nimble/rules.conf</li>
                  <li>• Homepage lo &quot;Reload&quot; button press chesinappudu rules.conf fetch avutundi</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
              <FiPlus size={18} className="inline mr-2" />
              {initialValues ? "Update Server" : "Create Server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ServerForm;
