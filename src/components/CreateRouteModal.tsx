// components/CreateRouteModal.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  FiX,
  FiArrowLeft,
  FiPlus,
  FiServer,
  FiFilter,
  FiCheck,
  FiChevronDown,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

interface Server {
  id: number;
  displayName: string;
  ipAddress: string;
  sshUsername: string;
  sshPassword: string;
  port: string;
  sshPort?: number;
  serverType: "origin" | "edge" | "both";
  parentServer?: string;
}

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    originUrls: string[];
    selectedServers: Server[];
  }) => Promise<void>;
  availableServers?: Server[];
}

type FilterType = "all" | "origin" | "edge" | "both";

const CreateRouteModal: React.FC<CreateRouteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableServers = [],
}) => {
  const router = useRouter();
  const [originUrls, setOriginUrls] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedServers, setSelectedServers] = useState<Server[]>([]);
  const [showServerSelector, setShowServerSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>("all");
  const [parentFilter, setParentFilter] = useState<string>("all");

  const originServers = useMemo(
    () => availableServers.filter((s) => s.serverType === "origin"),
    [availableServers]
  );
  const allEdgeServers = useMemo(
    () => availableServers.filter((s) => s.serverType === "edge"),
    [availableServers]
  );
  const bothServers = useMemo(
    () => availableServers.filter((s) => s.serverType === "both"),
    [availableServers]
  );

  const parentCdnOptions = useMemo(() => {
    const set = new Set<string>();
    [...allEdgeServers, ...bothServers].forEach((srv) => {
      if (srv.parentServer && srv.parentServer !== "None") {
        set.add(srv.parentServer);
      }
    });
    return Array.from(set).sort();
  }, [allEdgeServers, bothServers]);

  const filteredEdgeServers = useMemo(() => {
    if (parentFilter === "all") return allEdgeServers;
    return allEdgeServers.filter((srv) => srv.parentServer === parentFilter);
  }, [allEdgeServers, parentFilter]);

  const filteredBothServers = useMemo(() => {
    if (parentFilter === "all") return bothServers;
    return bothServers.filter((srv) => srv.parentServer === parentFilter);
  }, [bothServers, parentFilter]);

  const showOriginSection = filter === "all" || filter === "origin";
  const showEdgeSection = filter === "all" || filter === "edge";
  const showBothSection = filter === "all" || filter === "both";

  if (!isOpen) return null;

  const handleAddUrl = () => {
    if (inputValue.trim()) {
      const urls = inputValue
        .split(/[,\n]/)
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const uniqueUrls = urls.filter((url) => !originUrls.includes(url));
      if (uniqueUrls.length > 0) {
        setOriginUrls([...originUrls, ...uniqueUrls]);
      }
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddUrl();
    }
    if (e.key === "Backspace" && inputValue === "" && originUrls.length > 0) {
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
    if (selectedServers.some((s) => s.id === server.id)) {
      setSelectedServers(selectedServers.filter((s) => s.id !== server.id));
    } else {
      setSelectedServers([...selectedServers, server]);
    }
  };

  const removeServer = (serverId: number) => {
    setSelectedServers(selectedServers.filter((s) => s.id !== serverId));
  };

  const toggleGroupSelection = (servers: Server[]) => {
    const allSelected = servers.every((srv) =>
      selectedServers.some((s) => s.id === srv.id)
    );
    if (allSelected) {
      setSelectedServers(
        selectedServers.filter((s) => !servers.some((srv) => srv.id === s.id))
      );
    } else {
      const newOnes = servers.filter(
        (srv) => !selectedServers.some((s) => s.id === srv.id)
      );
      setSelectedServers([...selectedServers, ...newOnes]);
    }
  };

  // ✅✅✅ FIXED handleSubmit — Timeout + finally తో
  const handleSubmit = async () => {
    if (originUrls.length === 0 || selectedServers.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // ✅ Timeout wrapper — 60 seconds తర్వాత force reject
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Route creation is taking longer than expected. It may still complete on the server. Please check the dashboard after a moment."
            )
          );
        }, 60000);
      });

      // ✅ Race: onSubmit vs timeout
      await Promise.race([
        onSubmit({ originUrls, selectedServers }),
        timeoutPromise,
      ]);

      console.log("✅ Route created successfully");

      // Reset form
      setOriginUrls([]);
      setInputValue("");
      setSelectedServers([]);
      setShowServerSelector(false);
      setFilter("all");
      setParentFilter("all");

      // ✅ Parent కి success event పంపండి (parent లో styled modal చూపించడానికి)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("route-created", {
            detail: {
              message:
                "Route creation started successfully! It may take 30-60 seconds to complete on all servers.",
            },
          })
        );
      }

      onClose();
    } catch (err) {
      console.error("Error creating route:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create route. Please try again.";
      setError(errorMessage);
    } finally {
      // ✅ ఇది ఎప్పుడూ execute అవుతుంది — spinner ఆగుతుంది
      setIsSubmitting(false);
    }
  };

  const handleBackToOverview = () => {
    router.push("/homepage");
    onClose();
  };

  // ============================================================
  // SERVER ROW COMPONENT
  // ============================================================
  const ServerRow = ({
    server,
    variant,
    showParent,
  }: {
    server: Server;
    variant: "origin" | "edge" | "both";
    showParent?: boolean;
  }) => {
    const isSelected = selectedServers.some((s) => s.id === server.id);

    const colorConfig = {
      origin: {
        accentBg: "bg-purple-500",
        badgeClasses:
          "bg-purple-500/15 text-purple-300 border-purple-500/40",
        selectedBg: "bg-purple-900/20 border-purple-500/30",
        label: "Origin",
      },
      edge: {
        accentBg: "bg-blue-500",
        badgeClasses: "bg-blue-500/15 text-blue-300 border-blue-500/40",
        selectedBg: "bg-blue-900/20 border-blue-500/30",
        label: "Edge",
      },
      both: {
        accentBg: "bg-green-500",
        badgeClasses: "bg-green-500/15 text-green-300 border-green-500/40",
        selectedBg: "bg-green-900/20 border-green-500/30",
        label: "Edge & Origin",
      },
    };

    const config = colorConfig[variant];

    return (
      <div
        onClick={() => toggleServer(server)}
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 border ${
          isSelected
            ? `${config.selectedBg} shadow-sm`
            : "border-transparent hover:bg-[#2f2f2f] hover:border-gray-700"
        }`}
      >
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected
              ? `${config.accentBg} border-transparent`
              : "border-gray-600 bg-transparent"
          }`}
        >
          {isSelected && <FiCheck className="text-white text-[10px]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">
              {server.displayName}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${config.badgeClasses}`}
            >
              {config.label}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
            <span className="text-gray-500 font-mono">{server.ipAddress}</span>

            {showParent && (
              <>
                <span className="text-gray-700">•</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                  Parent CDN:
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-semibold text-[11px] ${
                    server.parentServer && server.parentServer !== "None"
                      ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"
                      : "bg-red-500/10 text-red-300 border border-red-500/30"
                  }`}
                >
                  {server.parentServer && server.parentServer !== "None"
                    ? server.parentServer
                    : "Not assigned"}
                </span>
              </>
            )}
          </div>
        </div>

        {isSelected && (
          <span className="text-[10px] bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-500/30 font-semibold uppercase tracking-wider flex-shrink-0">
            Selected
          </span>
        )}
      </div>
    );
  };

  const GroupHeader = ({
    title,
    count,
    description,
    color,
    servers,
  }: {
    title: string;
    count: number;
    description: string;
    color: "purple" | "blue" | "green";
    servers: Server[];
  }) => {
    const allSelected =
      servers.length > 0 &&
      servers.every((srv) => selectedServers.some((s) => s.id === srv.id));
    const someSelected = servers.some((srv) =>
      selectedServers.some((s) => s.id === srv.id)
    );

    const dotClass = {
      purple: "bg-purple-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
    }[color];

    const textClass = {
      purple: "text-purple-300",
      blue: "text-blue-300",
      green: "text-green-300",
    }[color];

    const btnClass = {
      purple:
        "hover:bg-purple-600/20 text-purple-400 border-purple-500/30",
      blue: "hover:bg-blue-600/20 text-blue-400 border-blue-500/30",
      green: "hover:bg-green-600/20 text-green-400 border-green-500/30",
    }[color];

    return (
      <div className="flex items-center justify-between px-2 py-2 mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
          <h4
            className={`text-xs font-bold uppercase tracking-wider ${textClass}`}
          >
            {title}
          </h4>
          <span className="text-[10px] text-gray-500 font-mono">({count})</span>
          <span className="text-[10px] text-gray-600 hidden sm:inline">
            — {description}
          </span>
        </div>

        {count > 0 && (
          <button
            onClick={() => toggleGroupSelection(servers)}
            className={`text-[10px] px-2 py-1 rounded border font-semibold uppercase tracking-wider transition-colors ${btnClass}`}
          >
            {allSelected
              ? "Deselect All"
              : someSelected
              ? "Select Rest"
              : "Select All"}
          </button>
        )}
      </div>
    );
  };

  const FilterButton = ({
    value,
    label,
    count,
  }: {
    value: FilterType;
    label: string;
    count: number;
  }) => {
    const active = filter === value;
    return (
      <button
        onClick={() => setFilter(value)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
          active
            ? "bg-blue-600/20 text-blue-300 border-blue-500/50"
            : "bg-transparent text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-white"
        }`}
      >
        <span>{label}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${
            active ? "bg-blue-500/30 text-blue-200" : "bg-gray-800 text-gray-500"
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#1e1e1e] rounded-xl w-full max-w-5xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/80">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToOverview}
              className="flex items-center gap-2.5 px-3 py-2 -ml-2 hover:bg-gray-800 rounded-lg transition-colors group"
              title="Back to Overview"
              disabled={isSubmitting}
            >
              <FiArrowLeft className="text-gray-400 text-lg group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                Back to Overview
              </span>
            </button>
            <div className="h-6 w-px bg-gray-700"></div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Create Re-streaming Route
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure your streaming destination
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <FiX className="text-gray-400 text-xl hover:text-white transition-colors" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-10 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* STEP 1: ORIGIN URLS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-semibold">
                1
              </span>
              <label className="text-base font-semibold text-white tracking-wide">
                Origin stream URLs
              </label>
              <span className="text-xs text-gray-500 font-normal ml-2">
                (Required)
              </span>
            </div>

            <div className="space-y-3">
              <div
                className={`flex flex-wrap items-center gap-2 p-3 bg-[#252525] border rounded-lg transition-all duration-200 ${
                  isSubmitting
                    ? "border-gray-700 opacity-50"
                    : "border-gray-700 focus-within:border-blue-500/70 focus-within:bg-[#262626]"
                }`}
              >
                {originUrls.map((url, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 rounded-md text-sm text-blue-200 group hover:bg-blue-600/30 transition-colors"
                  >
                    <span className="max-w-[220px] truncate text-xs font-mono">
                      {url}
                    </span>
                    <button
                      onClick={() => removeUrl(index)}
                      disabled={isSubmitting}
                      className="p-0.5 hover:bg-blue-500/50 rounded-sm transition-colors disabled:opacity-50"
                      aria-label="Remove URL"
                    >
                      <FiX className="text-blue-300 text-xs" />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleAddUrl}
                  disabled={isSubmitting}
                  placeholder={
                    originUrls.length === 0
                      ? "Enter URL and press Enter or comma..."
                      : "Add another URL..."
                  }
                  className="flex-1 min-w-[240px] bg-transparent border-none outline-none text-white placeholder-gray-600 py-1.5 text-sm disabled:opacity-50"
                  autoFocus
                />
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-4 py-2.5">
                <p className="text-xs text-yellow-300/90 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  Example:
                  http://10.10.148.25:8081/Allocal2/Allocal2/manifest.mpd
                </p>
              </div>
            </div>
          </div>

          {/* STEP 2: SELECT SERVERS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-semibold">
                2
              </span>
              <label className="text-base font-semibold text-white tracking-wide">
                Select destination servers
              </label>
              <span className="text-xs text-gray-500 font-normal ml-2">
                (Required)
              </span>
            </div>

            {availableServers.length === 0 ? (
              <div className="p-8 bg-[#252525] rounded-lg border border-gray-700/80 text-center">
                <div className="bg-yellow-700/20 p-3 rounded-full w-fit mx-auto mb-4">
                  <FiServer className="text-2xl text-yellow-500" />
                </div>
                <p className="text-gray-300 font-medium">
                  No servers available
                </p>
                <p className="text-sm text-gray-500 mt-1.5">
                  Please add servers in the infrastructure section
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected tags + Choose button */}
                <div
                  className={`flex flex-wrap items-center gap-2 p-3 bg-[#252525] border rounded-lg transition-all duration-200 ${
                    isSubmitting
                      ? "border-gray-700 opacity-50"
                      : "border-gray-700 focus-within:border-green-500/70"
                  }`}
                >
                  {selectedServers.map((server) => {
                    const tagColor =
                      server.serverType === "origin"
                        ? "bg-purple-600/20 border border-purple-500/40 text-purple-200 hover:bg-purple-600/30"
                        : server.serverType === "both"
                        ? "bg-green-600/20 border border-green-500/40 text-green-200 hover:bg-green-600/30"
                        : "bg-blue-600/20 border border-blue-500/40 text-blue-200 hover:bg-blue-600/30";

                    const tagLabel =
                      server.serverType === "origin"
                        ? "origin"
                        : server.serverType === "both"
                        ? "both"
                        : "edge";

                    return (
                      <span
                        key={server.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs group transition-colors ${tagColor}`}
                      >
                        <span className="font-semibold">
                          {server.displayName}
                        </span>
                        <span className="text-[9px] uppercase opacity-70 font-bold">
                          {tagLabel}
                        </span>
                        <button
                          onClick={() => removeServer(server.id)}
                          disabled={isSubmitting}
                          className="p-0.5 hover:bg-white/10 rounded-sm transition-colors ml-0.5 disabled:opacity-50"
                          aria-label="Remove server"
                        >
                          <FiX className="text-xs" />
                        </button>
                      </span>
                    );
                  })}

                  <button
                    onClick={() => setShowServerSelector(!showServerSelector)}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ${
                      selectedServers.length === 0
                        ? "bg-yellow-700 hover:bg-yellow-600 text-white border border-yellow-600"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FiPlus className="text-sm" />
                    <span className="text-xs font-medium">
                      {selectedServers.length === 0
                        ? "Choose servers"
                        : "Add more servers"}
                    </span>
                    <FiChevronDown
                      className={`text-xs transition-transform ${
                        showServerSelector ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* SERVER SELECTOR PANEL */}
                {showServerSelector && !isSubmitting && (
                  <div className="mt-3 bg-[#252525] rounded-lg border border-gray-700/80 shadow-xl overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-gray-700/80 bg-[#222] flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FiFilter className="text-gray-400 text-xs" />
                          <span className="text-xs font-medium text-gray-300">
                            Filter:
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            <FilterButton
                              value="all"
                              label="All"
                              count={availableServers.length}
                            />
                            <FilterButton
                              value="origin"
                              label="Origin"
                              count={originServers.length}
                            />
                            <FilterButton
                              value="edge"
                              label="Edge"
                              count={allEdgeServers.length}
                            />
                            <FilterButton
                              value="both"
                              label="Edge & Origin"
                              count={bothServers.length}
                            />
                          </div>
                        </div>

                        <div className="h-5 w-px bg-gray-700 hidden sm:block"></div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold">
                            Parent CDN:
                          </span>
                          <div className="relative">
                            <select
                              value={parentFilter}
                              onChange={(e) => setParentFilter(e.target.value)}
                              className="appearance-none bg-[#2a2a2a] text-xs font-semibold text-yellow-200 border border-yellow-500/40 rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 hover:bg-[#333] transition-colors cursor-pointer"
                            >
                              <option value="all">
                                All Parents ({parentCdnOptions.length})
                              </option>
                              {parentCdnOptions.map((parent) => {
                                const countForParent = [
                                  ...allEdgeServers,
                                  ...bothServers,
                                ].filter((s) => s.parentServer === parent)
                                  .length;
                                return (
                                  <option key={parent} value={parent}>
                                    {parent} ({countForParent} server
                                    {countForParent !== 1 ? "s" : ""})
                                  </option>
                                );
                              })}
                            </select>
                            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-400 text-xs pointer-events-none" />
                          </div>

                          {parentFilter !== "all" && (
                            <button
                              onClick={() => setParentFilter("all")}
                              className="p-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 transition-colors"
                              title="Clear parent filter"
                            >
                              <FiX className="text-xs" />
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setShowServerSelector(false)}
                        className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors border border-gray-600 self-start lg:self-auto"
                      >
                        Done
                      </button>
                    </div>

                    {/* Server list */}
                    <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                      {/* ORIGIN SECTION */}
                      {showOriginSection && originServers.length > 0 && (
                        <div>
                          <GroupHeader
                            title="Origin Servers"
                            count={originServers.length}
                            description="Content sources"
                            color="purple"
                            servers={originServers}
                          />
                          <div className="space-y-1">
                            {originServers.map((server) => (
                              <ServerRow
                                key={server.id}
                                server={server}
                                variant="origin"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {filter === "all" &&
                        originServers.length > 0 &&
                        (filteredEdgeServers.length > 0 ||
                          filteredBothServers.length > 0) && (
                          <div className="h-px bg-gray-700/60 mx-2 my-2"></div>
                        )}

                      {/* EDGE SECTION */}
                      {showEdgeSection && filteredEdgeServers.length > 0 && (
                        <div>
                          <GroupHeader
                            title={
                              parentFilter === "all"
                                ? "Edge Servers"
                                : `Edge Servers under "${parentFilter}"`
                            }
                            count={filteredEdgeServers.length}
                            description="Content distributors"
                            color="blue"
                            servers={filteredEdgeServers}
                          />
                          <div className="space-y-1">
                            {filteredEdgeServers.map((server) => (
                              <ServerRow
                                key={server.id}
                                server={server}
                                variant="edge"
                                showParent={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {filter === "all" &&
                        filteredEdgeServers.length > 0 &&
                        filteredBothServers.length > 0 && (
                          <div className="h-px bg-gray-700/60 mx-2 my-2"></div>
                        )}

                      {/* EDGE & ORIGIN SECTION */}
                      {showBothSection && filteredBothServers.length > 0 && (
                        <div>
                          <GroupHeader
                            title={
                              parentFilter === "all"
                                ? "Edge & Origin Servers"
                                : `Edge & Origin under "${parentFilter}"`
                            }
                            count={filteredBothServers.length}
                            description="Content source + distributor"
                            color="green"
                            servers={filteredBothServers}
                          />
                          <div className="space-y-1">
                            {filteredBothServers.map((server) => (
                              <ServerRow
                                key={server.id}
                                server={server}
                                variant="both"
                                showParent={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty states */}
                      {parentFilter !== "all" &&
                        (filter === "all" ||
                          filter === "edge" ||
                          filter === "both") &&
                        filteredEdgeServers.length === 0 &&
                        filteredBothServers.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-xs text-gray-500">
                              No edge / edge&amp;origin servers found under
                              parent CDN{" "}
                              <span className="text-yellow-400 font-mono font-semibold">
                                {parentFilter}
                              </span>
                            </p>
                            <button
                              onClick={() => setParentFilter("all")}
                              className="mt-2 text-[10px] px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600"
                            >
                              Clear Parent Filter
                            </button>
                          </div>
                        )}

                      {filter === "origin" && originServers.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-6">
                          No origin servers found
                        </p>
                      )}

                      {filter === "edge" &&
                        parentFilter === "all" &&
                        allEdgeServers.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-6">
                            No edge servers found
                          </p>
                        )}

                      {filter === "both" &&
                        parentFilter === "all" &&
                        bothServers.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-6">
                            No Edge &amp; Origin servers found
                          </p>
                        )}
                    </div>
                  </div>
                )}

                {selectedServers.length > 0 && (
                  <div className="flex items-center gap-3 px-3 py-2 bg-green-900/20 border border-green-700/30 rounded-lg flex-wrap">
                    <span className="text-xs text-green-400 font-semibold">
                      ✓ {selectedServers.length} server
                      {selectedServers.length !== 1 ? "s" : ""} selected
                    </span>
                    {selectedServers.filter((s) => s.serverType === "origin")
                      .length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                        {
                          selectedServers.filter(
                            (s) => s.serverType === "origin"
                          ).length
                        }{" "}
                        Origin
                      </span>
                    )}
                    {selectedServers.filter((s) => s.serverType === "edge")
                      .length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                        {
                          selectedServers.filter(
                            (s) => s.serverType === "edge"
                          ).length
                        }{" "}
                        Edge
                      </span>
                    )}
                    {selectedServers.filter((s) => s.serverType === "both")
                      .length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30 font-semibold">
                        {
                          selectedServers.filter(
                            (s) => s.serverType === "both"
                          ).length
                        }{" "}
                        Edge &amp; Origin
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between gap-3 px-8 py-5 bg-[#1a1a1a] border-t border-gray-700/80">
          <div className="text-xs text-gray-500">
            {selectedServers.length > 0 && (
              <span className="flex items-center gap-1.5">
                <FiCheck className="text-green-500 text-xs" />
                Ready to create route
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-300 transition-colors border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                originUrls.length === 0 ||
                selectedServers.length === 0 ||
                isSubmitting
              }
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                originUrls.length > 0 &&
                selectedServers.length > 0 &&
                !isSubmitting
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-600/20 border border-blue-500/50"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Route...
                </>
              ) : (
                <>
                  <FiPlus
                    className={`text-base ${
                      originUrls.length > 0 && selectedServers.length > 0
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  />
                  Create Route
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRouteModal;

