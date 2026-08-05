import { requireStaffApi, staffApiHeaders, staffJson } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_WIDTH = 640;
const MIN_IMAGE_HEIGHT = 480;
const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
  ["image/heif", "heif"]
]);

const TARGET_FOLDERS = new Map([
  ["food", "staff"],
  ["store", "staff-shops"],
  ["area", "staff-areas"],
  ["collection", "collections"]
]);

const IMAGE_VARIANTS = [
  { key: "thumbnail", width: 360, height: 270 },
  { key: "card", width: 960, height: 720 },
  { key: "detail", width: 1600, height: 1200 }
] as const;

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: staffApiHeaders(request, "POST, OPTIONS") });
}

export async function POST(request: Request) {
  const context = await requireStaffApi(request, "editor", "POST, OPTIONS");
  if ("response" in context) return context.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const target = String(formData.get("target") ?? "food");
    if (!(file instanceof File)) {
      return staffJson({ ok: false, error: "invalid_file" }, 400, context.headers);
    }
    const ext = IMAGE_TYPES.get(file.type);
    const folder = TARGET_FOLDERS.get(target);
    if (!ext || !folder || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return staffJson({ ok: false, error: "invalid_image" }, 400, context.headers);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const { default: sharp } = await import("sharp");
    const parsed = sharp(bytes, { failOn: "none" }).rotate();
    const metadata = await parsed.metadata().catch(() => null);
    const width = metadata?.width ?? 0;
    const height = metadata?.height ?? 0;
    if (!width || !height) {
      return staffJson({ ok: false, error: "unsupported_image" }, 400, context.headers);
    }
    if (Math.max(width, height) < MIN_IMAGE_WIDTH || Math.min(width, height) < MIN_IMAGE_HEIGHT) {
      return staffJson({ ok: false, error: "image_too_small", minWidth: MIN_IMAGE_WIDTH, minHeight: MIN_IMAGE_HEIGHT }, 400, context.headers);
    }

    const storage = (context.supabase as any).storage.from("food-images");
    const nonce = Date.now() + "-" + crypto.randomUUID();
    const basePath = folder + "/" + context.user.id + "/" + nonce;
    const originalPath = basePath + "/original." + ext;
    const originalUpload = await storage.upload(originalPath, bytes, { contentType: file.type, upsert: false });
    if (originalUpload.error) {
      return staffJson({ ok: false, error: "upload_failed" }, 400, context.headers);
    }

    const urls: Record<string, string> = { original: storage.getPublicUrl(originalPath).data.publicUrl };
    const paths: Record<string, string> = { original: originalPath };
    for (const variant of IMAGE_VARIANTS) {
      const outputPath = basePath + "/" + variant.key + ".jpg";
      const output = await sharp(bytes, { failOn: "none" })
        .rotate()
        .resize({ width: variant.width, height: variant.height, fit: "cover", position: sharp.strategy.attention, withoutEnlargement: true })
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer();
      const upload = await storage.upload(outputPath, output, { contentType: "image/jpeg", upsert: false });
      if (upload.error) {
        return staffJson({ ok: false, error: "upload_failed" }, 400, context.headers);
      }
      paths[variant.key] = outputPath;
      urls[variant.key] = storage.getPublicUrl(outputPath).data.publicUrl;
    }

    return staffJson({
      ok: true,
      publicUrl: urls.card,
      target,
      image: { width, height, minWidth: MIN_IMAGE_WIDTH, minHeight: MIN_IMAGE_HEIGHT, ratio: "4:3", fit: "cover", crop: "attention" },
      paths,
      urls
    }, 200, context.headers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = /Input buffer contains unsupported image format|unsupported|heif|heic/i.test(message) ? "unsupported_image" : "upload_failed";
    return staffJson({ ok: false, error: code }, 400, context.headers);
  }
}
