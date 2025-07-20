"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Hash,
  Globe,
  Code,
  Binary,
  Search,
  Copy,
  CheckCircle,
  Play,
  Download,
  Upload,
} from "lucide-react";
import Console from "./Console";
import CryptoJS from "crypto-js";
import { useAppStore } from "../../lib/stores/appStore";

interface ToolsPanelProps {
  user: any;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  premium?: boolean;
}

export default function ToolsPanel({ user }: ToolsPanelProps) {
  const { setCurrentView } = useAppStore();
  const [activeTool, setActiveTool] = useState<string | null>("console");
  const [toolInputs, setToolInputs] = useState<{ [key: string]: any }>({});
  const [toolOutputs, setToolOutputs] = useState<{ [key: string]: any }>({});
  const [copied, setCopied] = useState<string | null>(null);

  const tools: Tool[] = [
    {
      id: "hash",
      name: "Hash Calculator",
      description: "Generate MD5, SHA1, SHA256, SHA512 hashes",
      icon: Hash,
      category: "Cryptography",
    },
    {
      id: "base64",
      name: "Base64 Encoder/Decoder",
      description: "Encode and decode Base64 strings",
      icon: Code,
      category: "Encoding",
    },
    {
      id: "whois",
      name: "WHOIS Lookup",
      description: "Domain and IP address information",
      icon: Globe,
      category: "Network",
      premium: true,
    },
    {
      id: "binary",
      name: "Binary Converter",
      description: "Convert between binary, hex, and decimal",
      icon: Binary,
      category: "Conversion",
    },
    {
      id: "urlanalyzer",
      name: "URL Analyzer",
      description: "Analyze suspicious URLs for threats",
      icon: Search,
      category: "Analysis",
      premium: true,
    },
    {
      id: "hexdump",
      name: "Hex Dump Viewer",
      description: "View binary files in hexadecimal format",
      icon: Terminal,
      category: "Analysis",
    },
    {
      id: "console",
      name: "Interactive Console",
      description: "Command-line interface for advanced forensics",
      icon: Terminal,
      category: "Terminal",
    },
  ];

  const categories = Array.from(new Set(tools.map((tool) => tool.category)));

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
    if (!toolInputs[toolId]) {
      setToolInputs((prev) => ({ ...prev, [toolId]: {} }));
    }
  };

  const handleInputChange = (toolId: string, field: string, value: string) => {
    setToolInputs((prev) => ({
      ...prev,
      [toolId]: { ...prev[toolId], [field]: value },
    }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const executeTool = (toolId: string) => {
    const input = toolInputs[toolId] || {};
    let output: any = {};

    try {
      switch (toolId) {
        case "hash":
          if (input.text) {
            output = {
              md5: CryptoJS.MD5(input.text).toString(),
              sha1: CryptoJS.SHA1(input.text).toString(),
              sha256: CryptoJS.SHA256(input.text).toString(),
              sha512: CryptoJS.SHA512(input.text).toString(),
            };
          }
          break;

        case "base64":
          if (input.mode === "encode" && input.text) {
            output.result = btoa(input.text);
          } else if (input.mode === "decode" && input.text) {
            try {
              output.result = atob(input.text);
            } catch {
              output.error = "Invalid Base64 string";
            }
          }
          break;

        case "binary":
          if (input.text && input.from && input.to) {
            try {
              let decimal: number;
              if (input.from === "binary") {
                decimal = parseInt(input.text, 2);
              } else if (input.from === "hex") {
                decimal = parseInt(input.text, 16);
              } else {
                decimal = parseInt(input.text, 10);
              }

              if (input.to === "binary") {
                output.result = decimal.toString(2);
              } else if (input.to === "hex") {
                output.result = decimal.toString(16).toUpperCase();
              } else {
                output.result = decimal.toString();
              }
            } catch {
              output.error = "Invalid input format";
            }
          }
          break;

        case "whois":
          // Mock WHOIS data
          if (input.domain) {
            output = {
              domain: input.domain,
              registrar: "Example Registrar Inc.",
              created: "2020-01-15",
              expires: "2025-01-15",
              nameservers: ["ns1.example.com", "ns2.example.com"],
              status: "Active",
            };
          }
          break;

        case "urlanalyzer":
          // Mock URL analysis
          if (input.url) {
            output = {
              url: input.url,
              reputation: "Clean",
              riskScore: Math.floor(Math.random() * 100),
              categories: ["Technology", "Business"],
              lastSeen: new Date().toISOString(),
            };
          }
          break;

        default:
          output.error = "Tool not implemented";
      }
    } catch (error) {
      output.error =
        error instanceof Error ? error.message : "An error occurred";
    }

    setToolOutputs((prev) => ({ ...prev, [toolId]: output }));
  };

  const renderToolInterface = (tool: Tool) => {
    const input = toolInputs[tool.id] || {};
    const output = toolOutputs[tool.id] || {};

    if (tool.premium && user?.role === "free") {
      return (
        <div className="text-center py-8">
          <div className="cyber-panel bg-cyber-red bg-opacity-10 border-cyber-red">
            <h3 className="text-cyber-red font-medium mb-2">Premium Feature</h3>
            <p className="text-gray-400 text-sm mb-4">
              This tool requires a Pro or Enterprise subscription.
            </p>
            <button
              onClick={() => setCurrentView("settings")}
              className="cyber-button text-cyber-red border-cyber-red hover:bg-cyber-red hover:text-white"
            >
              Upgrade Account
            </button>
          </div>
        </div>
      );
    }

    switch (tool.id) {
      case "hash":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Input Text
              </label>
              <textarea
                value={input.text || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "text", e.target.value)
                }
                className="cyber-input w-full h-32 resize-none"
                placeholder="Enter text to hash..."
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              className="cyber-button flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Calculate Hashes</span>
            </button>
            {output.md5 && (
              <div className="space-y-3">
                {Object.entries(output).map(([algo, hash]) => (
                  <div key={algo} className="cyber-panel">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyber-blue font-medium uppercase">
                        {algo}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(hash as string, `${tool.id}-${algo}`)
                        }
                        className="text-gray-400 hover:text-cyber-blue"
                      >
                        {copied === `${tool.id}-${algo}` ? (
                          <CheckCircle className="h-4 w-4 text-cyber-green" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <code className="text-cyber-green text-sm font-mono break-all">
                      {hash as string}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "base64":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Mode
              </label>
              <select
                value={input.mode || "encode"}
                onChange={(e) =>
                  handleInputChange(tool.id, "mode", e.target.value)
                }
                className="cyber-input w-full"
              >
                <option value="encode">Encode</option>
                <option value="decode">Decode</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Input
              </label>
              <textarea
                value={input.text || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "text", e.target.value)
                }
                className="cyber-input w-full h-32 resize-none"
                placeholder={`Enter text to ${input.mode || "encode"}...`}
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              className="cyber-button flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>{input.mode === "decode" ? "Decode" : "Encode"}</span>
            </button>
            {(output.result || output.error) && (
              <div className="cyber-panel">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyber-blue font-medium">Result</span>
                  {output.result && (
                    <button
                      onClick={() =>
                        copyToClipboard(output.result, `${tool.id}-result`)
                      }
                      className="text-gray-400 hover:text-cyber-blue"
                    >
                      {copied === `${tool.id}-result` ? (
                        <CheckCircle className="h-4 w-4 text-cyber-green" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                <code
                  className={`text-sm font-mono break-all ${
                    output.error ? "text-cyber-red" : "text-cyber-green"
                  }`}
                >
                  {output.result || output.error}
                </code>
              </div>
            )}
          </div>
        );

      case "binary":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyber-blue mb-2">
                  From
                </label>
                <select
                  value={input.from || "decimal"}
                  onChange={(e) =>
                    handleInputChange(tool.id, "from", e.target.value)
                  }
                  className="cyber-input w-full"
                >
                  <option value="decimal">Decimal</option>
                  <option value="binary">Binary</option>
                  <option value="hex">Hexadecimal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-cyber-blue mb-2">
                  To
                </label>
                <select
                  value={input.to || "binary"}
                  onChange={(e) =>
                    handleInputChange(tool.id, "to", e.target.value)
                  }
                  className="cyber-input w-full"
                >
                  <option value="decimal">Decimal</option>
                  <option value="binary">Binary</option>
                  <option value="hex">Hexadecimal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Input Value
              </label>
              <input
                type="text"
                value={input.text || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "text", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="Enter value to convert..."
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              className="cyber-button flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Convert</span>
            </button>
            {(output.result || output.error) && (
              <div className="cyber-panel">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyber-blue font-medium">Result</span>
                  {output.result && (
                    <button
                      onClick={() =>
                        copyToClipboard(output.result, `${tool.id}-result`)
                      }
                      className="text-gray-400 hover:text-cyber-blue"
                    >
                      {copied === `${tool.id}-result` ? (
                        <CheckCircle className="h-4 w-4 text-cyber-green" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                <code
                  className={`text-lg font-mono ${
                    output.error ? "text-cyber-red" : "text-cyber-green"
                  }`}
                >
                  {output.result || output.error}
                </code>
              </div>
            )}
          </div>
        );

      case "console":
        try {
          return <Console user={user} />;
        } catch (error) {
          return (
            <div className="text-center py-8">
              <Terminal className="h-16 w-16 text-cyber-red mx-auto mb-4" />
              <p className="text-cyber-red">Console temporarily unavailable</p>
            </div>
          );
        }

      default:
        return (
          <div className="text-center py-8">
            <Terminal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Tool interface not implemented yet</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Tools Sidebar */}
      <div className="w-80 bg-cyber-gray border-r border-cyber-border">
        <div className="p-4 border-b border-cyber-border">
          <h2 className="text-xl font-bold text-cyber-blue">
            Forensics Toolkit
          </h2>
          <p className="text-sm text-gray-400">Security analysis tools</p>
        </div>

        <div className="p-4">
          {categories.map((category) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-cyber-green mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {tools
                  .filter((tool) => tool.category === category)
                  .map((tool) => {
                    const Icon = tool.icon;
                    const isPremium = tool.premium && user?.role === "free";

                    return (
                      <motion.button
                        key={tool.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToolSelect(tool.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          activeTool === tool.id
                            ? "bg-cyber-blue bg-opacity-20 border border-cyber-blue"
                            : "hover:bg-cyber-border"
                        } ${isPremium ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start">
                          <Icon
                            className={`h-5 w-5 mr-3 mt-0.5 ${
                              isPremium ? "text-cyber-red" : "text-cyber-blue"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-cyber-blue text-sm">
                                {tool.name}
                              </span>
                              {tool.premium && (
                                <span className="ml-2 text-xs bg-cyber-red text-white px-1.5 py-0.5 rounded">
                                  PRO
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool Interface */}
      <div className="flex-1 p-6">
        {activeTool ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-cyber-blue mb-2">
                {tools.find((t) => t.id === activeTool)?.name}
              </h2>
              <p className="text-gray-400">
                {tools.find((t) => t.id === activeTool)?.description}
              </p>
            </div>
            <div className="cyber-panel">
              {renderToolInterface(tools.find((t) => t.id === activeTool)!)}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Terminal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-cyber-blue mb-2">
                Select a Tool
              </h3>
              <p className="text-gray-400">
                Choose a forensics tool from the sidebar to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
