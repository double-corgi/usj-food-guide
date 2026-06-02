import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

type Check = {
  id: string;
  label: string;
  ok: boolean;
  evidence?: string;
};

const root = process.cwd();
const dataset = readJson<GeneratedDataset>("scripts/output/foods.generated.json");
const packageJson = readJson<{ scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>("package.json");
const visibleFoods = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.status !== "inactive" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl)
);

const requiredFiles = [
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/contact/page.tsx",
  "app/disclaimer/page.tsx",
  "app/about/page.tsx",
  "app/security/page.tsx",
  "app/commercial-disclosure/page.tsx",
  "app/error.tsx",
  "app/global-error.tsx",
  "app/not-found.tsx",
  "components/analytics-tracker.tsx",
  "lib/observability.ts",
  "proxy.ts",
  "next.config.mjs",
  "capacitor.config.ts",
  "public/manifest.webmanifest",
  "public/sw.js",
  "docs/mobile-release.md",
  "docs/domain-setup.md",
  "docs/observability.md",
  "docs/app-review-readiness.md",
  "docs/app-store-listing-ja.md",
  "docs/google-play-listing-ja.md",
  "docs/data-privacy-audit.md",
  "docs/store-assets.md"
];

const fileChecks: Check[] = requiredFiles.map((file) => ({
  id: `file:${file}`,
  label: `${file} exists`,
  ok: fs.existsSync(path.join(root, file))
}));

const envExample = readText(".env.example");
const privacy = readText("app/privacy/page.tsx");
const terms = readText("app/terms/page.tsx");
const contactAction = readText("app/contact/actions.ts");
const requestAction = readText("app/request/actions.ts");
const nextConfig = readText("next.config.mjs");
const proxy = readText("proxy.ts");
const observability = readText("lib/observability.ts");
const layout = readText("app/layout.tsx");
const mobileRelease = readText("docs/mobile-release.md");
const appReviewReadiness = readText("docs/app-review-readiness.md");

const imageCount = visibleFoods.filter((food) => {
  const hasImageUrl = Boolean(food.imageUrl || food.representativeImageUrl);
  const hasEnabledImage = (food.images ?? []).some((image) => image.enabled !== false && image.imageUrl);
  return hasImageUrl || hasEnabledImage;
}).length;
const placeholderCount = visibleFoods.filter((food) => {
  const image = food.representativeImageUrl || food.imageUrl || food.images?.find((item) => item.enabled !== false)?.imageUrl || "";
  return image.startsWith("/placeholders/");
}).length;

