import { isNativeIosApp } from "@/lib/ios/native";
import type { UserFoodLog } from "@/types/domain";

export type StoredFoodPhoto = {
  id: string;
  fileName: string;
  thumbnailFileName: string;
  createdAt: string;
  width?: number;
  height?: number;
};

const PHOTO_DIR = "unicolle-photos";
const PHOTO_INDEX_KEY = "unicolle-ios-photo-index-v1";
const MAX_PHOTOS_PER_LOG = 4;
const PHOTO_LONG_EDGE = 1600;
const THUMB_LONG_EDGE = 400;

export async function pickAndStoreFoodPhotos(remainingSlots: number): Promise<StoredFoodPhoto[]> {
  const limit = Math.max(0, Math.min(MAX_PHOTOS_PER_LOG, remainingSlots));
  if (limit <= 0) return [];
  if (!isNativeIosApp()) return [];

  const { Camera } = await import("@capacitor/camera");
  const result = await Camera.pickImages({ quality: 82, limit });
  const photos = result.photos ?? [];
  const saved: StoredFoodPhoto[] = [];
  for (const photo of photos.slice(0, limit)) {
    const webPath = photo.webPath;
    if (!webPath) continue;
    saved.push(await savePhotoFromWebPath(webPath));
  }
  return saved;
}

export async function savePhotoFromWebPath(webPath: string): Promise<StoredFoodPhoto> {
  const blob = await fetch(webPath).then((response) => response.blob());
  const image = await decodeImage(blob);
  const full = await renderJpeg(image, PHOTO_LONG_EDGE, 0.84);
  const thumb = await renderJpeg(image, THUMB_LONG_EDGE, 0.78);
  const id = crypto.randomUUID();
  const fileName = `${id}.jpg`;
  const thumbnailFileName = `${id}-thumb.jpg`;
  await ensurePhotoDirectory();
  await writeBase64File(fileName, full.base64);
  await writeBase64File(thumbnailFileName, thumb.base64);
  const record: StoredFoodPhoto = { id, fileName, thumbnailFileName, createdAt: new Date().toISOString(), width: full.width, height: full.height };
  await upsertPhotoIndex([record]);
  return record;
}

export async function getPhotoDataUrl(photoId: string, thumbnail = false): Promise<string | null> {
  const record = (await readPhotoIndex()).find((item) => item.id === photoId);
  if (!record || !isNativeIosApp()) return null;
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const fileName = thumbnail ? record.thumbnailFileName : record.fileName;
    const result = await Filesystem.readFile({ directory: Directory.Data, path: `${PHOTO_DIR}/${fileName}` });
    return `data:image/jpeg;base64,${String(result.data)}`;
  } catch {
    return null;
  }
}

export async function deletePhotosNotUsed(photoIds: string[], remainingLogs: UserFoodLog[]) {
  if (!isNativeIosApp()) return;
  const used = new Set(remainingLogs.flatMap((log) => log.photoIds ?? []));
  const removable = photoIds.filter((id) => !used.has(id));
  if (removable.length === 0) return;
  const index = await readPhotoIndex();
  const byId = new Map(index.map((item) => [item.id, item]));
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  for (const id of removable) {
    const record = byId.get(id);
    if (!record) continue;
    await Filesystem.deleteFile({ directory: Directory.Data, path: `${PHOTO_DIR}/${record.fileName}` }).catch(() => undefined);
    await Filesystem.deleteFile({ directory: Directory.Data, path: `${PHOTO_DIR}/${record.thumbnailFileName}` }).catch(() => undefined);
  }
  await writePhotoIndex(index.filter((item) => !removable.includes(item.id)));
}

export async function readPhotoIndex(): Promise<StoredFoodPhoto[]> {
  if (typeof window === "undefined") return [];
  try {
    if (isNativeIosApp()) {
      const { Preferences } = await import("@capacitor/preferences");
      const item = await Preferences.get({ key: PHOTO_INDEX_KEY });
      const parsed = item.value ? JSON.parse(item.value) : [];
      return Array.isArray(parsed) ? parsed.filter(isStoredFoodPhoto) : [];
    }
    const parsed = JSON.parse(window.localStorage.getItem(PHOTO_INDEX_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isStoredFoodPhoto) : [];
  } catch {
    return [];
  }
}

async function upsertPhotoIndex(records: StoredFoodPhoto[]) {
  const current = await readPhotoIndex();
  const next = new Map(current.map((item) => [item.id, item]));
  records.forEach((record) => next.set(record.id, record));
  await writePhotoIndex(Array.from(next.values()));
}

async function writePhotoIndex(records: StoredFoodPhoto[]) {
  const value = JSON.stringify(records.filter(isStoredFoodPhoto));
  if (isNativeIosApp()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: PHOTO_INDEX_KEY, value });
    return;
  }
  if (typeof window !== "undefined") window.localStorage.setItem(PHOTO_INDEX_KEY, value);
}

async function ensurePhotoDirectory() {
  if (!isNativeIosApp()) return;
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  await Filesystem.mkdir({ directory: Directory.Data, path: PHOTO_DIR, recursive: true }).catch(() => undefined);
}

async function writeBase64File(fileName: string, data: string) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  await Filesystem.writeFile({ directory: Directory.Data, path: `${PHOTO_DIR}/${fileName}`, data, recursive: true });
}

function isStoredFoodPhoto(value: unknown): value is StoredFoodPhoto {
  const item = value as StoredFoodPhoto;
  return Boolean(item) && typeof item.id === "string" && typeof item.fileName === "string" && typeof item.thumbnailFileName === "string" && typeof item.createdAt === "string";
}

async function decodeImage(blob: Blob): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === "function") return createImageBitmap(blob, { imageOrientation: "from-image" });
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした。"));
    };
    image.src = url;
  });
}

async function renderJpeg(image: HTMLImageElement | ImageBitmap, maxLongEdge: number, quality: number) {
  const sourceWidth = "naturalWidth" in image ? image.naturalWidth : image.width;
  const sourceHeight = "naturalHeight" in image ? image.naturalHeight : image.height;
  const scale = Math.min(1, maxLongEdge / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を保存できませんでした。");
  context.drawImage(image, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { base64: dataUrl.split(",")[1] ?? "", width, height };
}
