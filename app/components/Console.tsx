"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Play,
  Square,
  RotateCw,
  Download,
  Upload,
  Trash2,
  Save,
  Settings,
  History,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface ConsoleProps {
  user: any;
}

interface CommandHistory {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  status: "success" | "error" | "warning";
  duration: number;
}

interface Tool {
  name: string;
  description: string;
  usage: string;
  category:
    | "network"
    | "crypto"
    | "file"
    | "system"
    | "analysis"
    | "packages"
    | "pentest";
}

interface FileSystemEntry {
  name: string;
  type: "file" | "directory";
  size?: number;
  permissions: string;
  owner: string;
  modified: Date;
  content?: string;
}

interface FileSystem {
  [path: string]: FileSystemEntry[];
}

export default function Console({ user }: ConsoleProps) {
  const [currentCommand, setCurrentCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState("/home/cybersec");
  const [installedPackages, setInstalledPackages] = useState<string[]>([
    "nmap",
    "nikto",
    "sqlmap",
    "metasploit",
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulated file system
  const [fileSystem, setFileSystem] = useState<FileSystem>({
    "/": [
      {
        name: "home",
        type: "directory",
        permissions: "drwxr-xr-x",
        owner: "root",
        modified: new Date(),
      },
      {
        name: "etc",
        type: "directory",
        permissions: "drwxr-xr-x",
        owner: "root",
        modified: new Date(),
      },
      {
        name: "var",
        type: "directory",
        permissions: "drwxr-xr-x",
        owner: "root",
        modified: new Date(),
      },
      {
        name: "tmp",
        type: "directory",
        permissions: "drwxrwxrwx",
        owner: "root",
        modified: new Date(),
      },
    ],
    "/home": [
      {
        name: "cybersec",
        type: "directory",
        permissions: "drwxr-xr-x",
        owner: "cybersec",
        modified: new Date(),
      },
    ],
    "/home/cybersec": [
      {
        name: "evidence",
        type: "directory",
        permissions: "drwxr-xr-x",
        owner: "cybersec",
        modified: new Date(),
      },
      {
        name: "reports",
        type: "directory",
        permissions: "drwxr-xr-x",
        owner: "cybersec",
        modified: new Date(),
      },
      {
        name: "tools",
        type: "directory",
        permissions: "drwxr-xr-x",
        owner: "cybersec",
        modified: new Date(),
      },
      {
        name: "logs",
        type: "directory",
        permissions: "drwxr-xr-x",
        owner: "cybersec",
        modified: new Date(),
      },
      {
        name: "notes.txt",
        type: "file",
        size: 1024,
        permissions: "-rw-r--r--",
        owner: "cybersec",
        modified: new Date(),
        content:
          "Investigation notes:\n1. Suspicious network activity detected\n2. Need to analyze malware sample\n3. Check logs for IOCs",
      },
    ],
    "/home/cybersec/evidence": [
      {
        name: "malware.bin",
        type: "file",
        size: 2048576,
        permissions: "-r--r--r--",
        owner: "cybersec",
        modified: new Date(),
      },
      {
        name: "network_capture.pcap",
        type: "file",
        size: 5242880,
        permissions: "-rw-r--r--",
        owner: "cybersec",
        modified: new Date(),
      },
    ],
    "/home/cybersec/tools": [
      {
        name: "custom_scanner.py",
        type: "file",
        size: 4096,
        permissions: "-rwxr-xr-x",
        owner: "cybersec",
        modified: new Date(),
        content:
          "#!/usr/bin/env python3\n# Custom vulnerability scanner\nimport socket\nprint('Custom scanner v1.0')",
      },
    ],
  });

  // Available tools and commands
  const tools: Tool[] = [
    // Network tools
    {
      name: "nslookup",
      description: "DNS lookup utility",
      usage: "nslookup <domain>",
      category: "network",
    },
    {
      name: "ping",
      description: "Network connectivity test",
      usage: "ping <host>",
      category: "network",
    },
    {
      name: "whois",
      description: "Domain registration info",
      usage: "whois <domain>",
      category: "network",
    },
    {
      name: "nmap",
      description: "Network port scanner",
      usage: "nmap [options] <target>",
      category: "network",
    },
    {
      name: "netstat",
      description: "Display network connections",
      usage: "netstat [options]",
      category: "network",
    },
    {
      name: "traceroute",
      description: "Trace network path",
      usage: "traceroute <host>",
      category: "network",
    },
    {
      name: "dig",
      description: "DNS lookup tool",
      usage: "dig <domain> [type]",
      category: "network",
    },
    {
      name: "curl",
      description: "Transfer data from servers",
      usage: "curl [options] <url>",
      category: "network",
    },
    {
      name: "wget",
      description: "Download files from web",
      usage: "wget [options] <url>",
      category: "network",
    },

    // Penetration testing tools
    {
      name: "nikto",
      description: "Web vulnerability scanner",
      usage: "nikto -h <target>",
      category: "pentest",
    },
    {
      name: "sqlmap",
      description: "SQL injection testing tool",
      usage: "sqlmap -u <url>",
      category: "pentest",
    },
    {
      name: "hydra",
      description: "Password cracking tool",
      usage: "hydra [options] <target>",
      category: "pentest",
    },
    {
      name: "john",
      description: "Password hash cracker",
      usage: "john [options] <hashfile>",
      category: "pentest",
    },
    {
      name: "aircrack-ng",
      description: "WiFi security testing",
      usage: "aircrack-ng [options] <capture>",
      category: "pentest",
    },
    {
      name: "metasploit",
      description: "Penetration testing framework",
      usage: "msfconsole",
      category: "pentest",
    },
    {
      name: "gobuster",
      description: "Directory/file brute-forcer",
      usage: "gobuster dir -u <url> -w <wordlist>",
      category: "pentest",
    },

    // Crypto tools
    {
      name: "hash",
      description: "Generate file hashes",
      usage: "hash <algorithm> <text>",
      category: "crypto",
    },
    {
      name: "base64",
      description: "Base64 encode/decode",
      usage: "base64 <encode|decode> <text>",
      category: "crypto",
    },
    {
      name: "openssl",
      description: "Cryptography toolkit",
      usage: "openssl <command> [options]",
      category: "crypto",
    },

    // File tools
    {
      name: "hexdump",
      description: "Hexadecimal dump of data",
      usage: "hexdump <file>",
      category: "file",
    },
    {
      name: "strings",
      description: "Extract strings from files",
      usage: "strings <file>",
      category: "file",
    },
    {
      name: "file",
      description: "Determine file type",
      usage: "file <filename>",
      category: "file",
    },
    {
      name: "grep",
      description: "Search text patterns",
      usage: "grep [options] <pattern> <file>",
      category: "file",
    },
    {
      name: "find",
      description: "Find files and directories",
      usage: "find <path> [options]",
      category: "file",
    },
    {
      name: "chmod",
      description: "Change file permissions",
      usage: "chmod <permissions> <file>",
      category: "file",
    },
    {
      name: "chown",
      description: "Change file ownership",
      usage: "chown <owner> <file>",
      category: "file",
    },
    {
      name: "tar",
      description: "Archive files",
      usage: "tar [options] <archive> <files>",
      category: "file",
    },

    // Analysis tools
    {
      name: "analyze",
      description: "Analyze suspicious content",
      usage: "analyze <type> <data>",
      category: "analysis",
    },
    {
      name: "scan",
      description: "Security scan",
      usage: "scan <target>",
      category: "analysis",
    },
    {
      name: "decode",
      description: "Decode various formats",
      usage: "decode <format> <data>",
      category: "analysis",
    },
    {
      name: "yara",
      description: "Malware identification",
      usage: "yara <rules> <target>",
      category: "analysis",
    },
    {
      name: "volatility",
      description: "Memory forensics",
      usage: "volatility [options] <command>",
      category: "analysis",
    },

    // Package management
    {
      name: "pkg",
      description: "Package manager",
      usage: "pkg <install|remove|list|update> [package]",
      category: "packages",
    },
    {
      name: "apt",
      description: "Advanced package tool",
      usage: "apt <install|remove|update> [package]",
      category: "packages",
    },
  ];

  const systemCommands = [
    "help",
    "clear",
    "history",
    "whoami",
    "pwd",
    "ls",
    "cd",
    "cat",
    "echo",
    "date",
    "uptime",
    "ps",
    "top",
    "kill",
    "mkdir",
    "rmdir",
    "rm",
    "cp",
    "mv",
    "touch",
    "nano",
    "vim",
    "which",
    "whereis",
    "man",
    "info",
    "alias",
    "unalias",
    "export",
    "env",
    "printenv",
    "mount",
    "umount",
    "df",
    "du",
    "free",
    "uname",
    "hostname",
    "id",
    "groups",
    "su",
    "sudo",
  ];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    setIsExecuting(true);
    const startTime = Date.now();

    const newEntry: CommandHistory = {
      id: Math.random().toString(36).substr(2, 9),
      command,
      output: "",
      timestamp: new Date(),
      status: "success",
      duration: 0,
    };

    // Add command to history immediately
    setCommandHistory((prev) => [...prev, newEntry]);
    setCurrentCommand("");
    setHistoryIndex(-1);

    // Simulate command execution
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 1000 + 500),
    );

    const parts = command.trim().split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output = "";
    let status: "success" | "error" | "warning" = "success";

    try {
      switch (cmd) {
        case "help":
          if (args.length === 0) {
            output = `Available commands:
${systemCommands.map((c) => `  ${c}`).join("\n")}

Available tools:
${tools.map((t) => `  ${t.name} - ${t.description}`).join("\n")}

Type 'help <command>' for detailed usage.`;
          } else {
            const tool = tools.find((t) => t.name === args[0]);
            if (tool) {
              output = `${tool.name} - ${tool.description}
Usage: ${tool.usage}
Category: ${tool.category}`;
            } else {
              output = `No help available for '${args[0]}'`;
              status = "error";
            }
          }
          break;

        case "clear":
          setCommandHistory([]);
          setIsExecuting(false);
          return;

        case "history":
          output = commandHistory
            .map((h, i) => `${i + 1}  ${h.command}`)
            .join("\n");
          break;

        case "whoami":
          output = `User: ${user?.username || "anonymous"}
Role: ${user?.role || "guest"}
Department: ${user?.department || "unknown"}
Clearance Level: ${user?.role === "admin" ? "TOP SECRET" : user?.role === "enterprise" ? "SECRET" : "CONFIDENTIAL"}`;
          break;

        case "pwd":
          output = currentDirectory;
          break;

        case "ls":
          const entries = fileSystem[currentDirectory] || [];
          if (entries.length === 0) {
            output = "Directory is empty";
          } else {
            output = entries
              .map((entry) => {
                const permissions = entry.permissions;
                const size = entry.size
                  ? entry.size.toString().padStart(8)
                  : "     DIR";
                const date = entry.modified.toLocaleDateString();
                const name =
                  entry.type === "directory" ? `${entry.name}/` : entry.name;
                return `${permissions} ${entry.owner} ${size} ${date} ${name}`;
              })
              .join("\n");
          }
          break;

        case "cd":
          if (args.length === 0) {
            setCurrentDirectory("/home/cybersec");
            output = "Changed to home directory";
          } else {
            let targetPath = args[0];
            if (!targetPath.startsWith("/")) {
              targetPath =
                currentDirectory === "/"
                  ? `/${targetPath}`
                  : `${currentDirectory}/${targetPath}`;
            }

            // Normalize path
            targetPath =
              targetPath.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

            if (fileSystem[targetPath]) {
              setCurrentDirectory(targetPath);
              output = `Changed directory to ${targetPath}`;
            } else {
              output = `cd: no such file or directory: ${args[0]}`;
              status = "error";
            }
          }
          break;

        case "cat":
          if (!args[0]) {
            output = "Usage: cat <filename>";
            status = "error";
          } else {
            const entries = fileSystem[currentDirectory] || [];
            const file = entries.find(
              (e) => e.name === args[0] && e.type === "file",
            );
            if (file && file.content) {
              output = file.content;
            } else if (file) {
              output = "[Binary file - content not displayable]";
            } else {
              output = `cat: ${args[0]}: No such file or directory`;
              status = "error";
            }
          }
          break;

        case "mkdir":
          if (!args[0]) {
            output = "Usage: mkdir <directory>";
            status = "error";
          } else {
            const entries = fileSystem[currentDirectory] || [];
            if (entries.find((e) => e.name === args[0])) {
              output = `mkdir: cannot create directory '${args[0]}': File exists`;
              status = "error";
            } else {
              const newEntry: FileSystemEntry = {
                name: args[0],
                type: "directory",
                permissions: "drwxr-xr-x",
                owner: "cybersec",
                modified: new Date(),
              };
              const newPath =
                currentDirectory === "/"
                  ? `/${args[0]}`
                  : `${currentDirectory}/${args[0]}`;
              setFileSystem((prev) => ({
                ...prev,
                [currentDirectory]: [...entries, newEntry],
                [newPath]: [],
              }));
              output = `Directory '${args[0]}' created`;
            }
          }
          break;

        case "touch":
          if (!args[0]) {
            output = "Usage: touch <filename>";
            status = "error";
          } else {
            const entries = fileSystem[currentDirectory] || [];
            const existingFile = entries.find((e) => e.name === args[0]);
            if (existingFile) {
              existingFile.modified = new Date();
              output = `Updated timestamp for '${args[0]}'`;
            } else {
              const newEntry: FileSystemEntry = {
                name: args[0],
                type: "file",
                size: 0,
                permissions: "-rw-r--r--",
                owner: "cybersec",
                modified: new Date(),
                content: "",
              };
              setFileSystem((prev) => ({
                ...prev,
                [currentDirectory]: [...entries, newEntry],
              }));
              output = `Created file '${args[0]}'`;
            }
          }
          break;

        case "date":
          output = new Date().toLocaleString();
          break;

        case "uptime":
          output = `System uptime: 15 days, 7 hours, 23 minutes
Load average: 0.45, 0.52, 0.48`;
          break;

        case "nslookup":
          if (!args[0]) {
            output = "Usage: nslookup <domain>";
            status = "error";
          } else {
            output = `Server: 8.8.8.8
Address: 8.8.8.8#53

Non-authoritative answer:
Name: ${args[0]}
Address: ${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
          }
          break;

        case "ping":
          if (!args[0]) {
            output = "Usage: ping <host>";
            status = "error";
          } else {
            const latency = Math.floor(Math.random() * 100) + 10;
            output = `PING ${args[0]} (${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}) 56(84) bytes of data.
64 bytes from ${args[0]}: icmp_seq=1 ttl=64 time=${latency}ms
64 bytes from ${args[0]}: icmp_seq=2 ttl=64 time=${latency + Math.floor(Math.random() * 10)}ms
64 bytes from ${args[0]}: icmp_seq=3 ttl=64 time=${latency + Math.floor(Math.random() * 10)}ms

--- ${args[0]} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss
rtt min/avg/max/mdev = ${latency}/${latency + 5}/${latency + 10}/2.5 ms`;
          }
          break;

        case "whois":
          if (!args[0]) {
            output = "Usage: whois <domain>";
            status = "error";
          } else {
            output = `Domain Name: ${args[0].toUpperCase()}
Registry Domain ID: ${Math.random().toString(36).substr(2, 16).toUpperCase()}
Registrar WHOIS Server: whois.registrar.com
Registrar URL: http://www.registrar.com
Updated Date: 2024-01-15T10:30:00Z
Creation Date: 2020-03-20T14:15:00Z
Registry Expiry Date: 2025-03-20T14:15:00Z
Registrar: Example Registrar LLC
Registrar IANA ID: 1234
Registrar Abuse Contact Email: abuse@registrar.com
Registrar Abuse Contact Phone: +1.2345678900
Domain Status: clientTransferProhibited
Name Server: NS1.EXAMPLE.COM
Name Server: NS2.EXAMPLE.COM
DNSSEC: unsigned`;
          }
          break;

        case "hash":
          if (args.length < 2) {
            output =
              "Usage: hash <algorithm> <text>\nSupported algorithms: md5, sha1, sha256, sha512";
            status = "error";
          } else {
            const algorithm = args[0].toLowerCase();
            const text = args.slice(1).join(" ");
            const algorithms = ["md5", "sha1", "sha256", "sha512"];

            if (!algorithms.includes(algorithm)) {
              output = `Unsupported algorithm: ${algorithm}\nSupported: ${algorithms.join(", ")}`;
              status = "error";
            } else {
              // Generate mock hash
              const hashLength =
                algorithm === "md5"
                  ? 32
                  : algorithm === "sha1"
                    ? 40
                    : algorithm === "sha256"
                      ? 64
                      : 128;
              const hash = Array.from({ length: hashLength }, () =>
                Math.floor(Math.random() * 16).toString(16),
              ).join("");
              output = `${algorithm.toUpperCase()}: ${hash}`;
            }
          }
          break;

        case "base64":
          if (args.length < 2) {
            output = "Usage: base64 <encode|decode> <text>";
            status = "error";
          } else {
            const operation = args[0].toLowerCase();
            const text = args.slice(1).join(" ");

            if (operation === "encode") {
              output = `Encoded: ${btoa(text)}`;
            } else if (operation === "decode") {
              try {
                output = `Decoded: ${atob(text)}`;
              } catch {
                output = "Error: Invalid base64 string";
                status = "error";
              }
            } else {
              output = "Usage: base64 <encode|decode> <text>";
              status = "error";
            }
          }
          break;

        case "hexdump":
          if (!args[0]) {
            output = "Usage: hexdump <text>";
            status = "error";
          } else {
            const text = args.join(" ");
            const hexBytes = Array.from(text).map((char, i) => {
              const hex = char.charCodeAt(0).toString(16).padStart(2, "0");
              return hex;
            });

            output = `00000000  ${hexBytes.join(" ")}  |${text}|`;
          }
          break;

        case "analyze":
          if (args.length < 2) {
            output =
              "Usage: analyze <type> <data>\nTypes: ip, url, hash, email";
            status = "error";
          } else {
            const type = args[0].toLowerCase();
            const data = args.slice(1).join(" ");

            switch (type) {
              case "ip":
                output = `IP Analysis: ${data}
Geolocation: Unknown
ASN: AS1234 Example ISP
Reputation: Clean
Last seen: Never
Threat score: 0/100`;
                break;
              case "url":
                output = `URL Analysis: ${data}
Status: Safe
Category: Technology
Last scan: ${new Date().toLocaleString()}
Threats detected: 0
Reputation score: 95/100`;
                break;
              case "hash":
                output = `Hash Analysis: ${data}
Algorithm: ${data.length === 32 ? "MD5" : data.length === 40 ? "SHA1" : data.length === 64 ? "SHA256" : "Unknown"}
VirusTotal: 0/70 detections
First seen: ${new Date(Date.now() - Math.random() * 86400000 * 30).toLocaleDateString()}
File type: Unknown`;
                break;
              default:
                output = `Unsupported analysis type: ${type}`;
                status = "error";
            }
          }
          break;

        case "scan":
          if (!args[0]) {
            output = "Usage: scan <target>";
            status = "error";
          } else {
            output = `Security Scan Results for: ${args[0]}

Port Scan:
22/tcp   open   ssh
80/tcp   open   http
443/tcp  open   https
3306/tcp closed mysql

Vulnerability Assessment:
- SSL/TLS configuration: Secure
- HTTP headers: Missing security headers (Warning)
- Software versions: Up to date
- Open ports: Standard configuration

Risk Level: LOW
Recommendations: Implement security headers`;
            status = "warning";
          }
          break;

        case "nmap":
          if (!args[0]) {
            output = "Usage: nmap [options] <target>";
            status = "error";
          } else {
            const target = args[args.length - 1];
            output = `Starting Nmap scan against ${target}

Nmap scan report for ${target}
Host is up (0.012s latency).
Not shown: 996 closed ports
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 4.32 seconds`;
          }
          break;

        case "nikto":
          if (args.length < 2 || args[0] !== "-h") {
            output = "Usage: nikto -h <target>";
            status = "error";
          } else {
            output = `- Nikto v2.1.6
---------------------------------------------------------------------------
+ Target IP:          ${args[1]}
+ Target Hostname:    ${args[1]}
+ Target Port:        80
+ Start Time:         ${new Date().toLocaleString()}
---------------------------------------------------------------------------
+ Server: nginx/1.18.0
+ Retrieved x-powered-by header: PHP/7.4.3
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined.
+ The X-Content-Type-Options header is not set.
+ Root page / redirects to: /index.php
+ No CGI Directories found
+ 6544 requests: 0 error(s) and 4 item(s) reported`;
          }
          break;

        case "sqlmap":
          if (args.length < 2 || args[0] !== "-u") {
            output = "Usage: sqlmap -u <url>";
            status = "error";
          } else {
            output = `        ___
       __H__
 ___ ___[)]_____ ___ ___  {1.6.12}
|_ -| . [.]     | .'| . |
|___|_  [)]_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[*] starting @ ${new Date().toLocaleTimeString()}

[*] testing connection to the target URL
[*] checking if the target is protected by some kind of WAF/IPS
[*] testing if the parameter 'id' is dynamic
[*] confirming that parameter 'id' is dynamic
[*] parameter 'id' appears to be injectable
[*] testing for SQL injection on parameter 'id'
[*] the target is vulnerable to SQL injection

[*] shutting down at ${new Date().toLocaleTimeString()}`;
            status = "warning";
          }
          break;

        case "metasploit":
        case "msfconsole":
          output = `
      =[ metasploit v6.2.26-dev                          ]
+ -- --=[ 2230 exploits - 1177 auxiliary - 398 post       ]
+ -- --=[ 867 payloads - 45 encoders - 11 nops            ]
+ -- --=[ 9 evasion                                       ]

Welcome to Metasploit Framework!

msf6 > help

Core Commands
=============

    Command       Description
    -------       -----------
    ?             Help menu
    banner        Display an awesome metasploit banner
    cd            Change the current working directory
    color         Toggle color
    connect       Communicate with a host
    exit          Exit the console
    get           Gets the value of a context-specific variable
    help          Help menu
    history       Show command history
    load          Load a framework plugin
    quit          Exit the console
    repeat        Repeat a list of commands
    route         Route traffic through a session
    save          Saves the active datastores
    sessions      Dump session listings and display information about sessions
    set           Sets a context-specific variable to a value
    setg          Sets a global variable to a value
    sleep         Do nothing for the specified number of seconds
    spool         Write console output into a file as well the screen
    threads       View and manipulate background threads
    tips          Show a list of useful productivity tips
    unload        Unload a framework plugin
    unset         Unsets one or more context-specific variables
    unsetg        Unsets one or more global variables
    version       Show the framework and console library version numbers

msf6 >`;
          break;

        case "hydra":
          if (!args[0]) {
            output = "Usage: hydra [options] <target>";
            status = "error";
          } else {
            output = `Hydra v9.3 (c) 2022 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at ${new Date().toLocaleString()}
[DATA] max 16 tasks per 1 server, overall 16 tasks, 14344398 login tries (l:1/p:14344398), ~896525 tries per task
[DATA] attacking ${args[args.length - 1]}:22/ssh/
[STATUS] 144.00 tries/min, 144 tries in 00:01h, 14344254 to do in 1662:24h, 16 active
[22][ssh] host: ${args[args.length - 1]}   login: admin   password: 123456
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at ${new Date().toLocaleString()}`;
            status = "warning";
          }
          break;

        case "john":
          if (!args[0]) {
            output = "Usage: john [options] <hashfile>";
            status = "error";
          } else {
            output = `Loaded 1 password hash (md5crypt, crypt(3) $1$ [MD5 128/128 AVX 4x3])
Will run 4 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
password123      (user)
1g 0:00:00:01 DONE (${new Date().toLocaleString()}) 0.8333g/s 8533p/s 8533c/s 8533C/s 123456..james
Use the "--show" option to display all of the cracked passwords reliably
Session completed`;
          }
          break;

        case "gobuster":
          if (args.length < 4 || !args.includes("-u") || !args.includes("-w")) {
            output = "Usage: gobuster dir -u <url> -w <wordlist>";
            status = "error";
          } else {
            const urlIndex = args.indexOf("-u") + 1;
            const target = args[urlIndex] || "target";
            output = `===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     ${target}
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
${new Date().toLocaleString()} Starting gobuster in directory enumeration mode
===============================================================
/admin                (Status: 200) [Size: 1234]
/backup               (Status: 200) [Size: 0]
/config               (Status: 403) [Size: 277]
/images               (Status: 301) [Size: 313] [--> ${target}/images/]
/index                (Status: 200) [Size: 5678]
/login                (Status: 200) [Size: 2345]
/uploads              (Status: 301) [Size: 315] [--> ${target}/uploads/]
===============================================================
${new Date().toLocaleString()} Finished
===============================================================`;
          }
          break;

        case "pkg":
        case "apt":
          if (!args[0]) {
            output = `Usage: ${cmd} <command> [package]\nCommands: install, remove, list, update, search`;
            status = "error";
          } else {
            const subCmd = args[0];
            const packageName = args[1];

            switch (subCmd) {
              case "list":
                output = `Installed packages:\n${installedPackages.map((pkg) => `  ${pkg}`).join("\n")}`;
                break;
              case "install":
                if (!packageName) {
                  output = `Usage: ${cmd} install <package>`;
                  status = "error";
                } else if (installedPackages.includes(packageName)) {
                  output = `Package '${packageName}' is already installed`;
                } else {
                  setInstalledPackages((prev) => [...prev, packageName]);
                  output = `Successfully installed '${packageName}'`;
                }
                break;
              case "remove":
                if (!packageName) {
                  output = `Usage: ${cmd} remove <package>`;
                  status = "error";
                } else if (!installedPackages.includes(packageName)) {
                  output = `Package '${packageName}' is not installed`;
                  status = "error";
                } else {
                  setInstalledPackages((prev) =>
                    prev.filter((pkg) => pkg !== packageName),
                  );
                  output = `Successfully removed '${packageName}'`;
                }
                break;
              case "update":
                output = `Updating package lists...\nAll packages are up to date.`;
                break;
              case "search":
                if (!packageName) {
                  output = `Usage: ${cmd} search <query>`;
                  status = "error";
                } else {
                  const availablePackages = [
                    "wireshark",
                    "burpsuite",
                    "zaproxy",
                    "beef",
                    "responder",
                    "mimikatz",
                    "bloodhound",
                    "empire",
                    "covenant",
                    "cobalt-strike",
                  ];
                  const matches = availablePackages.filter((pkg) =>
                    pkg.includes(packageName.toLowerCase()),
                  );
                  if (matches.length > 0) {
                    output = `Search results:\n${matches.map((pkg) => `  ${pkg} - Security testing tool`).join("\n")}`;
                  } else {
                    output = `No packages found matching '${packageName}'`;
                  }
                }
                break;
              default:
                output = `Unknown command: ${subCmd}`;
                status = "error";
            }
          }
          break;

        case "echo":
          output = args.join(" ");
          break;

        case "ps":
          output = `PID  TTY          TIME CMD
 123  pts/0    00:00:01 bash
 456  pts/0    00:00:00 cybersec-chat
 789  pts/0    00:00:00 ps`;
          break;

        case "top":
          output = `Tasks: 15 total,   1 running,  14 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  1.2 sy,  0.0 ni, 96.5 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem :  8192000 total,  2048000 free,  4096000 used,  2048000 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
  123 cybersec  20   0  123456   2048   1024 S   1.0  0.0   0:01.23 cybersec-chat
  456 cybersec  20   0   98765   1536    768 S   0.5  0.0   0:00.45 terminal`;
          break;

        case "df":
          output = `Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/sda1       20971520 8388608  12582912  40% /
/dev/sda2        4194304  524288   3670016  13% /home
tmpfs            1048576       0   1048576   0% /tmp`;
          break;

        case "free":
          output = `              total        used        free      shared  buff/cache   available
Mem:        8192000     4096000     2048000      102400     2048000     3993600
Swap:       2097152           0     2097152`;
          break;

        case "uname":
          const unameFlag = args[0] || "";
          if (unameFlag === "-a") {
            output = "Linux cybersec-terminal 5.15.0-cyber x86_64 GNU/Linux";
          } else {
            output = "Linux";
          }
          break;

        case "hostname":
          output = "cybersec-terminal";
          break;

        case "id":
          output = `uid=1000(cybersec) gid=1000(cybersec) groups=1000(cybersec),27(sudo),998(docker)`;
          break;

        case "which":
          if (!args[0]) {
            output = "Usage: which <command>";
            status = "error";
          } else {
            const allCommands = [
              ...systemCommands,
              ...tools.map((t) => t.name),
            ];
            if (allCommands.includes(args[0])) {
              output = `/usr/bin/${args[0]}`;
            } else {
              output = `${args[0]} not found`;
              status = "error";
            }
          }
          break;

        case "file":
          if (!args[0]) {
            output = "Usage: file <filename>";
            status = "error";
          } else {
            const entries = fileSystem[currentDirectory] || [];
            const file = entries.find((e) => e.name === args[0]);
            if (file) {
              if (file.type === "directory") {
                output = `${args[0]}: directory`;
              } else {
                const extension = args[0].split(".").pop()?.toLowerCase();
                switch (extension) {
                  case "txt":
                    output = `${args[0]}: ASCII text`;
                    break;
                  case "py":
                    output = `${args[0]}: Python script, ASCII text executable`;
                    break;
                  case "bin":
                    output = `${args[0]}: data`;
                    break;
                  case "pcap":
                    output = `${args[0]}: tcpdump capture file (little-endian)`;
                    break;
                  default:
                    output = `${args[0]}: data`;
                }
              }
            } else {
              output = `file: cannot open '${args[0]}': No such file or directory`;
              status = "error";
            }
          }
          break;

        default:
          output = `Command not found: ${cmd}
Type 'help' for available commands.`;
          status = "error";
      }
    } catch (error) {
      output = `Error executing command: ${error}`;
      status = "error";
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Update the command entry with output
    setCommandHistory((prev) =>
      prev.map((entry) =>
        entry.id === newEntry.id
          ? { ...entry, output, status, duration }
          : entry,
      ),
    );

    setIsExecuting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(currentCommand);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const commands = commandHistory.map((h) => h.command);
      if (historyIndex < commands.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commands[commands.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const commands = commandHistory.map((h) => h.command);
        setCurrentCommand(commands[commands.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple autocomplete
      const available = [...systemCommands, ...tools.map((t) => t.name)];
      const matches = available.filter((cmd) => cmd.startsWith(currentCommand));
      if (matches.length === 1) {
        setCurrentCommand(matches[0]);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-cyber-green" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-cyber-red" />;
      case "warning":
        return <AlertCircle className="h-3 w-3 text-yellow-400" />;
      default:
        return <Clock className="h-3 w-3 text-cyber-blue" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Console Header */}
      <div className="p-4 border-b border-cyber-border bg-cyber-gray">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Terminal className="h-6 w-6 text-cyber-blue" />
            <div>
              <h3 className="text-lg font-medium text-cyber-blue">
                Forensics Console
              </h3>
              <p className="text-sm text-gray-400">
                Interactive command-line interface for cybersecurity analysis
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="cyber-button p-2"
              title="Help"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCommandHistory([])}
              className="cyber-button p-2"
              title="Clear"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-3 bg-cyber-border rounded text-sm"
          >
            <h4 className="text-cyber-blue font-medium mb-2">
              Quick Reference:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-gray-300">
              <div>• Tab: Autocomplete</div>
              <div>• ↑/↓: History navigation</div>
              <div>• help: Show all commands</div>
              <div>• clear: Clear terminal</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Terminal Display */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 bg-cyber-darker font-mono text-sm"
      >
        {/* Welcome Message */}
        {commandHistory.length === 0 && (
          <div className="text-cyber-green mb-4">
            <div>CyberSec Forensics Terminal v2.1.0</div>
            <div>Type &apos;help&apos; for available commands.</div>
            <div className="mt-2 text-gray-400">
              User: {user?.username} | Clearance: {user?.role?.toUpperCase()}
            </div>
          </div>
        )}

        {/* Command History */}
        <AnimatePresence>
          {commandHistory.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3"
            >
              {/* Command Input */}
              <div className="flex items-center space-x-2 text-cyber-blue">
                <span className="text-cyber-green">
                  cyber@forensics:{currentDirectory}$
                </span>
                <span>{entry.command}</span>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  {getStatusIcon(entry.status)}
                  <span>{entry.duration}ms</span>
                </div>
              </div>

              {/* Command Output */}
              {entry.output && (
                <div
                  className={`mt-1 pl-6 whitespace-pre-wrap ${
                    entry.status === "error"
                      ? "text-cyber-red"
                      : entry.status === "warning"
                        ? "text-yellow-400"
                        : "text-gray-300"
                  }`}
                >
                  {entry.output}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Current Input Line */}
        <div className="flex items-center space-x-2 text-cyber-blue">
          <span className="text-cyber-green">
            cyber@forensics:{currentDirectory}$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            className="flex-1 bg-transparent border-none outline-none text-cyber-blue font-mono"
            placeholder={isExecuting ? "Executing..." : "Enter command..."}
            autoFocus
          />
          {isExecuting && (
            <div className="flex items-center space-x-1 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Executing</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-cyber-border bg-cyber-gray flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Commands: {commandHistory.length}</span>
          <span>Status: {isExecuting ? "Executing" : "Ready"}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>User: {user?.username}</span>
          <span>Session: {Math.floor(Math.random() * 1000)}m</span>
        </div>
      </div>
    </div>
  );
}
