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
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

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
      name: "Encoder/Decoder",
      description: "Base64, Hex, ROT13, URL, ASCII encoding/decoding",
      icon: Code,
      category: "Encoding",
    },
    {
      id: "whois",
      name: "WHOIS Lookup",
      description: "Domain and IP address information",
      icon: Globe,
      category: "Network",
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
    {
      id: "password-strength",
      name: "Password Strength Analyzer",
      description: "Analyze password strength and get security recommendations",
      icon: Code,
      category: "Security",
    },
    {
      id: "jwt-decoder",
      name: "JWT Decoder",
      description: "Decode and inspect JWT tokens",
      icon: Code,
      category: "Cryptography",
    },
    {
      id: "regex-tester",
      name: "Regex Tester",
      description: "Test and validate regular expressions",
      icon: Search,
      category: "Utilities",
    },
    {
      id: "dns-lookup",
      name: "DNS Lookup",
      description: "Resolve domain names and check DNS records",
      icon: Globe,
      category: "Network",
    },
    {
      id: "encryption",
      name: "Encryption/Decryption",
      description: "AES encryption and decryption with key management",
      icon: Code,
      category: "Cryptography",
    },
    {
      id: "subdomain-scan",
      name: "Subdomain Scanner",
      description: "Find subdomains associated with a domain",
      icon: Globe,
      category: "Network",
    },
    {
      id: "json-formatter",
      name: "JSON/XML Formatter",
      description: "Format, validate, and minify JSON/XML",
      icon: Code,
      category: "Utilities",
    },
    {
      id: "qr-generator",
      name: "QR Code Generator",
      description: "Generate QR codes from text or URLs",
      icon: Code,
      category: "Utilities",
    },
    {
      id: "subnet-calc",
      name: "Subnet Calculator",
      description: "Calculate network subnets and CIDR ranges",
      icon: Binary,
      category: "Network",
    },
    {
      id: "ip-geo",
      name: "IP Geolocation",
      description: "Locate IP addresses and get geographical data",
      icon: Globe,
      category: "Network",
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

  // Encoding helper functions
  const encodeRot13 = (text: string) => {
    return text.replace(/[a-zA-Z]/g, (c) => {
      const start = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(start + ((c.charCodeAt(0) - start + 13) % 26));
    });
  };

  const decodeRot13 = (text: string) => encodeRot13(text);

  const encodeHex = (text: string) => {
    return Array.from(text)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  };

  const decodeHex = (text: string) => {
    try {
      return text.match(/.{1,2}/g)?.map((hex) => String.fromCharCode(parseInt(hex, 16))).join('') || '';
    } catch {
      throw new Error('Invalid hex string');
    }
  };

  const encodeUrl = (text: string) => encodeURIComponent(text);

  const decodeUrl = (text: string) => decodeURIComponent(text);

  const encodeAscii = (text: string) => {
    return text.split('').map((c) => c.charCodeAt(0)).join(' ');
  };

  const decodeAscii = (text: string) => {
    try {
      return text.split(' ').map((code) => String.fromCharCode(parseInt(code, 10))).join('');
    } catch {
      throw new Error('Invalid ASCII string');
    }
  };

  const executeEncoding = (type: string, text: string, isEncode: boolean) => {
    switch (type) {
      case 'base64':
        return isEncode ? btoa(text) : atob(text);
      case 'rot13':
        return encodeRot13(text);
      case 'hex':
        return isEncode ? encodeHex(text) : decodeHex(text);
      case 'url':
        return isEncode ? encodeUrl(text) : decodeUrl(text);
      case 'ascii':
        return isEncode ? encodeAscii(text) : decodeAscii(text);
      default:
        throw new Error('Unknown encoding type');
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const executeTool = async (toolId: string) => {
    const input = toolInputs[toolId] || {};
    let output: any = {};

    setLoading((prev) => ({ ...prev, [toolId]: true }));

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
          const mode = input.mode || "encode";
          const format = input.format || "base64";
          if (!input.text) {
            output.error = "Please enter text to encode or decode";
          } else {
            try {
              output.result = executeEncoding(format, input.text, mode === "encode");
              output.format = format;
              output.mode = mode;
            } catch (error) {
              output.error = error instanceof Error ? error.message : "Encoding/Decoding failed";
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
          if (input.domain) {
            try {
              const response = await fetch('/api/tools/whois', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: input.domain }),
              });
              const data = await response.json();
              
              if (data.success) {
                output = data.data;
                output.raw = data.raw;
                output.isMock = data.isMock;
              } else {
                output.error = data.message || 'WHOIS lookup failed';
              }
            } catch (error) {
              output.error = 'Failed to perform WHOIS lookup';
            }
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

        case "password-strength":
          if (!input.password) {
            output.error = "Please enter a password";
          } else {
            const pwd = input.password;
            let strength = 0;
            const feedback: string[] = [];
            
            if (pwd.length >= 8) strength += 1;
            if (pwd.length >= 12) strength += 1;
            if (pwd.length >= 16) strength += 1;
            if (/[a-z]/.test(pwd)) strength += 1;
            if (/[A-Z]/.test(pwd)) strength += 1;
            if (/[0-9]/.test(pwd)) strength += 1;
            if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength += 2;
            
            if (pwd.length < 8) feedback.push("Use at least 8 characters");
            if (!/[A-Z]/.test(pwd)) feedback.push("Add uppercase letters");
            if (!/[0-9]/.test(pwd)) feedback.push("Add numbers");
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) feedback.push("Add special characters");
            
            const strengthLevel = strength > 7 ? "Very Strong 💪" : strength > 5 ? "Strong ✅" : strength > 3 ? "Moderate ⚠️" : "Weak ❌";
            
            output.result = `Strength: ${strengthLevel}\nScore: ${strength}/10\nFeedback:\n${feedback.join('\n') || 'Password looks good!'}`;
          }
          break;

        case "jwt-decoder":
          if (!input.token) {
            output.error = "Please enter a JWT token";
          } else {
            try {
              const parts = input.token.split('.');
              if (parts.length !== 3) {
                output.error = "Invalid JWT format (must have 3 parts separated by dots)";
              } else {
                const header = JSON.parse(atob(parts[0]));
                const payload = JSON.parse(atob(parts[1]));
                output.result = `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}`;
              }
            } catch {
              output.error = "Invalid JWT token or format";
            }
          }
          break;

        case "regex-tester":
          if (!input.pattern || !input.testString) {
            output.error = "Please enter a regex pattern and test string";
          } else {
            try {
              const regex = new RegExp(input.pattern, input.flags || 'g');
              const matches = input.testString.match(regex);
              output.result = matches ? `Matches found: ${matches.length}\n\nMatches:\n${matches.join('\n')}` : "No matches found";
            } catch (error) {
              output.error = error instanceof Error ? error.message : "Invalid regex pattern";
            }
          }
          break;

        case "dns-lookup":
          if (!input.domain) {
            output.error = "Please enter a domain name";
          } else {
            output.result = "DNS Lookup feature coming soon! (Premium Feature)\nIntegration with DNS services in development.";
          }
          break;

        case "encryption":
          output.error = "Encryption tool feature coming soon! (Premium Feature)\nAES-256 encryption/decryption in development.";
          break;

        case "subdomain-scan":
          if (!input.domain) {
            output.error = "Please enter a domain name";
          } else {
            output.result = "Subdomain Scanner feature coming soon! (Premium Feature)\nSubdomain enumeration in development.";
          }
          break;

        case "json-formatter":
          if (!input.text) {
            output.error = "Please enter JSON or XML to format";
          } else {
            try {
              const trimmed = input.text.trim();
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                const parsed = JSON.parse(trimmed);
                if (input.mode === 'minify') {
                  output.result = JSON.stringify(parsed);
                } else {
                  output.result = JSON.stringify(parsed, null, 2);
                }
                output.type = 'json';
              } else if (trimmed.startsWith('<')) {
                output.result = trimmed.replace(/>\s*</g, '>\n<');
                output.type = 'xml';
              } else {
                output.error = "Invalid JSON or XML format";
              }
            } catch (error) {
              output.error = `Parse error: ${error instanceof Error ? error.message : 'Invalid format'}`;
            }
          }
          break;

        case "qr-generator":
          if (!input.text) {
            output.error = "Please enter text to generate QR code";
          } else {
            output.qrData = input.text;
            output.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(input.text)}`;
            output.result = "QR Code generated successfully";
          }
          break;

        case "subnet-calc":
          if (!input.ip) {
            output.error = "Please enter an IP address with CIDR notation (e.g., 192.168.1.0/24)";
          } else {
            try {
              const [ip, cidr] = input.ip.split('/');
              const cidrNum = parseInt(cidr);
              if (!cidr || cidrNum < 0 || cidrNum > 32) {
                output.error = "Invalid CIDR notation. Use format: IP/CIDR (e.g., 192.168.1.0/24)";
              } else {
                const ipParts = ip.split('.').map(Number);
                const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
                const mask = -1 << (32 - cidrNum);
                const networkInt = ipInt & mask;
                const broadcastInt = networkInt | ~mask;
                const hostMin = networkInt + 1;
                const hostMax = broadcastInt - 1;
                const totalHosts = Math.pow(2, 32 - cidrNum) - 2;

                const intToIp = (int: number) => [
                  (int >>> 24) & 0xff,
                  (int >>> 16) & 0xff,
                  (int >>> 8) & 0xff,
                  int & 0xff
                ].join('.');

                output.network = intToIp(networkInt);
                output.broadcast = intToIp(broadcastInt);
                output.hostMin = intToIp(hostMin);
                output.hostMax = intToIp(hostMax);
                output.subnetMask = intToIp(mask);
                output.totalHosts = totalHosts > 0 ? totalHosts : 0;
                output.cidr = cidrNum;
              }
            } catch {
              output.error = "Invalid IP address format";
            }
          }
          break;

        case "ip-geo":
          if (!input.ip) {
            output.error = "Please enter an IP address";
          } else {
            const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipRegex.test(input.ip)) {
              output.error = "Invalid IP address format";
            } else {
              try {
                const response = await fetch(`https://ipapi.co/${input.ip}/json/`);
                const data = await response.json();
                output.ip = input.ip;
                output.country = data.country_name || 'Unknown';
                output.region = data.region || 'Unknown';
                output.city = data.city || 'Unknown';
                output.latitude = data.latitude || 'N/A';
                output.longitude = data.longitude || 'N/A';
                output.timezone = data.timezone || 'Unknown';
                output.isp = data.isp || 'Unknown';
                output.organization = data.org || 'Unknown';
                output.asn = data.asn || 'Unknown';
                output.mock = false;
              } catch (error) {
                output.error = `IP lookup failed. ${error instanceof Error ? error.message : ''}`;
              }
            }
          }
          break;

        default:
          output.error = "Tool not implemented";
      }
    } catch (error) {
      output.error =
        error instanceof Error ? error.message : "An error occurred";
    } finally {
      setLoading((prev) => ({ ...prev, [toolId]: false }));
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
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Calculate Hashes</span>
                </>
              )}
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
            <div className="grid grid-cols-2 gap-4">
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
                  Format
                </label>
                <select
                  value={input.format || "base64"}
                  onChange={(e) =>
                    handleInputChange(tool.id, "format", e.target.value)
                  }
                  className="cyber-input w-full"
                >
                  <option value="base64">Base64</option>
                  <option value="hex">Hexadecimal</option>
                  <option value="rot13">ROT13 (Obfuscation)</option>
                  <option value="url">URL Encoding</option>
                  <option value="ascii">ASCII Values</option>
                </select>
              </div>
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
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>{input.mode === "decode" ? "Decode" : "Encode"}</span>
                </>
              )}
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
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Convert</span>
                </>
              )}
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

      case "whois":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Domain or IP Address
              </label>
              <input
                type="text"
                value={input.domain || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "domain", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="example.com or 8.8.8.8"
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyber-blue" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Lookup</span>
                </>
              )}
            </button>
            {output.error && (
              <div className="cyber-panel border-cyber-red">
                <p className="text-cyber-red">{output.error}</p>
              </div>
            )}
            {output.domain && (
              <div className="space-y-4">
                {output.isMock && (
                  <div className="cyber-panel bg-yellow-500 bg-opacity-10 border-yellow-500">
                    <p className="text-yellow-500 text-sm">
                      ⚠️ Using demo data. Install 'whois' package for real lookups.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="cyber-panel">
                    <h3 className="text-cyber-blue font-medium mb-2">Domain Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Domain:</span>
                        <span className="text-cyber-green ml-2">{output.domain}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Registrar:</span>
                        <span className="text-white ml-2">{output.registrar || 'N/A'}</span>
                      </div>
                      {output.dnssec && (
                        <div>
                          <span className="text-gray-400">DNSSEC:</span>
                          <span className="text-white ml-2">{output.dnssec}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="cyber-panel">
                    <h3 className="text-cyber-blue font-medium mb-2">Important Dates</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white ml-2">{output.created || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Updated:</span>
                        <span className="text-white ml-2">{output.updated || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Expires:</span>
                        <span className="text-cyber-red ml-2">{output.expires || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {output.status && output.status.length > 0 && (
                  <div className="cyber-panel">
                    <h3 className="text-cyber-blue font-medium mb-2">Domain Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {output.status.map((status: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-cyber-border text-cyber-green text-xs rounded"
                        >
                          {status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {output.nameservers && output.nameservers.length > 0 && (
                  <div className="cyber-panel">
                    <h3 className="text-cyber-blue font-medium mb-2">Name Servers</h3>
                    <div className="space-y-1">
                      {output.nameservers.map((ns: string, idx: number) => (
                        <div key={idx} className="text-sm text-cyber-green font-mono">
                          {ns}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {output.raw && (
                  <div className="cyber-panel">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-cyber-blue font-medium">Raw WHOIS Data</h3>
                      <button
                        onClick={() => copyToClipboard(output.raw, 'whois-raw')}
                        className="text-gray-400 hover:text-cyber-blue"
                      >
                        {copied === 'whois-raw' ? (
                          <CheckCircle className="h-4 w-4 text-cyber-green" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <pre className="text-xs text-gray-300 overflow-auto max-h-64 bg-black bg-opacity-50 p-3 rounded">
                      {output.raw}
                    </pre>
                  </div>
                )}
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

      case "password-strength":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Password
              </label>
              <input
                type="password"
                value={input.password || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "password", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="Enter password to analyze..."
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Analyze Strength</span>
                </>
              )}
            </button>
            {output.result && (
              <div className="cyber-panel">
                <h3 className="text-cyber-blue font-medium mb-3">Strength Analysis</h3>
                <pre className="text-sm text-cyber-green whitespace-pre-wrap font-mono">{output.result}</pre>
              </div>
            )}
            {output.error && (
              <div className="cyber-panel border-cyber-red">
                <p className="text-cyber-red text-sm">{output.error}</p>
              </div>
            )}
          </div>
        );

      case "jwt-decoder":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                JWT Token
              </label>
              <textarea
                value={input.token || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "token", e.target.value)
                }
                className="cyber-input w-full h-24 resize-none"
                placeholder="Paste JWT token here..."
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Decoding...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Decode JWT</span>
                </>
              )}
            </button>
            {output.result && (
              <div className="cyber-panel">
                <h3 className="text-cyber-blue font-medium mb-3">Decoded JWT</h3>
                <pre className="text-xs text-cyber-green whitespace-pre-wrap font-mono">{output.result}</pre>
              </div>
            )}
            {output.error && (
              <div className="cyber-panel border-cyber-red">
                <p className="text-cyber-red text-sm">{output.error}</p>
              </div>
            )}
          </div>
        );

      case "regex-tester":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Regular Expression
              </label>
              <input
                type="text"
                value={input.pattern || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "pattern", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="/pattern/ (without slashes)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Flags (g, i, m, s, etc.)
              </label>
              <input
                type="text"
                value={input.flags || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "flags", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="e.g., gi for global and case-insensitive"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Test String
              </label>
              <textarea
                value={input.testString || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "testString", e.target.value)
                }
                className="cyber-input w-full h-32 resize-none"
                placeholder="Enter text to test..."
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Test Regex</span>
                </>
              )}
            </button>
            {output.result && (
              <div className="cyber-panel">
                <h3 className="text-cyber-blue font-medium mb-3">Results</h3>
                <pre className="text-sm text-cyber-green whitespace-pre-wrap font-mono">{output.result}</pre>
              </div>
            )}
            {output.error && (
              <div className="cyber-panel border-cyber-red">
                <p className="text-cyber-red text-sm">{output.error}</p>
              </div>
            )}
          </div>
        );

      case "dns-lookup":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Domain Name
              </label>
              <input
                type="text"
                value={input.domain || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "domain", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="example.com"
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Lookup DNS</span>
                </>
              )}
            </button>
            <div className="cyber-panel bg-cyan-500 bg-opacity-10 border-cyan-500">
              <p className="text-cyan-400">🚀 {output.result || 'DNS Lookup feature - Premium Feature'}</p>
            </div>
          </div>
        );

      case "encryption":
        return (
          <div className="cyber-panel bg-cyan-500 bg-opacity-10 border-cyan-500">
            <h3 className="text-cyan-400 font-bold mb-2">🔐 Encryption Tool</h3>
            <p className="text-cyan-400">AES-256 encryption/decryption feature coming soon!</p>
            <p className="text-gray-400 text-sm mt-2">Premium Feature - Upgrade your account to use this tool</p>
          </div>
        );

      case "subdomain-scan":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Domain Name
              </label>
              <input
                type="text"
                value={input.domain || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "domain", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="example.com"
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Scan Subdomains</span>
                </>
              )}
            </button>
            <div className="cyber-panel bg-cyan-500 bg-opacity-10 border-cyan-500">
              <p className="text-cyan-400">🔍 Subdomain Scanner - Premium Feature</p>
              <p className="text-gray-400 text-sm mt-2">Discover subdomains associated with your target domain</p>
            </div>
          </div>
        );

      case "json-formatter":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Format Mode
              </label>
              <select
                value={input.mode || "prettify"}
                onChange={(e) =>
                  handleInputChange(tool.id, "mode", e.target.value)
                }
                className="cyber-input w-full"
              >
                <option value="prettify">Prettify</option>
                <option value="minify">Minify</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Input (JSON/XML)
              </label>
              <textarea
                value={input.text || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "text", e.target.value)
                }
                className="cyber-input w-full h-48 resize-none font-mono text-sm"
                placeholder='{"name": "value"} or <xml>content</xml>'
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Formatting...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Format</span>
                </>
              )}
            </button>
            {output.result && (
              <div className="cyber-panel">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyber-blue font-medium">Formatted {output.type?.toUpperCase()}</span>
                  <button
                    onClick={() => copyToClipboard(output.result, `${tool.id}-result`)}
                    className="text-gray-400 hover:text-cyber-blue"
                  >
                    {copied === `${tool.id}-result` ? (
                      <CheckCircle className="h-4 w-4 text-cyber-green" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <pre className="text-xs text-cyber-green whitespace-pre-wrap font-mono overflow-x-auto max-h-96">{output.result}</pre>
              </div>
            )}
            {output.error && (
              <div className="cyber-panel border-cyber-red">
                <p className="text-cyber-red text-sm">{output.error}</p>
              </div>
            )}
          </div>
        );

      case "qr-generator":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                Text or URL
              </label>
              <textarea
                value={input.text || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "text", e.target.value)
                }
                className="cyber-input w-full h-24 resize-none"
                placeholder="Enter text or URL to encode in QR code..."
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Generate QR Code</span>
                </>
              )}
            </button>
            {output.qrUrl && (
              <div className="cyber-panel">
                <h3 className="text-cyber-blue font-medium mb-3">Generated QR Code</h3>
                <div className="flex flex-col items-center space-y-4">
                  <img src={output.qrUrl} alt="QR Code" className="border-2 border-cyber-border rounded" />
                  <p className="text-cyber-green text-sm">{output.qrData}</p>
                  <a
                    href={output.qrUrl}
                    download="qr-code.png"
                    className="cyber-button flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download QR Code</span>
                  </a>
                </div>
              </div>
            )}
            {output.error && (
              <div className="cyber-panel border-cyber-red">
                <p className="text-cyber-red text-sm">{output.error}</p>
              </div>
            )}
          </div>
        );

      case "subnet-calc":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                IP Address with CIDR
              </label>
              <input
                type="text"
                value={input.ip || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "ip", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="192.168.1.0/24"
              />
              <p className="text-gray-400 text-xs mt-1">Format: IP/CIDR (e.g., 192.168.1.0/24)</p>
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Calculate Subnet</span>
                </>
              )}
            </button>
            {output.network && (
              <div className="cyber-panel">
                <h3 className="text-cyber-blue font-medium mb-3">Subnet Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Network Address:</span>
                    <p className="text-cyber-green font-mono">{output.network}/{output.cidr}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Subnet Mask:</span>
                    <p className="text-white font-mono">{output.subnetMask}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">First Host:</span>
                    <p className="text-white font-mono">{output.hostMin}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Host:</span>
                    <p className="text-white font-mono">{output.hostMax}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Broadcast Address:</span>
                    <p className="text-white font-mono">{output.broadcast}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Hosts:</span>
                    <p className="text-cyber-green font-bold">{output.totalHosts}</p>
                  </div>
                </div>
              </div>
            )}
            {output.error && (
              <div className="cyber-panel border-cyber-red">
                <p className="text-cyber-red text-sm">{output.error}</p>
              </div>
            )}
          </div>
        );

      case "ip-geo":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-blue mb-2">
                IP Address
              </label>
              <input
                type="text"
                value={input.ip || ""}
                onChange={(e) =>
                  handleInputChange(tool.id, "ip", e.target.value)
                }
                className="cyber-input w-full"
                placeholder="8.8.8.8"
              />
            </div>
            <button
              onClick={() => executeTool(tool.id)}
              disabled={loading[tool.id]}
              className="cyber-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading[tool.id] ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-cyber-blue border-t-transparent rounded-full"></div>
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Locate IP</span>
                </>
              )}
            </button>
            {output.ip && (
              <div className="space-y-4">
                {output.mock && (
                  <div className="cyber-panel bg-yellow-500 bg-opacity-10 border-yellow-500">
                    <p className="text-yellow-500 text-sm">
                      ⚠️ Using demo data. Real IP geolocation requires API integration.
                    </p>
                  </div>
                )}
                <div className="cyber-panel">
                  <h3 className="text-cyber-blue font-medium mb-3">Location Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">IP Address:</span>
                      <p className="text-cyber-green font-mono">{output.ip}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Country:</span>
                      <p className="text-white">{output.country}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Region:</span>
                      <p className="text-white">{output.region}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">City:</span>
                      <p className="text-white">{output.city}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Coordinates:</span>
                      <p className="text-white font-mono">{output.latitude}, {output.longitude}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Timezone:</span>
                      <p className="text-white">{output.timezone}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">ISP:</span>
                      <p className="text-white">{output.isp}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Organization:</span>
                      <p className="text-white">{output.organization}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">ASN:</span>
                      <p className="text-white font-mono">{output.asn}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {output.error && (
              <div className="cyber-panel border-cyber-red">
                <p className="text-cyber-red text-sm">{output.error}</p>
              </div>
            )}
          </div>
        );

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
