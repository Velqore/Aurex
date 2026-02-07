"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  Globe,
  Eye,
  Clock,
  Filter,
  RotateCw,
  ExternalLink,
  Star,
} from "lucide-react";

interface ThreatFeedProps {
  user: any;
}

interface ThreatIntel {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  source: string;
  timestamp: Date;
  iocs: string[];
  tags: string[];
  tlp: "white" | "green" | "amber" | "red";
  starred: boolean;
  read: boolean;
}

export default function ThreatFeed({ user }: ThreatFeedProps) {
  const [threats, setThreats] = useState<ThreatIntel[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<ThreatIntel | null>(
    null,
  );

  useEffect(() => {
    // Mock threat intelligence data
    const mockThreats: ThreatIntel[] = [
      {
        id: "1",
        title: "New APT Campaign Targeting Financial Institutions",
        description:
          "Advanced persistent threat group APT-X has been observed targeting major financial institutions using spear-phishing emails with malicious PDF attachments.",
        severity: "critical",
        category: "APT",
        source: "CyberThreat Intel",
        timestamp: new Date(Date.now() - 300000),
        iocs: [
          "malicious-domain.evil",
          "192.168.1.100",
          "e3b0c44298fc1c149afbf4c8996fb924",
        ],
        tags: ["banking", "spear-phishing", "pdf", "apt"],
        tlp: "amber",
        starred: true,
        read: false,
      },
      {
        id: "2",
        title: "Ransomware Group Updates Encryption Methods",
        description:
          "BlackCat ransomware group has updated their encryption algorithms and is now using a hybrid approach with both symmetric and asymmetric encryption.",
        severity: "high",
        category: "Ransomware",
        source: "RansomWatch",
        timestamp: new Date(Date.now() - 900000),
        iocs: ["ransom-payment.onion", "a1b2c3d4e5f6789012345678901234567890"],
        tags: ["ransomware", "encryption", "blackcat"],
        tlp: "green",
        starred: false,
        read: true,
      },
      {
        id: "3",
        title: "Zero-Day Vulnerability in Popular Web Framework",
        description:
          "A critical zero-day vulnerability has been discovered in ReactJS that allows remote code execution. Immediate patching recommended.",
        severity: "critical",
        category: "Vulnerability",
        source: "CVE Database",
        timestamp: new Date(Date.now() - 1800000),
        iocs: ["CVE-2024-12345"],
        tags: ["zero-day", "web", "rce", "react"],
        tlp: "white",
        starred: false,
        read: false,
      },
      {
        id: "4",
        title: "Botnet Infrastructure Takedown",
        description:
          "International law enforcement has successfully taken down the infrastructure of the Mirai botnet variant, disrupting operations affecting over 100,000 devices.",
        severity: "medium",
        category: "Botnet",
        source: "Law Enforcement",
        timestamp: new Date(Date.now() - 3600000),
        iocs: ["botnet-c2.example.com", "203.0.113.0/24"],
        tags: ["botnet", "takedown", "mirai", "iot"],
        tlp: "green",
        starred: false,
        read: true,
      },
      {
        id: "5",
        title: "Supply Chain Attack on Software Distribution",
        description:
          "Malicious actors have compromised a popular software distribution platform, injecting backdoors into legitimate applications.",
        severity: "high",
        category: "Supply Chain",
        source: "Security Vendor",
        timestamp: new Date(Date.now() - 7200000),
        iocs: ["compromised-repo.com", "backdoor.dll"],
        tags: ["supply-chain", "backdoor", "software"],
        tlp: "amber",
        starred: true,
        read: false,
      },
    ];

    setThreats(mockThreats);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-cyber-red border-cyber-red";
      case "high":
        return "text-orange-400 border-orange-400";
      case "medium":
        return "text-yellow-400 border-yellow-400";
      case "low":
        return "text-cyber-green border-cyber-green";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  const getTlpColor = (tlp: string) => {
    switch (tlp) {
      case "red":
        return "bg-red-500";
      case "amber":
        return "bg-yellow-500";
      case "green":
        return "bg-green-500";
      case "white":
        return "bg-white";
      default:
        return "bg-gray-500";
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate new threats
      const newThreat: ThreatIntel = {
        id: Math.random().toString(36).substr(2, 9),
        title: "Real-time Threat Alert",
        description:
          "New malware campaign detected targeting healthcare infrastructure.",
        severity: "high",
        category: "Malware",
        source: "Live Feed",
        timestamp: new Date(),
        iocs: ["new-threat.malware"],
        tags: ["healthcare", "malware", "real-time"],
        tlp: "amber",
        starred: false,
        read: false,
      };
      setThreats((prev) => [newThreat, ...prev]);
      setIsRefreshing(false);
    }, 2000);
  };

  const toggleStar = (threatId: string) => {
    setThreats((prev) =>
      prev.map((threat) =>
        threat.id === threatId
          ? { ...threat, starred: !threat.starred }
          : threat,
      ),
    );
  };

  const markAsRead = (threatId: string) => {
    setThreats((prev) =>
      prev.map((threat) =>
        threat.id === threatId ? { ...threat, read: true } : threat,
      ),
    );
  };

  const filteredThreats = threats.filter((threat) => {
    const categoryMatch =
      filterCategory === "all" ||
      threat.category.toLowerCase() === filterCategory.toLowerCase();
    const severityMatch =
      filterSeverity === "all" || threat.severity === filterSeverity;
    return categoryMatch && severityMatch;
  });

  const categories = Array.from(new Set(threats.map((t) => t.category)));

  return (
    <div className="flex h-full">
      {/* Threat List */}
      <div className="w-96 bg-cyber-gray border-r border-cyber-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-cyber-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-cyber-blue">
              Threat Intelligence
            </h2>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-cyber-blue rounded"
            >
              <RotateCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-cyber-blue mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="cyber-input w-full text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-cyber-blue mb-1">
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="cyber-input w-full text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Threat Feed */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {filteredThreats.map((threat) => (
              <motion.div
                key={threat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-4 border-b border-cyber-border cursor-pointer transition-all ${
                  selectedThreat?.id === threat.id
                    ? "bg-cyber-blue bg-opacity-20 border-cyber-blue"
                    : "hover:bg-cyber-border"
                } ${!threat.read ? "border-l-4 border-l-cyber-blue" : ""}`}
                onClick={() => {
                  setSelectedThreat(threat);
                  markAsRead(threat.id);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getTlpColor(threat.tlp)}`}
                    />
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getSeverityColor(threat.severity)}`}
                    >
                      {threat.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(threat.id);
                      }}
                      className={`p-1 rounded ${
                        threat.starred
                          ? "text-yellow-400"
                          : "text-gray-400 hover:text-yellow-400"
                      }`}
                    >
                      <Star
                        className="h-3 w-3"
                        fill={threat.starred ? "currentColor" : "none"}
                      />
                    </button>
                    {!threat.read && (
                      <div className="w-2 h-2 bg-cyber-blue rounded-full" />
                    )}
                  </div>
                </div>

                <h3 className="font-medium text-cyber-blue text-sm mb-1 line-clamp-2">
                  {threat.title}
                </h3>

                <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                  {threat.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{threat.source}</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {threat.timestamp
                        ? threat.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {threat.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-cyber-border text-gray-300 px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {threat.tags.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{threat.tags.length - 3}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Threat Details */}
      <div className="flex-1 flex flex-col">
        {selectedThreat ? (
          <>
            {/* Threat Header */}
            <div className="p-6 border-b border-cyber-border bg-cyber-gray">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getTlpColor(selectedThreat.tlp)}`}
                    />
                    <span
                      className={`text-sm px-3 py-1 rounded border ${getSeverityColor(selectedThreat.severity)}`}
                    >
                      {selectedThreat.severity.toUpperCase()}
                    </span>
                    <span className="text-sm bg-cyber-border text-gray-300 px-2 py-1 rounded">
                      {selectedThreat.category}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-cyber-blue mb-2">
                    {selectedThreat.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Source: {selectedThreat.source}</span>
                    <span>•</span>
                    <span>
                      {selectedThreat.timestamp
                        ? selectedThreat.timestamp.toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleStar(selectedThreat.id)}
                  className={`p-2 rounded ${
                    selectedThreat.starred
                      ? "text-yellow-400"
                      : "text-gray-400 hover:text-yellow-400"
                  }`}
                >
                  <Star
                    className="h-5 w-5"
                    fill={selectedThreat.starred ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>

            {/* Threat Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-medium text-cyber-blue mb-3">
                    Description
                  </h3>
                  <div className="cyber-panel">
                    <p className="text-gray-300 leading-relaxed">
                      {selectedThreat.description}
                    </p>
                  </div>
                </div>

                {/* IOCs */}
                {selectedThreat.iocs.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-cyber-blue mb-3">
                      Indicators of Compromise (IOCs)
                    </h3>
                    <div className="cyber-panel">
                      <div className="space-y-2">
                        {selectedThreat.iocs.map((ioc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-cyber-darker rounded"
                          >
                            <code className="text-cyber-green font-mono text-sm">
                              {ioc}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(ioc)}
                              className="text-gray-400 hover:text-cyber-blue"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h3 className="text-lg font-medium text-cyber-blue mb-3">
                    Tags
                  </h3>
                  <div className="cyber-panel">
                    <div className="flex flex-wrap gap-2">
                      {selectedThreat.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-sm bg-cyber-border text-gray-300 px-3 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-lg font-medium text-cyber-blue mb-3">
                    Recommendations
                  </h3>
                  <div className="cyber-panel">
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-cyber-green mt-0.5 flex-shrink-0" />
                        <span>Monitor network traffic for the listed IOCs</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-cyber-green mt-0.5 flex-shrink-0" />
                        <span>Update security controls and signatures</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-cyber-green mt-0.5 flex-shrink-0" />
                        <span>Review and enhance email security measures</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-cyber-green mt-0.5 flex-shrink-0" />
                        <span>Conduct user awareness training</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-cyber-blue mb-2">
                Select a Threat
              </h3>
              <p className="text-gray-400">
                Choose a threat from the feed to view detailed intelligence
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