const checks: Check[] = [
  ...fileChecks,
  {
    id: "data:foods",
    label: "food count is >= 200",
    ok: visibleFoods.length >= 200,
    evidence: `${visibleFoods.length} visible foods`
  },
  {
    id: "data:images",
    label: "image count is >= 200",
    ok: imageCount >= 200,
    evidence: `${imageCount} foods with image`
  },
  {
    id: "data:placeholder",
    label: "placeholder count is 0",
    ok: placeholderCount === 0,
    evidence: `${placeholderCount} placeholders`
  },
  {
    id: "legal:privacy",
    label: "privacy page covers unofficial app, localStorage, submissions, ads, analytics, Sentry",
    ok: includesAll(privacy, ["公式アプリではありません", "localStorage", "発見報告", "広告", "NEXT_PUBLIC_ANALYTICS_ENDPOINT", "NEXT_PUBLIC_SENTRY_DSN"])
  },
  {
    id: "legal:terms",
    label: "terms page covers non-official status, prohibited conduct, disclaimer, intellectual property, governing law",
    ok: includesAll(terms, ["公式サービスではありません", "禁止事項", "免責", "知的財産", "日本法"])
  },
  {
    id: "form:contact-security",
    label: "contact form has honeypot, rate limit, blocked markup, length limits",
    ok: includesAll(contactAction, ["isHoneypotFilled", "isTooFast", "canSubmitContact", "hasBlockedMarkup", "readLimitedField"])
  },
  {
    id: "form:request-security",
    label: "request form has honeypot, rate limit, URL validation, blocked markup, length limits",
    ok: includesAll(requestAction, ["isHoneypotFilled", "isTooFast", "isHttpUrl", "hasBlockedMarkup", "readLimitedField"])
  },
  {
    id: "security:headers",
    label: "security headers include CSP, frame, content type, referrer, permissions policy",
    ok: includesAll(nextConfig, ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"])
  },
  {
    id: "security:admin-lock",
    label: "admin routes are protected outside localhost by ADMIN_ACCESS_KEY",
    ok: includesAll(proxy, ["ADMIN_ACCESS_KEY", "LOCAL_HOSTS", "/admin-locked", "matcher", "x-forwarded-host", "getRequestHostname"])
  },
  {
    id: "observability:sentry",
    label: "Sentry-compatible error reporting exists and is optional",
    ok: includesAll(observability, ["NEXT_PUBLIC_SENTRY_DSN", "captureAppError", "parseSentryDsn", "envelope"])
  },
  {
    id: "observability:analytics",
    label: "Analytics page view tracking exists and is optional",
    ok: includesAll(observability, ["NEXT_PUBLIC_ANALYTICS_ENDPOINT", "captureAnalyticsEvent"]) && layout.includes("AnalyticsTracker")
  },
  {
    id: "mobile:capacitor",
    label: "Capacitor dependencies and scripts exist",
    ok: Boolean(
      packageJson.devDependencies?.["@capacitor/core"] &&
        packageJson.devDependencies?.["@capacitor/ios"] &&
        packageJson.devDependencies?.["@capacitor/android"] &&
        packageJson.scripts?.["cap:sync"] &&
        packageJson.scripts?.["mobile:build"]
    )
  },
  {
    id: "mobile:capacitor-webdir",
    label: "Capacitor webDir exists with fallback index",
    ok:
      fs.existsSync(path.join(root, "public/capacitor-web/index.html")) &&
      readText("capacitor.config.ts").includes('webDir: "public/capacitor-web"')
  },
  {
    id: "mobile:pwa",
    label: "PWA manifest and service worker exist",
    ok: fs.existsSync(path.join(root, "public/manifest.webmanifest")) && fs.existsSync(path.join(root, "public/sw.js"))
  },
  {
    id: "env:template",
    label: "env templates include domain, admin, Sentry, Analytics, Capacitor",
    ok: includesAll(envExample, ["NEXT_PUBLIC_SITE_URL", "ADMIN_ACCESS_KEY", "NEXT_PUBLIC_SENTRY_DSN", "NEXT_PUBLIC_ANALYTICS_ENDPOINT", "CAPACITOR_SERVER_URL"])
  },
  {
    id: "docs:domain-review",
    label: "domain and review readiness docs describe human final inputs",
    ok: includesAll(mobileRelease, ["NEXT_PUBLIC_SITE_URL", "ADMIN_ACCESS_KEY"]) && includesAll(appReviewReadiness, ["App Store提出可能判定", "Google Play提出可能判定", "運営開始可能判定"])
  }
];

const failed = checks.filter((check) => !check.ok);
const codeReady = failed.length === 0;
const humanInputs = [
  "独自ドメインを確定しNEXT_PUBLIC_SITE_URLへ設定する",
  "本番環境にADMIN_ACCESS_KEYを設定する",
  "App Store Connect / Google Play Consoleへ事業者・サポートURL・審査情報を入力する",
  "Sentry / Analyticsを有効化する場合はDSN/endpointとストア申告を最終反映する"
];

const readiness = {
  appStore: {
    judgment: codeReady ? "コード側は提出準備完了。App Store Connectの人間入力後に提出可能。" : "未達。失敗チェックの修正が必要。",
    codeReady,
    humanRequired: codeReady,
    requiredHumanInputs: [
      "Apple Developer Program / App Store ConnectでBundle ID、署名、年齢区分、App Privacyを入力する",
      "本番独自ドメインのPrivacy Policy URL、Support URL、Marketing URLを設定する",
      "Sentry / Analyticsを有効化する場合はApp Privacy申告へ反映する"
    ]
  },
  googlePlay: {
    judgment: codeReady ? "コード側は提出準備完了。Google Play Consoleの人間入力後に提出可能。" : "未達。失敗チェックの修正が必要。",
    codeReady,
    humanRequired: codeReady,
    requiredHumanInputs: [
      "Play Consoleでpackage name、target SDK、Data safety、サポート連絡先を入力する",
      "本番独自ドメインのPrivacy policy URLを設定する",
      "Sentry / Analyticsを有効化する場合はData safetyへ反映する"
    ]
  },
  operations: {
    judgment: codeReady ? "運営基盤のコードは開始可能。本番環境変数と管理フロー確認後に運営開始可能。" : "未達。失敗チェックの修正が必要。",
    codeReady,
    humanRequired: codeReady,
    requiredHumanInputs: [
      "本番環境にADMIN_ACCESS_KEYを設定する",
      "NEXT_PUBLIC_SITE_URLを本番独自ドメインへ設定する",
      "問い合わせ、発見報告、削除依頼の対応担当と運用手順を確定する"
    ]
  }
};

const result = {
  generatedAt: new Date().toISOString(),
  codeReady,
  data: {
    foodCount: visibleFoods.length,
    imageCount,
    placeholderCount,
    priceKnown: visibleFoods.filter((food) => Boolean(food.price || food.priceMin)).length,
    priceUnknown: visibleFoods.filter((food) => !food.price && !food.priceMin).length
  },
  verdict: {
    appStore: codeReady ? "code_ready_human_store_inputs_required" : "not_ready",
    googlePlay: codeReady ? "code_ready_human_store_inputs_required" : "not_ready",
    operations: codeReady ? "code_ready_env_configuration_required" : "not_ready"
  },
  readiness,
  humanInputs,
  failed,
  checks
};

const outputPath = path.join(root, "scripts", "output", "release-readiness.generated.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
writeMarkdownReport(result);
console.log(JSON.stringify({ outputPath, codeReady, verdict: result.verdict, failed: failed.map((check) => check.id), data: result.data }, null, 2));
if (!codeReady) process.exit(1);

function readText(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function readJson<T>(file: string): T {
  return JSON.parse(readText(file)) as T;
}

function includesAll(source: string, needles: string[]) {
  return needles.every((needle) => source.includes(needle));
}

function writeMarkdownReport(report: typeof result) {
  const lines = [
    "# 公開前リリース判定",
    "",
    `生成日時: ${report.generatedAt}`,
    "",
    "## 判定",
    "",
    `- App Store: ${report.readiness.appStore.judgment}`,
    `- Google Play: ${report.readiness.googlePlay.judgment}`,
    `- 運営開始: ${report.readiness.operations.judgment}`,
    "",
    "## データ維持",
    "",
    `- food: ${report.data.foodCount}`,
    `- image: ${report.data.imageCount}`,
    `- placeholder: ${report.data.placeholderCount}`,
    `- price known: ${report.data.priceKnown}`,
    `- price unknown: ${report.data.priceUnknown}`,
    "",
    "## 人間が本番前に入力・確認する項目",
    "",
    ...report.humanInputs.map((item) => `- ${item}`),
    "",
    "## 監査結果",
    "",
    `- checks: ${report.checks.length}`,
    `- failed: ${report.failed.length}`,
    "",
    ...(report.failed.length > 0 ? report.failed.map((check) => `- ${check.id}: ${check.label}`) : ["失敗チェックなし"])
  ];
  fs.writeFileSync(path.join(root, "scripts", "output", "release-readiness.generated.md"), `${lines.join("\n")}\n`);
}
