import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { readImportData, readReviewDecisionFile } from "./review-data";
import { Summer2026ReviewClient } from "./summer-2026-review-client";
import type { ExcludedReviewItem, SourceFileInfo } from "./review-types";

export const dynamic = "force-dynamic";

const DATA_FILE = "data/imports/unicolle-summer-2026-drafts.json";
const SOURCE_FILES = [
  DATA_FILE,
  "docs/unicolle-summer-2026-import-review.md",
  "docs/unicolle-summer-2026-food-research.md",
  "data/imports/unicolle-summer-2026-review-decisions.json",
  "data/imports/unicolle-summer-2026-import-ready.json"
];

export default async function Summer2026ReviewPage() {
  const admin = await requireAdmin("viewer");
  const data = readImportData();
  const decisionFile = readReviewDecisionFile(data.items);
  const sourceFiles = readSourceFiles();
  const excludedItems = buildExcludedItems(data);
  const canSave = admin.role === "owner" || admin.role === "editor";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-black text-blue-800 underline underline-offset-4">
              <ArrowLeft size={14} aria-hidden />
              管理メニューへ戻る
            </Link>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800 ring-1 ring-blue-200">
              <ShieldCheck size={14} aria-hidden />
              管理者限定レビュー
            </p>
            <h1 className="mt-3 text-2xl font-black leading-tight text-ink sm:text-4xl">
              <span className="block sm:inline">2026年夏フード</span>
              <span className="block sm:inline">登録前レビュー</span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">
              Supabase登録前の30候補を画像付きで確認する画面です。登録、公開、承認の操作はここにはありません。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-cream px-4 py-3 text-sm font-bold text-slate-600">
            <p className="text-xs font-black text-slate-400">閲覧者</p>
            <p className="mt-1 break-all text-ink">{admin.email ?? "管理者確認済み"}</p>
            <p className="mt-1 text-blue-800">権限: {formatAdminRole(admin.role)}</p>
          </div>
        </div>
      </section>

      <Summer2026ReviewClient items={data.items} initialDecisions={decisionFile.decisions} excludedItems={excludedItems} sourceFiles={sourceFiles} canSave={canSave} />
    </div>
  );
}

function readSourceFiles(): SourceFileInfo[] {
  return SOURCE_FILES.map((relativePath) => {
    const absolutePath = path.join(process.cwd(), relativePath);
    const stat = fs.existsSync(absolutePath) ? fs.statSync(absolutePath) : null;
    return {
      path: relativePath,
      size: stat?.size ?? 0,
      updatedAt: stat?.mtime.toISOString() ?? ""
    };
  });
}

function buildExcludedItems(data: ReturnType<typeof readImportData>): ExcludedReviewItem[] {
  const excluded = data.excludedOfficialItems ?? [];
  const dave = excluded.find((item) => item.name.includes("デイブ・ポップコーンバケツ"));
  const dkMug = excluded.find((item) => item.name.includes("DK クラッシュサンデー") && item.name.includes("マグカップ付き"));
  const straps = excluded.filter((item) => item.name.includes("ボトルストラップ"));

  return [
    dave ? mapExcludedItem(dave) : null,
    dkMug ? mapExcludedItem(dkMug) : null,
    straps.length > 0
      ? {
          name: "クロミ／マイメロディのボトルストラップ単体",
          reason: uniqueText(straps.map((item) => item.reason)).join(" / "),
          sourceUrl: straps.find((item) => item.sourceUrl)?.sourceUrl ?? null,
          plannedFoodId: null,
          duplicateHandling: "単体グッズ寄りの商品として夏フード候補から除外",
          registrationPolicy: "登録しない",
          imageUrl: null,
          imageSourceUrl: null
        }
      : null
  ].filter(Boolean) as ExcludedReviewItem[];
}

function mapExcludedItem(item: NonNullable<ReturnType<typeof readImportData>["excludedOfficialItems"]>[number]): ExcludedReviewItem {
  return {
    name: item.name,
    reason: item.reason ?? "除外理由未確認",
    sourceUrl: item.sourceUrl ?? null,
    plannedFoodId: item.importReview?.plannedFoodId ?? null,
    duplicateHandling: item.importReview?.duplicateHandling ?? "除外",
    registrationPolicy: item.importReview?.registrationPolicy ?? "登録しない",
    imageUrl: item.imageUrl ?? null,
    imageSourceUrl: item.imageSourceUrl ?? null
  };
}

function uniqueText(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function formatAdminRole(role: string) {
  if (role === "owner") return "管理者";
  if (role === "editor") return "運営者";
  if (role === "viewer") return "見るだけ";
  return role;
}
