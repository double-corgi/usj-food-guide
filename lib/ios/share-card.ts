import { formatFoodPrice } from "@/lib/food-utils";
import { isNativeIosApp } from "@/lib/ios/native";
import { getPhotoDataUrl } from "@/lib/ios/photo-store";
import { getFoodImage } from "@/lib/utils/image";
import type { FoodWithRelations, UserFoodLog } from "@/types/domain";

export async function createShareCard(food: FoodWithRelations, log: UserFoodLog, completionRate: number, includeCompletion: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("共有画像を作成できませんでした。");

  ctx.fillStyle = "#fffaf5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const photoSrc = log.photoIds?.[0] ? await getPhotoDataUrl(log.photoIds[0], false) : null;
  const imageSrc = photoSrc ?? getFoodImage(food);
  await drawImageCover(ctx, imageSrc, 90, 120, 900, 980).catch(() => undefined);

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  roundRect(ctx, 90, 1160, 900, includeCompletion ? 520 : 420, 42);
  ctx.fill();
  ctx.fillStyle = "#10233f";
  ctx.font = "900 62px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif";
  wrapText(ctx, food.name, 140, 1260, 790, 80, 3);
  ctx.font = "800 42px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif";
  ctx.fillStyle = "#0057b8";
  const rating = typeof log.rating === "number" ? "★".repeat(log.rating) + "☆".repeat(5 - log.rating) : "未評価";
  ctx.fillText(rating, 140, 1505);
  ctx.fillStyle = "#64748b";
  ctx.font = "700 34px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif";
  ctx.fillText(`食べた日 ${formatDate(log.eatenAt)}`, 140, 1565);
  ctx.fillText(`金額 ${typeof log.spentAmount === "number" ? `¥${log.spentAmount.toLocaleString("ja-JP")}` : formatFoodPrice(food)}`, 140, 1625);
  if (includeCompletion) {
    ctx.fillStyle = "#10233f";
    ctx.font = "900 42px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif";
    ctx.fillText(`達成率 ${completionRate}%`, 140, 1700);
  }
  ctx.fillStyle = "#10233f";
  ctx.font = "900 44px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif";
  ctx.fillText("ユニコレ", 140, 1810);
  ctx.fillStyle = "#64748b";
  ctx.font = "700 28px -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif";
  ctx.fillText("個人運営の非公式ファンアプリ", 140, 1860);
  return canvas.toDataURL("image/png");
}

export async function shareCardDataUrl(dataUrl: string) {
  if (isNativeIosApp()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const fileName = `unicolle-share-${Date.now()}.png`;
    await Filesystem.writeFile({ directory: Directory.Cache, path: fileName, data: dataUrl.split(",")[1] ?? "" });
    const uri = await Filesystem.getUri({ directory: Directory.Cache, path: fileName });
    await Share.share({ title: "ユニコレ", text: "ユニコレの食べた記録", files: [uri.uri], dialogTitle: "食べた記録を共有" });
    return;
  }
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "unicolle-share.png";
  link.click();
}

function formatDate(value?: string) {
  if (!value) return "未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

async function drawImageCover(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, width: number, height: number) {
  const image = await loadImage(src);
  const ratio = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  ctx.save();
  roundRect(ctx, x, y, width, height, 54);
  ctx.clip();
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!src.startsWith("data:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const chars = Array.from(text);
  let line = "";
  let lineCount = 0;
  for (const char of chars) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = char;
      lineCount += 1;
      if (lineCount >= maxLines) return;
    } else {
      line = next;
    }
  }
  if (line && lineCount < maxLines) ctx.fillText(line, x, y + lineCount * lineHeight);
}
