import fs from "node:fs";
import path from "node:path";

export function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...parts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = parts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  }
}
