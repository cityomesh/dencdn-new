// components/CreateRouteModal.tsx
"use client";

import React, { useState } from "react";
import { FiX, FiArrowLeft, FiPlus, FiServer } from "react-icons/fi";
import { useRouter } from "next/navigation";

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

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    originUrls: string[];
    selectedServers: Server[];
  }) => void;
  availableServers?: Server[];
}

const CreateRouteModal: React.FC<CreateRouteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableServers = []
}) => {
  const router = useRouter();
  const [originUrls, setOriginUrls] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedServers, setSelectedServers] = useState<Server[]>([]);
  const [showServerSelector, setShowServerSelector] = useState(false);

  if (!isOpen) return null;

  const handleAddUrl = () => {
    if (inputValue.trim()) {
      const urls = inputValue
        .split(/[,\n]/)
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      const uniqueUrls = urls.filter(url => !originUrls.includes(url));
      
      if (uniqueUrls.length > 0) {
        setOriginUrls([...originUrls, ...uniqueUrls]);
      }
      
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddUrl();
    }
    
    if (e.key === 'Backspace' && inputValue === '' && originUrls.length > 0) {
      e.preventDefault();
      const newUrls = [...originUrls];
      newUrls.pop();
      setOriginUrls(newUrls);
    }
  };

  const removeUrl = (indexToRemove: number) => {
    setOriginUrls(originUrls.filter((_, index) => index !== indexToRemove));
  };

  const toggleServer = (server: Server) => {
    if (selectedServers.some(s => s.id === server.id)) {
      setSelectedServers(selectedServers.filter(s => s.id !== server.id));
    } else {
      setSelectedServers([...selectedServers, server]);
    }
  };

  const removeServer = (serverId: number) => {
    setSelectedServers(selectedServers.filter(s => s.id !== serverId));
  };

  const handleSubmit = () => {
    onSubmit({
      originUrls,
      selectedServers
    });
    
    // Reset form
    setOriginUrls([]);
    setInputValue("");
    setSelectedServers([]);
    setShowServerSelector(false);
    onClose();
  };

  const handleBackToOverview = () => {
    router.push("/homepage");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#1e1e1e] rounded-xl w-full max-w-5xl border border-gray-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/80">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToOverview}
              className="flex items-center gap-2.5 px-3 py-2 -ml-2 hover:bg-gray-800 rounded-lg transition-colors group"
              title="Back to Overview"
            >
              <FiArrowLeft className="text-gray-400 text-lg group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                Back to Overview
              </span>
            </button>
            <div className="h-6 w-px bg-gray-700"></div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Create Re-streaming Route</h2>
              <p className="text-xs text-gray-500 mt-0.5">Configure your streaming destination</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <FiX className="text-gray-400 text-xl hover:text-white transition-colors" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-10">
          
          {/* 1. Origin stream URLs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-semibold">
                1
              </span>
              <label className="text-base font-semibold text-white tracking-wide">
                Origin stream URLs
              </label>
              <span className="text-xs text-gray-500 font-normal ml-2">(Required)</span>
            </div>
            
            {/* Tags Input Area */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 p-3 bg-[#252525] border border-gray-700 rounded-lg focus-within:border-blue-500/70 focus-within:bg-[#262626] transition-all duration-200">
                
                {/* Existing Tags */}
                {originUrls.map((url, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 rounded-md text-sm text-blue-200 group hover:bg-blue-600/30 transition-colors"
                  >
                    <span className="max-w-[220px] truncate text-xs font-mono">{url}</span>
                    <button
                      onClick={() => removeUrl(index)}
                      className="p-0.5 hover:bg-blue-500/50 rounded-sm transition-colors"
                      aria-label="Remove URL"
                    >
                      <FiX className="text-blue-300 text-xs" />
                    </button>
                  </span>
                ))}
                
                {/* Input Field */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleAddUrl}
                  placeholder={originUrls.length === 0 ? "Enter URL and press Enter or comma..." : "Add another URL..."}
                  className="flex-1 min-w-[240px] bg-transparent border-none outline-none text-white placeholder-gray-600 py-1.5 text-sm"
                  autoFocus
                />
              </div>
              
              {/* Helper text */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="px-2 py-1 bg-gray-800/80 border border-gray-700 rounded-md text-gray-400 font-mono text-xs">
                    ↵ Enter
                  </span>
                  <span className="text-gray-600">or</span>
                  <span className="px-2 py-1 bg-gray-800/80 border border-gray-700 rounded-md text-gray-400 font-mono text-xs">
                    , comma
                  </span>
                  <span className="text-gray-400">to add</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="px-2 py-1 bg-gray-800/80 border border-gray-700 rounded-md text-gray-400 font-mono text-xs">
                    ⌫ Backspace
                  </span>
                  <span className="text-gray-400">to remove last</span>
                </div>
              </div>
              
              {/* Example */}
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-4 py-2.5">
                <p className="text-xs text-yellow-300/90 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  Example: http://10.10.148.25:8081/Allocal2/Allocal2/manifest.mpd
                </p>
              </div>
            </div>
          </div>

          {/* 2. Select servers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-semibold">
                2
              </span>
              <label className="text-base font-semibold text-white tracking-wide">
                Select destination servers
              </label>
              <span className="text-xs text-gray-500 font-normal ml-2">(Required)</span>
            </div>
            
            {availableServers.length === 0 ? (
              <div className="p-8 bg-[#252525] rounded-lg border border-gray-700/80 text-center">
                <div className="bg-yellow-700/20 p-3 rounded-full w-fit mx-auto mb-4">
                  <FiServer className="text-2xl text-yellow-500" />
                </div>
                <p className="text-gray-300 font-medium">No servers available</p>
                <p className="text-sm text-gray-500 mt-1.5">Please add servers in the infrastructure section</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Choose servers button with tags */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-[#252525] border border-gray-700 rounded-lg focus-within:border-green-500/70 transition-all duration-200 min-h-[60px]">
                  
                  {/* Selected Server Tags */}
                  {selectedServers.map((server) => (
                    <span
                      key={server.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600/20 border border-green-500/40 rounded-md text-sm text-green-200 group hover:bg-green-600/30 transition-colors"
                    >
                      <span className="font-medium text-xs">{server.displayName}</span>
                      <span className="text-xs text-green-300/80 px-1.5 py-0.5 bg-green-900/30 rounded">({server.ipAddress})</span>
                      <button
                        onClick={() => removeServer(server.id)}
                        className="p-0.5 hover:bg-green-500/50 rounded-sm transition-colors ml-0.5"
                        aria-label="Remove server"
                      >
                        <FiX className="text-green-300 text-xs" />
                      </button>
                    </span>
                  ))}
                  
                  {/* Choose servers button */}
                  <button
                    onClick={() => setShowServerSelector(!showServerSelector)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ${
                      selectedServers.length === 0 
                        ? "bg-yellow-700 hover:bg-yellow-600 text-white border border-yellow-600" 
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"
                    }`}
                  >
                    <FiPlus className={`text-sm ${selectedServers.length === 0 ? "text-white" : "text-gray-400"}`} />
                    <span className="text-xs font-medium">
                      {selectedServers.length === 0 
                        ? "Choose servers" 
                        : "Add more servers"}
                    </span>
                  </button>
                </div>

                {/* Server selection dropdown */}
                {showServerSelector && (
                  <div className="mt-3 p-1 bg-[#252525] rounded-lg border border-gray-700/80 shadow-xl max-h-64 overflow-y-auto">
                    <div className="sticky top-0 bg-[#252525] px-3 py-2 border-b border-gray-700/80 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400">Available servers ({availableServers.length})</span>
                      <button
                        onClick={() => setShowServerSelector(false)}
                        className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                    <div className="p-1">
                      {availableServers.map((server) => (
                        <label
                          key={server.id}
                          className="flex items-center justify-between p-3 hover:bg-[#2f2f2f] rounded-md cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={selectedServers.some(s => s.id === server.id)}
                                onChange={() => toggleServer(server)}
                                className="w-4 h-4 accent-green-600 rounded border-gray-600 bg-gray-800"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white group-hover:text-white">
                                {server.displayName}
                              </span>
                              <span className="text-xs text-gray-500 group-hover:text-gray-400">
                                {server.ipAddress} ({server.serverType})
                              </span>
                            </div>
                          </div>
                          {selectedServers.some(s => s.id === server.id) && (
                            <span className="text-xs bg-green-600/20 text-green-400 px-2.5 py-1 rounded-md border border-green-500/30">
                              Selected
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected count indicator */}
                {selectedServers.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <span className="text-xs text-green-400">
                      ✓ {selectedServers.length} server{selectedServers.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-[#1a1a1a] border-t border-gray-700/80">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-300 transition-colors border border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={originUrls.length === 0 || selectedServers.length === 0}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              originUrls.length > 0 && selectedServers.length > 0
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500/50"
                : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
            }`}
          >
            <FiPlus className={`text-base ${originUrls.length > 0 && selectedServers.length > 0 ? "text-white" : "text-gray-500"}`} />
            Create Route
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRouteModal;
