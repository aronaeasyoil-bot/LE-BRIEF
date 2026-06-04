import path from "node:path";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

export type UploadBucket = "images" | "documents" | "videos";

const MAX_UPLOAD_SIZE_BYTES = 18 * 1024 * 1024;

const documentMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const mimeExtensions: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase();
  const clean = trimmed.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  const normalized = clean.replace(/^[-_.]+|[-_.]+$/g, "");
  return normalized || "file";
}

function resolveExtension(fileName: string, mimeType: string) {
  const currentExtension = path.extname(fileName);
  if (currentExtension) {
    return currentExtension.toLowerCase();
  }

  return mimeExtensions[mimeType] || "";
}

function validateUpload(bucket: UploadBucket, mimeType: string, size: number) {
  if (size <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Empty file upload" });
  }

  if (size > MAX_UPLOAD_SIZE_BYTES) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "File exceeds 18 MB limit",
    });
  }

  if (bucket === "images" && !mimeType.startsWith("image/")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported image file type" });
  }

  if (bucket === "videos" && !mimeType.startsWith("video/")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported video file type" });
  }

  if (bucket === "documents" && !documentMimeTypes.has(mimeType)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported document file type" });
  }
}

export async function uploadAdminFile(input: {
  bucket: UploadBucket;
  fileName: string;
  mimeType: string;
  dataBase64: string;
  size: number;
}) {
  validateUpload(input.bucket, input.mimeType, input.size);

  const normalizedFileName = sanitizeFileName(input.fileName);
  const extension = resolveExtension(normalizedFileName, input.mimeType);
  const baseName = extension
    ? normalizedFileName.slice(0, normalizedFileName.length - extension.length)
    : normalizedFileName;
  const finalName = `${baseName || "file"}${extension}`;
  const storageKey = `le-brief/${input.bucket}/${Date.now()}-${finalName}`;
  const buffer = Buffer.from(input.dataBase64, "base64");

  return storagePut(storageKey, buffer, input.mimeType);
}
