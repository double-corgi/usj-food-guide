import { readFileSync } from "node:fs";

const page = readFileSync("app/page.tsx", "utf8");
const detail = readFileSync("components/food-detail.tsx", "utf8");
const eaten = readFileSync("components/eaten-experience.tsx", "utf8");
const modal = readFileSync("components/ios/food-record-modal.tsx", "utf8");
const photoStore = readFileSync("lib/ios/photo-store.ts", "utf8");
const shareCard = readFileSync("lib/ios/share-card.ts", "utf8");

if (page.includes("IosNativeAppGate")) {
  throw new Error("home page still replaces the original UNICOLLE UI with the Build 3 iOS native gate");
}
for (const required of ["HomeDashboard", "activeCollectionFoods", "collections", "areas"]) {
  if (!page.includes(required)) throw new Error(`home page missing restored baseline element: ${required}`);
}
for (const removed of ["＋記録", "アルバム", "パーク"]) {
  if (page.includes(removed)) throw new Error(`home page still exposes Build 3 tab wording: ${removed}`);
}
for (const required of ["FoodRecordAction", "写真やメモも追加する", "記録だけ付ける", "記録だけ外す"]) {
  if (!(detail + modal).includes(required)) throw new Error(`food detail record integration missing: ${required}`);
}
for (const required of ["FoodRecordDetailModal", "RecordPhotoImage", "記録を削除", "共有する"]) {
  if (!(eaten + modal).includes(required)) throw new Error(`eaten record detail integration missing: ${required}`);
}
for (const required of ["@capacitor/camera", "Filesystem", "Directory.Data", "unicolle-photos"]) {
  if (!photoStore.includes(required)) throw new Error(`photo store capability missing: ${required}`);
}
for (const required of ["@capacitor/share", "1080", "1920", "非公式ファンアプリ"]) {
  if (!shareCard.includes(required)) throw new Error(`share card capability missing: ${required}`);
}
console.log("PASS ios-n0: Build 1 baseline UI is restored and iOS native record features remain integrated.");
