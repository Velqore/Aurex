import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";
import crypto from "crypto";
import { getUserFromRequest } from "../../../../../lib/utils/auth";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { fileId } = await params;
    if (!fileId) {
      return NextResponse.json(
        { success: false, message: "fileId is required" },
        { status: 400 }
      );
    }

    const registry = loadFileRegistry();
    const record = registry.find((item) => item.id === fileId);

    if (!record) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

    const filePath = record.filePath || path.join(UPLOAD_DIR, record.fileName);
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

    const storedData = await readFile(filePath);
    let outputData = storedData;

    if (record.encrypted) {
      const encryptionKey = process.env.FILE_ENCRYPTION_KEY;
      if (!encryptionKey) {
        return NextResponse.json(
          { success: false, message: "File encryption not configured" },
          { status: 500 }
        );
      }

      const ivBase64 = record.encryptionIv || record.metadata?.encryptionIv;
      if (!ivBase64) {
        return NextResponse.json(
          { success: false, message: "Missing encryption IV" },
          { status: 500 }
        );
      }

      const iv = Buffer.from(ivBase64, "base64");
      const key = crypto.scryptSync(encryptionKey, "aurex-file", 32);
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      const decryptedData = Buffer.concat([
        decipher.update(storedData),
        decipher.final(),
      ]);
      outputData = decryptedData;
    }

    return new NextResponse(outputData, {
      headers: {
        "Content-Type": record.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename=\"${record.originalName}\"`,
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { success: false, message: "File download failed" },
      { status: 500 }
    );
  }
}
