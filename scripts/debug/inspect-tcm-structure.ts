import { fetchText } from "../utils/http";

const url = process.argv[2] ?? "https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/kinopios-cafe/index.html";
const keyword = process.argv[3] ?? "マリオ・バーガー";

fetchText(url)
  .then((raw) => {
    const json = JSON.parse(raw);
    const hits: Array<{ path: string; key: string; value: string; keys: string[] }> = [];
    walk(json, [], hits);
    for (const hit of hits.filter((item) => item.value.includes(keyword) || /(バーガー|チュリトス|ポップコーン|プレート|ケーキ|ドリンク)/.test(item.value)).slice(0, 80)) {
      console.log(JSON.stringify(hit, null, 2));
    }
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

function walk(value: unknown, path: string[], hits: Array<{ path: string; key: string; value: string; keys: string[] }>) {
  if (value == null) return;
  if (typeof value === "string") {
    const compact = value.replace(/\s+/g, " ").slice(0, 220);
    if (/(バーガー|チュリトス|ポップコーン|プレート|ケーキ|ドリンク|ピザ|カレー|チキン)/.test(compact)) {
      hits.push({
        path: path.join("."),
        key: path.at(-1) ?? "",
        value: compact,
        keys: []
      });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, [...path, String(index)], hits));
    return;
  }
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const keys = Object.keys(object);
    for (const [key, child] of Object.entries(object)) {
      const before = hits.length;
      walk(child, [...path, key], hits);
      for (const hit of hits.slice(before)) hit.keys = keys;
    }
  }
}
