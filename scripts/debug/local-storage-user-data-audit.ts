import fs from "node:fs";
import path from "node:path";

type Check = {
  name: string;
  ok: boolean;
  detail: string;
};

type GeneratedDataset = {
  foods: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    representativeImageUrl?: string;
    images?: Array<{ imageUrl?: string; url?: string; localPath?: string }>;
    reviewStatus?: string;
    hidden?: boolean;
    canonicalFood?: boolean;
  }>;
};

const root = process.cwd();
const outputDir = path.join(root, "scripts", "output");
const checks: Check[] = [];

function file(relativePath: string) {
  return path.join(root, relativePath);
}

function exists(relativePath: string) {
  return fs.existsSync(file(relativePath));
}

function read(relativePath: string) {
  return fs.readFileSync(file(relativePath), "utf8");
}

function check(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
}

const deletedAuthFiles = [
  "components/auth-panel.tsx",
  "app/auth/callback/route.ts",
  "app/actions/user-food-logs.ts",
  "lib/repositories/user-food-logs.ts",
  "lib/user-sync-migration.ts",
  "lib/supabase-rate-limit.ts",
  "docs/supabase-user-sync.md"
];

for (const relativePath of deletedAuthFiles) {
  check(`${relativePath} removed`, !exists(relativePath), "Google/Apple/Supabase認証同期の実装ファイルを残さない");
}

const foodLogs = read("lib/use-food-logs.ts");
const foodReviews = read("lib/use-food-reviews.ts");
const localData = read("lib/local-user-data.ts");
const settingsPage = read("app/settings/page.tsx");
const settingsPanel = read("components/settings-data-panel.tsx");
const backupPanel = read("components/local-data-backup-panel.tsx");
const privacyPage = read("app/privacy/page.tsx");

check("food logs use localStorage helper", /readLocalFoodLogs/.test(foodLogs) && /writeLocalFoodLogs/.test(foodLogs), "食べた記録はlocalStorage helper経由");
check("food logs do not use Supabase auth tables", !/supabase|user_food_logs|signInWithOAuth|auth\/callback/.test(foodLogs), "食べた記録hookにSupabase認証同期なし");
check("reviews use localStorage helper", /readLocalFoodReviews/.test(foodReviews) && /writeLocalFoodReviews/.test(foodReviews), "レビューと星評価はlocalStorage helper経由");
check("reviews do not use Supabase auth tables", !/supabase|user_food_reviews|signInWithOAuth|auth\/callback/.test(foodReviews), "レビューhookにSupabase認証同期なし");
check("backup schema contains logs and reviews", /logs: UserFoodLog/.test(localData) && /reviews: LocalFoodReview/.test(localData), "バックアップJSONは食べた記録・レビュー・星評価を含む");
check("backup export implemented", /exportLocalUserData/.test(backupPanel) && /バックアップJSON/.test(backupPanel), "バックアップ出力UIあり");
check("restore implemented", /restoreLocalUserData/.test(backupPanel) && /復元/.test(backupPanel), "バックアップ復元UIあり");
check("delete all data implemented", /clearLocalUserData/.test(backupPanel) && /全データ削除/.test(backupPanel), "全データ削除UIあり");
check("settings page exposes data management", /SettingsDataPanel/.test(settingsPage) && /LocalDataBackupPanel/.test(settingsPanel), "設定画面からバックアップ・復元・削除へ到達可能");
check("privacy says no personal collection", /個人情報収集なし|個人情報を収集しません/.test(privacyPage), "プライバシーポリシーに個人情報収集なしを明記");
check("privacy says login unnecessary", /ログイン不要/.test(privacyPage), "プライバシーポリシーにログイン不要を明記");
check("privacy says local storage", /localStorage|端末内/.test(privacyPage), "プライバシーポリシーに端末内保存を明記");
check("privacy says ads update policy", /広告/.test(privacyPage) && /更新/.test(privacyPage), "広告導入時のポリシー更新を明記");
check("Google auth not implemented", !exists("app/auth/callback/route.ts") && !/signInWithOAuth[\s\S]*google|Googleでログイン/.test(foodLogs + foodReviews), "Google認証未実装");
check("Apple auth not implemented", !exists("app/auth/callback/route.ts") && !/signInWithOAuth[\s\S]*apple|Appleでログイン/.test(foodLogs + foodReviews), "Apple認証未実装");
check("Supabase auth not implemented for user records", !/user_food_logs|user_food_reviews|claim_user_action_rate_limit/.test(foodLogs + foodReviews + localData), "ユーザー記録のSupabase認証同期なし");

const dataset = JSON.parse(read("scripts/output/foods.generated.json")) as GeneratedDataset;
const foods = dataset.foods.filter((food) => food.reviewStatus !== "rejected" && !food.hidden && food.canonicalFood !== false);
const imageCount = foods.filter((food) => {
  const image = food.representativeImageUrl ?? food.imageUrl ?? food.images?.[0]?.imageUrl ?? food.images?.[0]?.url ?? food.images?.[0]?.localPath ?? "";
  return image && !image.startsWith("/placeholders/");
}).length;
const placeholderCount = foods.length - imageCount;

check("food count preserved", foods.length >= 200, `${foods.length} foods`);
check("image count preserved", imageCount >= 200, `${imageCount} images`);
check("placeholder remains zero", placeholderCount === 0, `${placeholderCount} placeholders`);

const forbiddenRuntimePatterns = [
  "signInWithOAuth",
  "Googleでログイン",
  "Appleでログイン",
  "AuthPanel",
  "/auth/callback",
  "user_food_logs",
  "user_food_reviews",
  "claim_user_action_rate_limit"
];
const runtimeTargets = [
  "app",
  "components",
  "lib",
  "supabase/schema.sql",
  "supabase/migrations"
];
const forbiddenMatches: Array<{ file: string; pattern: string }> = [];

function walk(target: string) {
  if (
    target.startsWith("app/privacy") ||
    target.startsWith("app/terms") ||
    target.startsWith("app/disclaimer") ||
    target.startsWith("app/security")
  ) {
    return;
  }
  const absolute = file(target);
  if (!fs.existsSync(absolute)) return;
  const stat = fs.statSync(absolute);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(absolute)) {
      if (child === ".next" || child === "node_modules") continue;
      walk(path.join(target, child));
    }
    return;
  }
  if (!/\.(ts|tsx|sql)$/.test(target)) return;
  const content = fs.readFileSync(absolute, "utf8");
  for (const pattern of forbiddenRuntimePatterns) {
    if (content.includes(pattern)) forbiddenMatches.push({ file: target, pattern });
  }
}

for (const target of runtimeTargets) walk(target);
check("no auth-sync runtime references", forbiddenMatches.length === 0, JSON.stringify(forbiddenMatches.slice(0, 20)));

const result = {
  generatedAt: new Date().toISOString(),
  summary: {
    ok: checks.every((item) => item.ok),
    foodCount: foods.length,
    imageCount,
    placeholderCount,
    googleAuthImplemented: false,
    appleAuthImplemented: false,
    supabaseAuthImplementedForUserRecords: false,
    storage: "localStorage"
  },
  checks
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "local-storage-user-data-audit.generated.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));

if (!result.summary.ok) {
  process.exitCode = 1;
}
