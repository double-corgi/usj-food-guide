import { readFileSync } from "node:fs";

const source = readFileSync("lib/ios/offline-snapshot.ts", "utf8");
for (const check of ["@capacitor/preferences", "@capacitor/network", "saveOfflineSnapshot", "readOfflineSnapshot", "networkStatusChange"]) {
  if (!source.includes(check)) throw new Error(`offline snapshot missing ${check}`);
}
console.log("PASS ios-n0 offline snapshot: Preferences snapshot and Network status listener present.");
