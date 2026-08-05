import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(path) {
  return readFileSync(join(root, path), "utf8");
}
function pass(name, ok, detail) {
  return { name, ok, detail };
}

const staffConsole = read("components/staff/staff-console.tsx");
const writeRoute = read("app/api/staff/write/route.ts");
const uploadRoute = read("app/api/staff/upload-image/route.ts");
const sharedRoute = read("app/api/staff/_shared.ts");

const clientWritePattern = /\.from\([^\)]*\)\s*\.\s*(insert|update|upsert|delete)\s*\(/;
const clientStorageUploadPattern = /\.storage\s*\.\s*from\([^\)]*\)\s*\.\s*upload\s*\(/;
const relativeStaffFetchPattern = /fetch\(\s*["']\/api\/staff\//;

const operations = [
  "food.save",
  "food.seasonal",
  "food.storeLinks",
  "food.softDelete",
  "food.hardDelete",
  "store.save",
  "store.softDelete",
  "store.hardDelete",
  "area.save",
  "area.softDelete",
  "area.hardDelete",
  "collection.save",
  "collection.softDelete",
  "collection.hardDelete",
  "staff.role",
  "staff.active"
];

const checks = [
  pass("staff console has no direct table insert/update/upsert/delete", !clientWritePattern.test(staffConsole), "components/staff/staff-console.tsx"),
  pass("staff console has no direct storage upload", !clientStorageUploadPattern.test(staffConsole), "components/staff/staff-console.tsx"),
  pass("staff console writes through /api/staff/write", /staffWrite\("food\.save"/.test(staffConsole) && /staffWrite\("store\.save"/.test(staffConsole) && /staffWrite\("area\.save"/.test(staffConsole) && /staffWrite\("collection\.save"/.test(staffConsole), "components/staff/staff-console.tsx"),
  pass("staff console uploads through /api/staff/upload-image", /staffApiUrl\("\/api\/staff\/upload-image"/.test(staffConsole), "components/staff/staff-console.tsx"),
  pass("staff console uses absolute staff API resolver", /staffApiUrl\("\/api\/staff\/write"/.test(staffConsole) && !relativeStaffFetchPattern.test(staffConsole), "components/staff/staff-console.tsx"),
  pass("write route requires staff AAL2", /requireStaffApi\(request, "editor"/.test(writeRoute) && /aal2_required/.test(sharedRoute), "app/api/staff/write/route.ts"),
  pass("write route has all expected operations", operations.every((operation) => writeRoute.includes('"' + operation + '"')), "app/api/staff/write/route.ts"),
  pass("owner-only operations enforced by API", /OWNER_ONLY/.test(writeRoute) && /owner_required/.test(writeRoute), "app/api/staff/write/route.ts"),
  pass("write route revalidates public catalog paths", /revalidatePath\("\/foods"\)/.test(writeRoute) && /revalidatePath\("\/stores"\)/.test(writeRoute) && /revalidatePath\("\/areas"\)/.test(writeRoute), "app/api/staff/write/route.ts"),
  pass("upload route validates MIME and size", /IMAGE_TYPES/.test(uploadRoute) && /MAX_IMAGE_BYTES/.test(uploadRoute) && /image\/jpeg/.test(uploadRoute), "app/api/staff/upload-image/route.ts"),
  pass("upload route keeps service role out", !/SUPABASE_SERVICE_ROLE_KEY|service_role|sb_secret/i.test(uploadRoute + writeRoute + sharedRoute), "app/api/staff")
];

let failed = 0;
for (const check of checks) {
  if (check.ok) {
    console.log("PASS " + check.name);
  } else {
    failed += 1;
    console.error("FAIL " + check.name + " (" + check.detail + ")");
  }
}
if (failed > 0) process.exit(1);
