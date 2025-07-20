"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  File,
  Folder,
  Lock,
  Shield,
  Trash2,
  Eye,
  Search,
  Filter,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface FileVaultProps {
  user: any;
}

interface VaultFile {
  id: string;
  name: string;
  type: "file" | "folder";
  size: number;
  encrypted: boolean;
  uploadDate: Date;
  lastAccessed: Date;
  owner: string;
  shared: boolean;
  hash?: string;
  scanStatus: "clean" | "scanning" | "threat" | "unknown";
}

export default function FileVault({ user }: FileVaultProps) {
  const [files, setFiles] = useState<VaultFile[]>([
    {
      id: "1",
      name: "malware_sample.exe",
      type: "file",
      size: 2048576,
      encrypted: true,
      uploadDate: new Date(Date.now() - 86400000),
      lastAccessed: new Date(Date.now() - 3600000),
      owner: "Dr. Sarah Chen",
      shared: true,
      hash: "e3b0c44298fc1c149afbf4c8996fb924",
      scanStatus: "threat",
    },
    {
      id: "2",
      name: "network_logs",
      type: "folder",
      size: 0,
      encrypted: true,
      uploadDate: new Date(Date.now() - 172800000),
      lastAccessed: new Date(Date.now() - 7200000),
      owner: user?.username || "You",
      shared: false,
      scanStatus: "clean",
    },
    {
      id: "3",
      name: "forensic_report.pdf",
      type: "file",
      size: 1024000,
      encrypted: true,
      uploadDate: new Date(Date.now() - 259200000),
      lastAccessed: new Date(Date.now() - 14400000),
      owner: user?.username || "You",
      shared: false,
      hash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      scanStatus: "clean",
    },
    {
      id: "4",
      name: "suspicious_script.js",
      type: "file",
      size: 4096,
      encrypted: true,
      uploadDate: new Date(Date.now() - 345600000),
      lastAccessed: new Date(),
      owner: "Alex Thompson",
      shared: true,
      hash: "f7e6d5c4b3a29180f7e6d5c4b3a29180",
      scanStatus: "scanning",
    },
  ]);

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const getFileIcon = (file: VaultFile) => {
    if (file.type === "folder") return Folder;
    return File;
  };

  const getScanStatusIcon = (status: string) => {
    switch (status) {
      case "clean":
        return <CheckCircle className="h-4 w-4 text-cyber-green" />;
      case "threat":
        return <AlertTriangle className="h-4 w-4 text-cyber-red" />;
      case "scanning":
        return <Clock className="h-4 w-4 text-cyber-blue animate-spin" />;
      default:
        return <Eye className="h-4 w-4 text-gray-400" />;
    }
  };

  const getScanStatusText = (status: string) => {
    switch (status) {
      case "clean":
        return "Clean";
      case "threat":
        return "Threat Detected";
      case "scanning":
        return "Scanning...";
      default:
        return "Unknown";
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      const newFiles: VaultFile[] = Array.from(uploadedFiles).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: "file",
        size: file.size,
        encrypted: true,
        uploadDate: new Date(),
        lastAccessed: new Date(),
        owner: user?.username || "You",
        shared: false,
        scanStatus: "scanning" as const,
      }));

      setFiles((prev) => [...newFiles, ...prev]);
      setIsUploading(false);

      // Simulate scan completion
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((file) =>
            newFiles.find((nf) => nf.id === file.id)
              ? { ...file, scanStatus: "clean" as const }
              : file,
          ),
        );
      }, 3000);
    }, 2000);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || file.scanStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-cyber-border bg-cyber-gray">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-cyber-blue">
              Secure File Vault
            </h2>
            <p className="text-gray-400">
              Encrypted storage for sensitive files
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs text-cyber-green">
              <Lock className="h-3 w-3 mr-1" />
              <span>AES-256 Encrypted</span>
            </div>
            <div className="flex items-center text-xs text-cyber-blue">
              <Shield className="h-3 w-3 mr-1" />
              <span>Malware Scanned</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cyber-input w-full pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="cyber-input pl-10 pr-8 appearance-none"
            >
              <option value="all">All Files</option>
              <option value="clean">Clean</option>
              <option value="threat">Threats</option>
              <option value="scanning">Scanning</option>
            </select>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="cyber-button flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>{isUploading ? "Uploading..." : "Upload"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-cyber-blue mb-2">
                No Files Found
              </h3>
              <p className="text-gray-400">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Upload files to get started"}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-2">
              <AnimatePresence>
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file);
                  const isSelected = selectedFiles.includes(file.id);

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`cyber-panel hover:bg-cyber-border transition-all cursor-pointer ${
                        isSelected
                          ? "border-cyber-blue bg-cyber-blue bg-opacity-10"
                          : ""
                      }`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      <div className="flex items-center space-x-4">
                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          <FileIcon className="h-8 w-8 text-cyber-blue" />
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-cyber-blue truncate">
                              {file.name}
                            </h3>
                            {file.encrypted && (
                              <Lock className="h-3 w-3 text-cyber-green" />
                            )}
                            {file.shared && (
                              <span className="text-xs bg-cyber-purple text-white px-1.5 py-0.5 rounded">
                                Shared
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>
                              {file.type === "file"
                                ? formatFileSize(file.size)
                                : "Folder"}
                            </span>
                            <span>Owner: {file.owner}</span>
                            <span>Uploaded: {formatDate(file.uploadDate)}</span>
                          </div>
                          {file.hash && (
                            <div className="mt-1">
                              <span className="text-xs text-gray-500 font-mono">
                                SHA256: {file.hash}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Scan Status */}
                        <div className="flex items-center space-x-2">
                          {getScanStatusIcon(file.scanStatus)}
                          <span
                            className={`text-xs font-medium ${
                              file.scanStatus === "clean"
                                ? "text-cyber-green"
                                : file.scanStatus === "threat"
                                  ? "text-cyber-red"
                                  : file.scanStatus === "scanning"
                                    ? "text-cyber-blue"
                                    : "text-gray-400"
                            }`}
                          >
                            {getScanStatusText(file.scanStatus)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle download
                            }}
                            className="p-2 text-gray-400 hover:text-cyber-blue rounded"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle more options
                            }}
                            className="p-2 text-gray-400 hover:text-cyber-blue rounded"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedFiles.length > 0 && (
        <div className="p-4 border-t border-cyber-border bg-cyber-gray">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="cyber-button flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button className="cyber-button border-cyber-red text-cyber-red hover:bg-cyber-red hover:text-white flex items-center space-x-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
