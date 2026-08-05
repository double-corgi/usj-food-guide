import { readFileSync } from "node:fs";
import sharp from "sharp";

const files = {
  staff: readFileSync("components/staff/staff-console.tsx", "utf8"),
  write: readFileSync("app/api/staff/write/route.ts", "utf8"),
  upload: readFileSync("app/api/staff/upload-image/route.ts", "utf8"),
  shared: readFileSync("app/api/staff/_shared.ts", "utf8")
};

function check(name, ok, detail) {
  if (!ok) throw new Error("FAIL " + name + " (" + detail + ")");
  console.log("PASS " + name);
}

check("sale period has explicit state", /salePeriodKind: SalePeriodKind/.test(files.staff) && /salePeriodKind: "limited"/.test(files.staff), "components/staff/staff-console.tsx");
check("sale period is radio-like single choice", /role="radiogroup" aria-label="いつ販売するか"/.test(files.staff) && /role="radio" active={salePeriodKind === "limited"}/.test(files.staff), "components/staff/staff-console.tsx");
check("limited date fields are rendered", /販売開始日/.test(files.staff) && /販売終了日/.test(files.staff) && /type="date"/.test(files.staff), "components/staff/staff-console.tsx");
check("client validates limited period", /販売開始日は販売終了日より前/.test(files.staff) && /期間限定の商品を公開するには/.test(files.staff), "components/staff/staff-console.tsx");
check("product kind choices are canonical", files.staff.includes("productKindChoices") && files.staff.includes('["churro", "チュリトス"]') && files.staff.includes('["unknown", "その他"]'), "components/staff/staff-console.tsx");
check("new product kind starts empty", /category: ""/.test(files.staff), "components/staff/staff-console.tsx");
check("legacy kind normalization prefers known kind over unknown", files.staff.includes('const known = normalized.find((item) => item !== "unknown")'), "components/staff/staff-console.tsx");
check("food save writes exactly one product kind tag", files.staff.includes("category_tags: [productKind]"), "components/staff/staff-console.tsx");
check("write API validates one product kind", files.write.includes("categoryTags.length !== 1") && files.write.includes("invalid_product_kind"), "app/api/staff/write/route.ts");
check("write API validates sale dates", /invalid_sale_period/.test(files.write) && /missing_sale_period/.test(files.write) && /salePeriodKind === "limited"/.test(files.write), "app/api/staff/write/route.ts");
check("safe error codes are exposed without internals", /SAFE_STAFF_ERROR_CODES/.test(files.shared) && /invalid_product_kind/.test(files.shared), "app/api/staff/_shared.ts");
check("upload API preserves original and returns variants", /originalPath/.test(files.upload) && /thumbnail/.test(files.upload) && /card/.test(files.upload) && /detail/.test(files.upload), "app/api/staff/upload-image/route.ts");
check("upload API uses high-quality attention crop", /sharp.strategy.attention/.test(files.upload) && /quality: 92/.test(files.upload), "app/api/staff/upload-image/route.ts");
check("upload API validates image size and MIME", /MIN_IMAGE_WIDTH = 640/.test(files.upload) && /MIN_IMAGE_HEIGHT = 480/.test(files.upload) && /image\/heic/.test(files.upload), "app/api/staff/upload-image/route.ts");
const headerSource = files.staff.slice(files.staff.indexOf("function StaffEditHeader"), files.staff.indexOf("function StaffAddFab"));
check("edit header is not sticky or fixed", /return <div className="rounded-2xl/.test(headerSource) && !/sticky|fixed/.test(headerSource), "components/staff/staff-console.tsx");
check("no zoom workaround is used", !/user-scalable=no|maximum-scale=1|zoom:\s*\d|transform:\s*scale/.test(files.staff), "components/staff/staff-console.tsx");

const input = await sharp({ create: { width: 1200, height: 900, channels: 3, background: "#f5e9ce" } }).jpeg({ quality: 95 }).toBuffer();
const output = await sharp(input).resize({ width: 960, height: 720, fit: "cover", position: sharp.strategy.attention, withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();
const meta = await sharp(output).metadata();
check("sharp can generate 4:3 card variant", meta.width === 960 && meta.height === 720, "sharp resize smoke test");
