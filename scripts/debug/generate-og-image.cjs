const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "../..");
const outPath = path.join(root, "public", "og-image.png");
const iconPath = path.join(root, "public", "icons", "app-icon-1024.png");

const background = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff5d7"/>
      <stop offset="54%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e8f2ff"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#071b3a" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="80" r="190" fill="#f6b73c" opacity="0.16"/>
  <circle cx="1040" cy="540" r="180" fill="#0057b8" opacity="0.12"/>
  <circle cx="100" cy="540" r="150" fill="#f6b73c" opacity="0.12"/>
  <rect x="72" y="70" width="1056" height="490" rx="58" fill="#ffffff" filter="url(#shadow)"/>
  <text x="388" y="228" font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Noto Sans JP', sans-serif" font-size="34" font-weight="900" fill="#0057b8" letter-spacing="5">
    ユニバフードコレクション
  </text>
  <text x="388" y="342" font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Noto Sans JP', sans-serif" font-size="104" font-weight="900" fill="#071b3a" letter-spacing="-2">
    ユニコレ
  </text>
  <text x="392" y="425" font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Noto Sans JP', sans-serif" font-size="34" font-weight="800" fill="#0f172a">
    食べた記録が、そのままコレクションになる。
  </text>
  <text x="392" y="486" font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Noto Sans JP', sans-serif" font-size="24" font-weight="650" fill="#64748b">
    USJフードを写真で集めて楽しむ非公式コレクションアプリ
  </text>
</svg>`;

async function run() {
  const icon = await sharp(iconPath).resize(238, 238).png().toBuffer();
  await sharp(Buffer.from(background))
    .composite([{ input: icon, left: 122, top: 196 }])
    .png()
    .toFile(outPath);
  console.log(`Generated ${path.relative(root, outPath)}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
