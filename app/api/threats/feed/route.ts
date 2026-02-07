import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/utils/auth";
import { rateLimit } from "../../../../lib/middleware/rateLimit";

// Mock threat intelligence data (replace with real feeds in production)
const mockThreatFeed = [
  {
    id: "threat-001",
    title: "New Ransomware Campaign Detected",
    description:
      "Multiple organizations reporting infections from LockBit 3.0 variant targeting healthcare sector",
    severity: "high",
    category: "malware",
    source: "CISA",
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    indicators: [
      {
        type: "hash",
        value: "a1b2c3d4e5f6...",
        description: "SHA256 hash of malware binary",
      },
      {
        type: "domain",
        value: "malicious-domain.com",
        description: "C2 server domain",
      },
      { type: "ip", value: "192.168.1.100", description: "Known malicious IP" },
    ],
    mitigation: "Block domains and IPs, update endpoint protection signatures",
    tags: ["ransomware", "healthcare", "lockbit"],
    tlp: "amber",
  },
  {
    id: "threat-002",
    title: "APT29 Phishing Campaign Active",
    description:
      "Russian APT group targeting government and defense contractors with sophisticated spear-phishing",
    severity: "critical",
    category: "apt",
    source: "NSA",
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    indicators: [
      {
        type: "email",
        value: "admin@govt-portal.org",
        description: "Spoofed sender address",
      },
      {
        type: "url",
        value: "https://secure-login-portal.net/auth",
        description: "Phishing landing page",
      },
    ],
    mitigation:
      "Enhanced email filtering, user awareness training, MFA enforcement",
    tags: ["apt29", "phishing", "government", "spearphishing"],
    tlp: "red",
  },
  {
    id: "threat-003",
    title: "Zero-Day Exploit in Popular VPN Software",
    description:
      "Critical vulnerability in FortiGate SSL VPN allows remote code execution",
    severity: "critical",
    category: "vulnerability",
    source: "Fortinet",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    indicators: [
      {
        type: "cve",
        value: "CVE-2024-0001",
        description: "Official CVE identifier",
      },
      {
        type: "product",
        value: "FortiOS 7.0.0 - 7.2.4",
        description: "Affected versions",
      },
    ],
    mitigation:
      "Immediate patching required, disable SSL VPN if patching not possible",
    tags: ["zero-day", "vpn", "rce", "fortinet"],
    tlp: "white",
  },
  {
    id: "threat-004",
    title: "Cryptocurrency Mining Botnet Expanding",
    description:
      "XMRig-based botnet compromising cloud instances and IoT devices",
    severity: "medium",
    category: "botnet",
    source: "Microsoft Security",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    indicators: [
      { type: "ip", value: "45.142.214.100", description: "Mining pool IP" },
      {
        type: "hash",
        value: "f8e4c5d3a2b1...",
        description: "XMRig binary hash",
      },
      {
        type: "process",
        value: "xmrig.exe",
        description: "Malicious process name",
      },
    ],
    mitigation:
      "Monitor for unauthorized mining processes, network egress filtering",
    tags: ["cryptocurrency", "mining", "botnet", "iot"],
    tlp: "green",
  },
  {
    id: "threat-005",
    title: "Supply Chain Attack on NPM Package",
    description:
      "Popular JavaScript library compromised with data exfiltration payload",
    severity: "high",
    category: "supply-chain",
    source: "npm Security Team",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    indicators: [
      {
        type: "package",
        value: "popular-js-lib@1.2.3",
        description: "Compromised package version",
      },
      {
        type: "url",
        value: "https://data-collector.evil.com",
        description: "Data exfiltration endpoint",
      },
    ],
    mitigation: "Audit dependencies, implement software composition analysis",
    tags: ["supply-chain", "npm", "javascript", "data-theft"],
    tlp: "amber",
  },
];

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Filter threats based on query parameters
    let filteredThreats = [...mockThreatFeed];

    if (severity) {
      filteredThreats = filteredThreats.filter(
        (threat) => threat.severity === severity.toLowerCase(),
      );
    }

    if (category) {
      filteredThreats = filteredThreats.filter(
        (threat) => threat.category === category.toLowerCase(),
      );
    }

    // Sort by timestamp (newest first)
    filteredThreats.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    // Apply pagination
    const paginatedThreats = filteredThreats.slice(offset, offset + limit);

    // Filter data based on user role (TLP restrictions)
    const userRole = user.role;
    const accessibleThreats = paginatedThreats.filter((threat) => {
      switch (threat.tlp) {
        case "red":
          return ["admin", "enterprise"].includes(userRole);
        case "amber":
          return ["admin", "enterprise", "pro"].includes(userRole);
        case "green":
        case "white":
        default:
          return true; // All users can access
      }
    });

    return NextResponse.json({
      success: true,
      message: "Threat feed retrieved successfully",
      threats: accessibleThreats,
      total: filteredThreats.length,
      offset,
      limit,
      filters: {
        severity,
        category,
      },
    });
  } catch (error) {
    console.error("Get threat feed error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve threat feed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 60000, // 1 minute
      maxRequests: 10, // Max 10 threat reports per minute
    });
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Check authentication and permissions
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    // Only pro, enterprise, and admin users can submit threat reports
    if (!["admin", "enterprise", "pro"].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient permissions to submit threat reports",
        },
        { status: 403 },
      );
    }

    const {
      title,
      description,
      severity,
      category,
      indicators,
      mitigation,
      tags,
    } = await request.json();

    // Validation
    if (!title || !description || !severity || !category) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, description, severity, and category are required",
        },
        { status: 400 },
      );
    }

    if (!["low", "medium", "high", "critical"].includes(severity)) {
      return NextResponse.json(
        { success: false, message: "Invalid severity level" },
        { status: 400 },
      );
    }

    // Create new threat report
    const newThreat = {
      id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description.trim(),
      severity,
      category,
      source: `User: ${user.email}`,
      timestamp: new Date(),
      indicators: indicators || [],
      mitigation: mitigation?.trim() || "",
      tags: tags || [],
      tlp: "green", // User-submitted reports default to TLP:GREEN
      submittedBy: user.userId,
    };

    // In production, save to database and potentially queue for review
    mockThreatFeed.unshift(newThreat);

    return NextResponse.json({
      success: true,
      message: "Threat report submitted successfully",
      threatId: newThreat.id,
    });
  } catch (error) {
    console.error("Submit threat report error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit threat report" },
      { status: 500 },
    );
  }
}
