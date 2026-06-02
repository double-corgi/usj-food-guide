import { fetchText } from "../utils/http";

const url = process.argv[2] ?? "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/kinopios-cafe/index.html";

fetchText(url)
  .then((raw) => {
    const json = JSON.parse(raw);
    const hits: Array<{ path: string; value: string }> = [];
    walk(json, [], hits);
    for (const hit of hits.slice(0, 80)) console.log(JSON.stringify(hit, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

function walk(value: unknown, path: string[], hits: Array<{ path: string; value: string }>) {
  if (value == null) return;
  if (typeof value === "string") {
    if (/\.(?:jpg|jpeg|png|webp)/i.test(value)) hits.push({ path: path.join("."), value: value.slice(0, 260) });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, [...path, String(index)], hits));
    return;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) walk(child, [...path, key], hits);
  }
}
