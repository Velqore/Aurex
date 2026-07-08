import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import crypto from "crypto";
import { getUserFromRequest } from "../../../../lib/utils/auth";
import { validateFileUpload } from "../../../../lib/utils/validation";
import { rateLimit } from "../../../../lib/middleware/rateLimit";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const FILE_REGISTRY = path.join(process.cwd(), ".tmp-files.json");
export const runtime = "nodejs";

interface FileRecord {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  size: number;
  type: string;
  userId: string;
  uploadedAt: string;
  metadata: Record<string, any>;
  encrypted: boolean;
  encryptionIv?: string;
  scanStatus: string;
}

function loadFileRegistry(): FileRecord[] {
  try {
    if (existsSync(FILE_REGISTRY)) {
      const data = readFileSync(FILE_REGISTRY, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading file registry:", error);
  }
  return [];
}

function saveFileRegistry(records: FileRecord[]): void {
  try {
    writeFileSync(FILE_REGISTRY, JSON.stringify(records, null, 2));
  } catch (error) {
    console.error("Error saving file registry:", error);
  }
}

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 60000, // 1 minute
      maxRequests: 10, // Max 10 uploads per minute
    });
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

    // Ensure upload directory exists
    await ensureUploadDir();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const metadataStr = formData.get("metadata") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file
    const validation = validateFileUpload(file, {
      maxSize: 50 * 1024 * 1024, // 50MB for cybersec files
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/json",
        "application/xml",
        "application/zip",
        "application/x-zip-compressed",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        // Add more security-related file types as needed
      ],
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString("hex");
    const safeFileName = `${timestamp}_${randomString}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, safeFileName);

    // Parse metadata if provided
    let metadata: Record<string, any> = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (error) {
        console.warn("Invalid metadata JSON:", error);
      }
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Encrypt file content (fallback to plaintext in non-production)
    let encrypted = true;
    let fileDataToWrite = buffer;
    let encryptionIv: string | undefined;

    if (!process.env.FILE_ENCRYPTION_KEY) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, message: "File encryption not configured" },
          { status: 500 }
        );
      }

      encrypted = false;
    } else {
      const encryptionKey = process.env.FILE_ENCRYPTION_KEY;
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(encryptionKey, "aurex-file", 32);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
      fileDataToWrite = encryptedData;
      encrypted = true;

      // Store IV for decryption
      encryptionIv = iv.toString("base64");
      metadata.encryptionIv = encryptionIv;
    }

    // Write file
    await writeFile(filePath, fileDataToWrite);

    // Create file record (in production, save to database)
    const fileRecord: FileRecord = {
      id: crypto.randomUUID(),
      originalName: file.name,
      fileName: safeFileName,
      filePath,
      size: file.size,
      type: file.type,
      userId: user.userId,
      uploadedAt: new Date().toISOString(),
      metadata,
      encrypted,
      encryptionIv,
      scanStatus: "pending", // For virus scanning
    };

    const registry = loadFileRegistry();
    registry.push(fileRecord);
    saveFileRegistry(registry);

    // In production, save fileRecord to database here
    console.log("File uploaded:", fileRecord);

    // Return file info with download URL
    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      fileId: fileRecord.id,
      fileName: safeFileName,
      originalName: file.name,
      filePath: `/api/files/download/${fileRecord.id}`,
      size: file.size,
      type: file.type,
      uploadedAt: fileRecord.uploadedAt,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "File upload failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
