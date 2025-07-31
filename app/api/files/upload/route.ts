import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { getUserFromRequest } from "../../../../lib/utils/auth";
import { validateFileUpload } from "../../../../lib/utils/validation";
import { rateLimit } from "../../../../lib/middleware/rateLimit";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

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
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/json",
        "application/xml",
        "application/zip",
        "application/x-zip-compressed",
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

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Encrypt file content (basic example - use stronger encryption in production)
    const encryptionKey =
      process.env.FILE_ENCRYPTION_KEY || "default-key-change-this";
    const cipher = crypto.createCipher("aes-256-cbc", encryptionKey);
    let encryptedData = cipher.update(buffer);
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);

    // Write encrypted file
    await writeFile(filePath, encryptedData);

    // Parse metadata if provided
    let metadata = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (error) {
        console.warn("Invalid metadata JSON:", error);
      }
    }

    // Create file record (in production, save to database)
    const fileRecord = {
      id: crypto.randomUUID(),
      originalName: file.name,
      fileName: safeFileName,
      filePath,
      size: file.size,
      type: file.type,
      userId: user.userId,
      uploadedAt: new Date().toISOString(),
      metadata,
      encrypted: true,
      scanStatus: "pending", // For virus scanning
    };

    // In production, save fileRecord to database here
    console.log("File uploaded:", fileRecord);

    // Return file info
    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      fileId: fileRecord.id,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: fileRecord.uploadedAt,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, message: "File upload failed" },
      { status: 500 },
    );
  }
}

// Add file size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
