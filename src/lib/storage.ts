import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type StoredPhoto = {
  url: string;
};

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const IS_SERVERLESS = process.env.VERCEL === "1";

function storageConfigError(): Error {
  return new Error(
    "Photo storage is not configured. Set SUPABASE_URL and SUPABASE_STORAGE_KEY (and create a public bucket named 'photos'), or BLOB_READ_WRITE_TOKEN, in the deployment environment variables."
  );
}

function supabaseStorage() {
  const baseUrl = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
  const key = (process.env.SUPABASE_STORAGE_KEY ?? "").trim();
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET ?? "photos").trim();
  if (!baseUrl || !key) return null;
  return { uploadUrl: `${baseUrl}/storage/v1/object/${bucket}`, host: baseUrl, key, bucket };
}

export function validatePhotoInput(
  mimeType: string | null | undefined,
  byteSize: number
): void {
  const mime = mimeType ?? "";
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Only JPG, PNG or WEBP images are allowed.");
  }
  if (byteSize > MAX_PHOTO_BYTES) {
    throw new Error("Photo must be 5 MB or smaller.");
  }
}

function extFor(mimeType: string): string {
  return ALLOWED_EXT[mimeType] ?? "jpg";
}

export async function savePhoto(
  buffer: Uint8Array,
  mimeType: string,
  ownerKey: string
): Promise<StoredPhoto> {
  const ext = extFor(mimeType);
  const filename = `${ownerKey}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`photos/${filename}`, Buffer.from(buffer), {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  const sb = supabaseStorage();
  if (sb) {
    const res = await fetch(`${sb.uploadUrl}/${filename}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sb.key}`,
        "Content-Type": mimeType,
        "x-upsert": "true",
      },
      body: Buffer.from(buffer),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      let detail = "";
      try {
        const parsed = JSON.parse(bodyText);
        detail = parsed?.message ?? parsed?.error ?? bodyText;
      } catch {
        detail = bodyText;
      }
      throw new Error(`Photo upload to Supabase Storage failed (HTTP ${res.status}): ${detail}`);
    }
    return { url: `${sb.host}/storage/v1/object/public/${sb.bucket}/${filename}` };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (IS_SERVERLESS) {
    throw storageConfigError();
  }
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch {
    throw storageConfigError();
  }
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);
  return { url: `/uploads/${filename}` };
}

export async function deletePhotoByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN && url.startsWith("https://")) {
      if (url.includes("blob.vercel-storage.com")) {
        const { del } = await import("@vercel/blob");
        await del(url);
        return;
      }
    }

    const sb = supabaseStorage();
    const sbMatch = sb ? url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/) : null;
    if (sb && sbMatch) {
      const objectPath = sbMatch[1];
      await fetch(`${sb.uploadUrl}/${objectPath}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sb.key}` },
      }).catch(() => {});
      return;
    }

    const isLocal =
      !IS_SERVERLESS &&
      (url.startsWith("/uploads/") ||
        (!url.startsWith("http") && !url.startsWith("blob:")));
    if (isLocal) {
      const clean = url.replace(/^\/?uploads\//, "");
      const filePath = path.join(process.cwd(), "public", "uploads", clean);
      await fs.unlink(filePath);
    }
  } catch {
    // Best-effort deletion; ignore missing files.
  }
}