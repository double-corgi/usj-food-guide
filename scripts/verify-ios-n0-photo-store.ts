import { readFileSync } from "node:fs";

const source = readFileSync("lib/ios/photo-store.ts", "utf8");
const checks = [
  "Camera.pickImages",
  "@capacitor/filesystem",
  "Directory.Data",
  "unicolle-photos",
  "PHOTO_LONG_EDGE = 1600",
  "THUMB_LONG_EDGE = 400",
  "toDataURL(\"image/jpeg\"",
  "deletePhotosNotUsed"
];
for (const check of checks) {
  if (!source.includes(check)) throw new Error(`photo store missing ${check}`);
}
if (source.includes("Camera.getPhoto")) throw new Error("Camera capture API must not be used in N0");
console.log("PASS ios-n0 photo store: PHPicker-style selection, Filesystem storage, resize, thumbnail, delete guard present.");
