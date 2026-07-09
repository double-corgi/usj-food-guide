import fs from "node:fs";
import { normalizeFoodName } from "../lib/food-utils";
import { buildManualFoodId } from "../lib/repositories/manual-foods";
import { readGeneratedFoods } from "../lib/repositories/generated-data";
import { createServiceSupabaseClient } from "../lib/supabase-server";
import type { Database, Json } from "../types/database";
import type { FoodCategory } from "../types/domain";
import type { ReviewDecision, ReviewPriceVariant } from "../app/admin/summer-2026-review/review-types";

type ImportReadyFile = {
  schemaVersion: 1;
  sourceDecisionFile: string;
  generatedAt: string;
  itemCount: number;
  items: ReviewDecision[];
};

type Supabase = NonNullable<ReturnType<typeof createServiceSupabaseClient>>;
type ImportResult = {
  foodId: string;
  name: string;
  targetType: string;
  action: string;
  status: "inserted" | "updated" | "skipped";
  details: string[];
};

const IMPORT_READY_FILE = "data/imports/unicolle-summer-2026-import-ready.json";
const REPORT_FILE = "docs/unicolle-summer-2026-auto-verification-result.md";
const FINAL_IMPORT_REPORT_FILE = "docs/unicolle-summer-2026-final-import-result.md";
const actorEmail = "summer-2026-auto-import";
const now = new Date().toISOString();
const cliDryRun = process.argv.includes("--dry-run");

type ImportRunOptions = {
  dryRun?: boolean;
  writeReports?: boolean;
};

export async function runSummer2026Import(options: ImportRunOptions = {}) {
  const runDryRun = options.dryRun ?? cliDryRun;
  const writeReports = options.writeReports ?? true;
  const importReady = readJson<ImportReadyFile>(IMPORT_READY_FILE);
  validateImportReady(importReady);

  if (importReady.items.length === 0) {
    if (writeReports) appendImportResult([], "import-readyが0件のためSupabase書き込みなし。");
    return { importReady: 0, inserted: 0, updated: 0, skipped: 0, wroteSupabase: false, issues: [] as string[] };
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("Supabase service role settings are missing; import stopped before writes.");

  const before = await readImportSnapshot(supabase, importReady.items);
  const databaseBefore = await readDatabaseCounts(supabase);

  if (runDryRun) {
    const dryRunVerification = await verifyImportState(supabase, importReady.items);
    if (writeReports) writeFinalImportReport({
      mode: "dry-run",
      importReady,
      results: [],
      before,
      after: before,
      databaseBefore,
      databaseAfter: databaseBefore,
      verification: dryRunVerification,
      skippedReason: "dry-runのためSupabase書き込みなし。"
    });
    return {
      mode: "dry-run",
      importReady: importReady.items.length,
      newItems: importReady.items.filter((item) => item.targetType === "new").length,
      existingItems: importReady.items.filter((item) => item.targetType === "existing").length,
      approved: importReady.items.filter((item) => item.editedData.reviewStatus === "approved").length,
      pending: importReady.items.filter((item) => item.editedData.reviewStatus === "pending").length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      wroteSupabase: false,
      issues: dryRunVerification.issues,
      before,
      after: before,
      databaseBefore,
      databaseAfter: databaseBefore,
      verification: dryRunVerification
    };
  }

  await ensureSummerCollection(supabase);
  const results: ImportResult[] = [];
  for (const decision of importReady.items) {
    results.push(await importDecision(supabase, decision));
  }
  const after = await readImportSnapshot(supabase, importReady.items);
  const databaseAfter = await readDatabaseCounts(supabase);
  const verification = await verifyImportState(supabase, importReady.items);
  if (writeReports) appendImportResult(results, buildSnapshotSummary(before, after));
  if (writeReports) writeFinalImportReport({
    mode: "import",
    importReady,
    results,
    before,
    after,
    databaseBefore,
    databaseAfter,
    verification
  });

  return {
    mode: "import",
    importReady: importReady.items.length,
    newItems: importReady.items.filter((item) => item.targetType === "new").length,
    existingItems: importReady.items.filter((item) => item.targetType === "existing").length,
    approved: importReady.items.filter((item) => item.editedData.reviewStatus === "approved").length,
    pending: importReady.items.filter((item) => item.editedData.reviewStatus === "pending").length,
    inserted: results.filter((result) => result.status === "inserted").length,
    updated: results.filter((result) => result.status === "updated").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    wroteSupabase: results.length > 0,
    issues: verification.issues,
    results,
    before,
    after,
    databaseBefore,
    databaseAfter,
    verification
  };
}

async function importDecision(supabase: Supabase, decision: ReviewDecision): Promise<ImportResult> {
  const foodId = resolveFoodId(decision);
  if (decision.targetType === "new") {
    return importNewManualFood(supabase, decision, foodId);
  }
  return importExistingFoodUpdates(supabase, decision, foodId);
}

async function importNewManualFood(supabase: Supabase, decision: ReviewDecision, foodId: string): Promise<ImportResult> {
  const existing = await supabase.from("manual_foods").select("id").eq("id", foodId).maybeSingle();
  if (existing.error) throw new Error(`manual_foods確認失敗 ${foodId}: ${existing.error.message}`);

  const payload: Database["public"]["Tables"]["manual_foods"]["Insert"] = {
    id: foodId,
    name: decision.editedData.name,
    normalized_name: normalizeFoodName(decision.editedData.name),
    name_en: null,
    category: normalizeCategory(decision.editedData.category),
    category_tags: Array.from(new Set([normalizeCategory(decision.editedData.category), "seasonal"])),
    price: decision.editedData.price,
    area_name: decision.editedData.areaName,
    shop_name: decision.editedData.shopName,
    sale_status: "active",
    public_state: "published",
    hidden: false,
    start_date: null,
    end_date: null,
    image_url: decision.editedData.imageUrl,
    source_url: decision.editedData.sourceUrl || decision.editedData.officialReferenceUrls[0] || "summer-2026-auto-import",
    admin_notes: decision.reviewerNote,
    created_by: actorEmail,
    updated_by: actorEmail,
    created_at: now,
    updated_at: now
  };

  if (existing.data) {
    const { created_at: _createdAt, created_by: _createdBy, ...updatePayload } = payload;
    const update = await supabase.from("manual_foods").update(updatePayload).eq("id", foodId);
    if (update.error) throw new Error(`manual_foods更新失敗 ${foodId}: ${update.error.message}`);
    await saveFoundation(supabase, decision, foodId);
    return { foodId, name: decision.editedData.name, targetType: "new", action: "manual_foods update", status: "updated", details: ["manual_foods既存行を冪等更新"] };
  }

  const insert = await supabase.from("manual_foods").insert(payload);
  if (insert.error) throw new Error(`manual_foods追加失敗 ${foodId}: ${insert.error.message}`);
  await saveFoundation(supabase, decision, foodId);
  return { foodId, name: decision.editedData.name, targetType: "new", action: "manual_foods insert", status: "inserted", details: ["manual_foodsへ新規追加"] };
}

async function importExistingFoodUpdates(supabase: Supabase, decision: ReviewDecision, foodId: string): Promise<ImportResult> {
  const generatedExists = readGeneratedFoods({ includeHidden: true }).some((food) => food.id === foodId);
  const manualExists = await supabase.from("manual_foods").select("id").eq("id", foodId).maybeSingle();
  if (manualExists.error) throw new Error(`既存food確認失敗 ${foodId}: ${manualExists.error.message}`);
  if (!generatedExists && !manualExists.data) throw new Error(`既存foodIdが見つかりません: ${foodId}`);

  const details = await saveFoundation(supabase, decision, foodId);
  await upsertOverride(supabase, decision, foodId);
  details.push("food_overridesを冪等upsert");
  return { foodId, name: decision.editedData.name, targetType: "existing", action: decision.duplicateAction, status: "updated", details };
}

async function saveFoundation(supabase: Supabase, decision: ReviewDecision, foodId: string) {
  const details: string[] = [];
  const collectionId = decision.editedData.collectionId || "summer-2026";
  const membership = await supabase.from("food_collection_memberships").select("food_id").eq("food_id", foodId).eq("collection_id", collectionId).maybeSingle();
  if (membership.error) throw new Error(`collection確認失敗 ${foodId}: ${membership.error.message}`);
  if (!membership.data) {
    const insert = await supabase.from("food_collection_memberships").insert({ food_id: foodId, collection_id: collectionId, created_at: now });
    if (insert.error) throw new Error(`collection追加失敗 ${foodId}: ${insert.error.message}`);
    details.push(`collection ${collectionId} 追加`);
  } else {
    details.push(`collection ${collectionId} 既存`);
  }

  const metadata = await supabase.from("food_publication_metadata").upsert(
    {
      food_id: foodId,
      review_status: decision.editedData.reviewStatus === "approved" ? "approved" : "pending",
      published_at: null,
      updated_at: now
    },
    { onConflict: "food_id" }
  );
  if (metadata.error) throw new Error(`publication metadata保存失敗 ${foodId}: ${metadata.error.message}`);
  const clearPublishedAt = await supabase.from("food_publication_metadata").update({ published_at: null, updated_at: now }).eq("food_id", foodId);
  if (clearPublishedAt.error) throw new Error(`published_at null化失敗 ${foodId}: ${clearPublishedAt.error.message}`);
  details.push("publication metadata保存、published_at null");

  await saveVariants(supabase, foodId, decision.editedData.priceVariants, decision.editedData.price, decision.editedData.sourceUrl || decision.editedData.officialReferenceUrls[0] || null);
  details.push("food_variants冪等保存");
  const revisionInserted = await insertRevision(supabase, foodId, decision, "summer-2026-auto-import");
  details.push(revisionInserted ? "food_override_revisionsへ履歴追加" : "food_override_revisionsは同一内容のため追加なし");
  return details;
}

async function saveVariants(supabase: Supabase, foodId: string, variants: ReviewPriceVariant[], fallbackPrice: number | null, sourceUrl: string | null) {
  const rows = normalizeVariants(variants, fallbackPrice, sourceUrl);
  const existing = await supabase.from("food_variants").select("*").eq("food_id", foodId);
  if (existing.error) throw new Error(`variant確認失敗 ${foodId}: ${existing.error.message}`);

  const remove = await supabase.from("food_variants").delete().eq("food_id", foodId);
  if (remove.error) throw new Error(`variant削除失敗 ${foodId}: ${remove.error.message}`);
  if (rows.length === 0) return;
  const insert = await supabase.from("food_variants").insert(rows.map((row) => ({ ...row, food_id: foodId })));
  if (insert.error) throw new Error(`variant追加失敗 ${foodId}: ${insert.error.message}`);
}

function normalizeVariants(variants: ReviewPriceVariant[], fallbackPrice: number | null, sourceUrl: string | null) {
  const sourceRows = variants.length > 0 ? variants : [{ label: "通常", price: fallbackPrice, source: sourceUrl }];
  return sourceRows.map((variant, index) => ({
    label: variant.label || (index === 0 ? "通常" : `variant-${index + 1}`),
    price: variant.price ?? fallbackPrice,
    is_default: index === 0,
    sort_order: (index + 1) * 10,
    source_url: variant.source ?? sourceUrl,
    last_checked_at: now,
    updated_at: now
  }));
}

async function upsertOverride(supabase: Supabase, decision: ReviewDecision, foodId: string) {
  const payload: Database["public"]["Tables"]["food_overrides"]["Insert"] = {
    food_id: foodId,
    name: decision.editedData.name,
    price: decision.editedData.price,
    area_name: decision.editedData.areaName,
    shop_name: decision.editedData.shopName,
    category: normalizeCategory(decision.editedData.category),
    category_tags: Array.from(new Set([normalizeCategory(decision.editedData.category), "seasonal"])),
    image_path: decision.editedData.imageUrl || null,
    image_source_url: decision.editedData.imageSourceUrl || null,
    info_source_url: decision.editedData.sourceUrl || decision.editedData.officialReferenceUrls[0] || null,
    hidden: decision.editedData.reviewStatus === "approved" ? false : null,
    sale_status: "active",
    status: "active",
    admin_source_type: "summer-2026-auto-import",
    admin_confidence: decision.editedData.reviewStatus === "approved" ? "high" : "medium",
    admin_notes: decision.reviewerNote,
    is_deleted: false,
    updated_by: actorEmail,
    updated_at: now
  };
  const result = await supabase.from("food_overrides").upsert(payload, { onConflict: "food_id" });
  if (result.error) throw new Error(`food_overrides保存失敗 ${foodId}: ${result.error.message}`);
}

async function insertRevision(supabase: Supabase, foodId: string, decision: ReviewDecision, action: string) {
  const latest = await supabase.from("food_override_revisions").select("version").eq("food_id", foodId).order("version", { ascending: false }).limit(1).maybeSingle();
  if (latest.error) throw new Error(`revision version確認失敗 ${foodId}: ${latest.error.message}`);
  const importKey = buildImportKey(foodId, decision);
  const latestSnapshot = await supabase.from("food_override_revisions").select("snapshot").eq("food_id", foodId).eq("action", action).order("version", { ascending: false }).limit(1).maybeSingle();
  if (!latestSnapshot.error && latestSnapshot.data && readSnapshotImportKey(latestSnapshot.data.snapshot) === importKey) return false;
  const version = (latest.data?.version ?? 0) + 1;
  const result = await supabase.from("food_override_revisions").insert({
    food_id: foodId,
    version,
    action,
    actor_email: actorEmail,
    snapshot: JSON.parse(JSON.stringify({ source: "summer-2026-auto-import", importKey, decision })) as Json
  });
  if (result.error) throw new Error(`revision追加失敗 ${foodId}: ${result.error.message}`);
  return true;
}

function validateImportReady(importReady: ImportReadyFile) {
  if (importReady.itemCount !== importReady.items.length) throw new Error("import-ready itemCount mismatch");
  const ids = new Set<string>();
  for (const decision of importReady.items) {
    if (decision.decision !== "register") throw new Error(`register以外が含まれています: ${decision.editedData.name}`);
    if (decision.editedData.reviewStatus !== "approved" && decision.editedData.reviewStatus !== "pending") throw new Error(`reviewStatusが不正です: ${decision.editedData.name}`);
    if (decision.editedData.reviewStatus === "approved" && decision.imageReview !== "confirmed") throw new Error(`approvedなのに画像confirmedではありません: ${decision.editedData.name}`);
    if (decision.editedData.reviewStatus === "approved" && !decision.editedData.imageUrl) throw new Error(`approvedなのに画像URLがありません: ${decision.editedData.name}`);
    if (decision.targetType === "existing" && !decision.existingFoodId) throw new Error(`existingFoodIdなし: ${decision.editedData.name}`);
    const foodId = resolveFoodId(decision);
    if (ids.has(foodId)) throw new Error(`foodId重複: ${foodId}`);
    ids.add(foodId);
  }
}

async function readImportSnapshot(supabase: Supabase, decisions: ReviewDecision[]) {
  const ids = decisions.map(resolveFoodId);
  if (ids.length === 0) return { manual: 0, memberships: 0, metadata: 0, variants: 0 };
  const [manual, memberships, metadata, variants] = await Promise.all([
    supabase.from("manual_foods").select("id").in("id", ids),
    supabase.from("food_collection_memberships").select("food_id").in("food_id", ids),
    supabase.from("food_publication_metadata").select("food_id").in("food_id", ids),
    supabase.from("food_variants").select("food_id").in("food_id", ids)
  ]);
  for (const result of [manual, memberships, metadata, variants]) {
    if (result.error) throw new Error(`snapshot確認失敗: ${result.error.message}`);
  }
  return {
    manual: manual.data?.length ?? 0,
    memberships: memberships.data?.length ?? 0,
    metadata: metadata.data?.length ?? 0,
    variants: variants.data?.length ?? 0
  };
}

async function readDatabaseCounts(supabase: Supabase) {
  const [manual, memberships, metadata, variants, overrides, revisions, collections] = await Promise.all([
    countRows(supabase, "manual_foods"),
    countRows(supabase, "food_collection_memberships"),
    countRows(supabase, "food_publication_metadata"),
    countRows(supabase, "food_variants"),
    countRows(supabase, "food_overrides"),
    countRows(supabase, "food_override_revisions"),
    countRows(supabase, "collections")
  ]);
  return { manual, memberships, metadata, variants, overrides, revisions, collections };
}

async function countRows(
  supabase: Supabase,
  table: "manual_foods" | "food_collection_memberships" | "food_publication_metadata" | "food_variants" | "food_overrides" | "food_override_revisions" | "collections"
) {
  const result = await supabase.from(table).select("*", { count: "exact", head: true });
  if (result.error) throw new Error(`${table}件数確認失敗: ${result.error.message}`);
  return result.count ?? 0;
}

function buildSnapshotSummary(before: Record<string, number>, after: Record<string, number>) {
  return `登録前後件数: manual ${before.manual}->${after.manual}, memberships ${before.memberships}->${after.memberships}, metadata ${before.metadata}->${after.metadata}, variants ${before.variants}->${after.variants}`;
}

function resolveFoodId(decision: ReviewDecision) {
  if (decision.targetType === "existing") return decision.existingFoodId ?? "";
  return buildManualFoodId(decision.editedData.areaName, decision.editedData.shopName, decision.editedData.name);
}

async function ensureSummerCollection(supabase: Supabase) {
  const result = await supabase.from("collections").upsert(
    {
      id: "summer-2026",
      name: "2026 サマーコレクション",
      season_type: "summer",
      starts_on: "2026-07-01",
      ends_on: "2026-08-26",
      accent_color: "#38b6c9",
      is_featured: true,
      sort_order: 100,
      updated_at: now
    },
    { onConflict: "id" }
  );
  if (result.error) throw new Error(`summer-2026 collection保存失敗: ${result.error.message}`);
}

function normalizeCategory(value: string | null | undefined): FoodCategory {
  if (!value) return "unknown";
  if (value === "meal") return "set";
  if (value === "pasta") return "noodle";
  if (value === "dessert_drink") return "drink";
  return value as FoodCategory;
}

function buildImportKey(foodId: string, decision: ReviewDecision) {
  return [
    foodId,
    decision.editedData.reviewStatus,
    decision.editedData.name,
    decision.editedData.price ?? "",
    decision.editedData.imageUrl,
    decision.editedData.collectionId,
    decision.editedData.priceVariants.map((variant) => `${variant.label}:${variant.price ?? ""}`).join(",")
  ].join("|");
}

function readSnapshotImportKey(snapshot: Json) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const value = (snapshot as { importKey?: unknown }).importKey;
  return typeof value === "string" ? value : null;
}

function appendImportResult(results: ImportResult[], summary: string) {
  const lines = [
    "",
    "## 自動登録実行結果",
    "",
    `- 実行日時: ${now}`,
    `- 対象件数: ${results.length}`,
    `- ${summary}`
  ];
  for (const result of results) {
    lines.push(`- ${result.name} (${result.foodId}): ${result.status} / ${result.details.join(", ")}`);
  }
  fs.appendFileSync(REPORT_FILE, `${lines.join("\n")}\n`, "utf8");
}

async function verifyImportState(supabase: Supabase, decisions: ReviewDecision[]) {
  const ids = decisions.map(resolveFoodId);
  const issues: string[] = [];
  if (ids.length === 0) return { issues, statusCounts: {}, publishedAtCount: 0, hiddenManualCount: 0, duplicateMemberships: [], duplicateDefaultVariants: [] };

  const [manual, memberships, metadata, variants] = await Promise.all([
    supabase.from("manual_foods").select("id,name,hidden").in("id", ids),
    supabase.from("food_collection_memberships").select("food_id,collection_id").in("food_id", ids),
    supabase.from("food_publication_metadata").select("food_id,review_status,published_at").in("food_id", ids),
    supabase.from("food_variants").select("food_id,label,is_default").in("food_id", ids)
  ]);
  for (const result of [manual, memberships, metadata, variants]) {
    if (result.error) throw new Error(`登録後検証失敗: ${result.error.message}`);
  }

  const membershipKeys = new Map<string, number>();
  for (const row of memberships.data ?? []) {
    const key = `${row.food_id}:${row.collection_id}`;
    membershipKeys.set(key, (membershipKeys.get(key) ?? 0) + 1);
  }
  const duplicateMemberships = [...membershipKeys.entries()].filter(([, count]) => count > 1).map(([key]) => key);
  if (duplicateMemberships.length > 0) issues.push(`membership重複: ${duplicateMemberships.join(", ")}`);

  const defaultCounts = new Map<string, number>();
  for (const row of variants.data ?? []) {
    if (row.is_default) defaultCounts.set(row.food_id, (defaultCounts.get(row.food_id) ?? 0) + 1);
  }
  const duplicateDefaultVariants = [...defaultCounts.entries()].filter(([, count]) => count > 1).map(([foodId]) => foodId);
  if (duplicateDefaultVariants.length > 0) issues.push(`default variant重複: ${duplicateDefaultVariants.join(", ")}`);

  const metadataById = new Map((metadata.data ?? []).map((row) => [row.food_id, row]));
  for (const decision of decisions) {
    const foodId = resolveFoodId(decision);
    const row = metadataById.get(foodId);
    if (!row) issues.push(`publication metadataなし: ${foodId}`);
    if (row?.published_at) issues.push(`published_atあり: ${foodId}`);
    if (row?.review_status !== decision.editedData.reviewStatus) issues.push(`reviewStatus不一致: ${foodId}`);
  }

  const statusCounts = (metadata.data ?? []).reduce<Record<string, number>>((acc, row) => {
    const status = row.review_status ?? "null";
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const publishedAtCount = (metadata.data ?? []).filter((row) => Boolean(row.published_at)).length;
  const hiddenManualCount = (manual.data ?? []).filter((row) => row.hidden).length;
  return { issues, statusCounts, publishedAtCount, hiddenManualCount, duplicateMemberships, duplicateDefaultVariants };
}

function writeFinalImportReport(input: {
  mode: "dry-run" | "import";
  importReady: ImportReadyFile;
  results: ImportResult[];
  before: Record<string, number>;
  after: Record<string, number>;
  databaseBefore: Record<string, number>;
  databaseAfter: Record<string, number>;
  verification: Awaited<ReturnType<typeof verifyImportState>>;
  skippedReason?: string;
}) {
  const { importReady, results, before, after, databaseBefore, databaseAfter, verification } = input;
  const newItems = importReady.items.filter((item) => item.targetType === "new");
  const existingItems = importReady.items.filter((item) => item.targetType === "existing");
  const approvedItems = importReady.items.filter((item) => item.editedData.reviewStatus === "approved");
  const pendingItems = importReady.items.filter((item) => item.editedData.reviewStatus === "pending");
  const lines = [
    "# 2026年夏フード 本番import結果",
    "",
    `- 実行日時: ${now}`,
    `- 実行モード: ${input.mode === "dry-run" ? "dry-run（書き込みなし）" : "本番import"}`,
    `- import-ready件数: ${importReady.items.length}`,
    `- 実登録処理件数: ${results.length}`,
    `- 新規商品予定: ${newItems.length}`,
    `- 既存商品追記予定: ${existingItems.length}`,
    `- approved予定: ${approvedItems.length}`,
    `- pending予定: ${pendingItems.length}`,
    `- スキップ理由: ${input.skippedReason ?? (results.length === importReady.items.length ? "なし" : "一部は既存行の冪等更新")}`,
    "",
    "## 登録前後スナップショット",
    "",
    `- import対象 manual_foods: ${before.manual} -> ${after.manual}`,
    `- import対象 memberships: ${before.memberships} -> ${after.memberships}`,
    `- import対象 publication metadata: ${before.metadata} -> ${after.metadata}`,
    `- import対象 variants: ${before.variants} -> ${after.variants}`,
    `- DB全体 manual_foods: ${databaseBefore.manual} -> ${databaseAfter.manual}`,
    `- DB全体 memberships: ${databaseBefore.memberships} -> ${databaseAfter.memberships}`,
    `- DB全体 publication metadata: ${databaseBefore.metadata} -> ${databaseAfter.metadata}`,
    `- DB全体 variants: ${databaseBefore.variants} -> ${databaseAfter.variants}`,
    `- DB全体 overrides: ${databaseBefore.overrides} -> ${databaseAfter.overrides}`,
    `- DB全体 revisions: ${databaseBefore.revisions} -> ${databaseAfter.revisions}`,
    "",
    "## 公開状態検証",
    "",
    `- import対象reviewStatus: ${JSON.stringify(verification.statusCounts)}`,
    `- publishedAtあり: ${verification.publishedAtCount}`,
    `- hidden manual foods: ${verification.hiddenManualCount}`,
    `- membership重複: ${verification.duplicateMemberships.length}`,
    `- default variant重複: ${verification.duplicateDefaultVariants.length}`,
    `- 検証issue: ${verification.issues.length === 0 ? "なし" : verification.issues.join(" / ")}`,
    "",
    "## 登録対象一覧",
    "",
    "| 商品名 | foodId | targetType | reviewStatus | DB保存先 | 結果 | Vercel表示URL |",
    "|---|---|---|---|---|---|---|"
  ];

  const resultByFoodId = new Map(results.map((result) => [result.foodId, result]));
  for (const decision of importReady.items) {
    const foodId = resolveFoodId(decision);
    const result = resultByFoodId.get(foodId);
    const stores =
      decision.targetType === "existing"
        ? "food_overrides / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions"
        : "manual_foods / food_collection_memberships / food_variants / food_publication_metadata / food_override_revisions";
    lines.push(
      `| ${escapeTable(decision.editedData.name)} | ${foodId} | ${decision.targetType} | ${decision.editedData.reviewStatus} | ${stores} | ${
        result ? `${result.status}: ${result.details.join(", ")}` : "dry-run"
      } | https://unicolle.vercel.app/foods/${foodId} |`
    );
  }

  lines.push(
    "",
    "## 登録しなかった商品",
    "",
    "- 超！！ チョコバナナ・チュリトス: 既存商品統合と価格情報に人間確認が必要なため保留。",
    "- キャラメルポップコーン!? チュリトス: 既存商品統合に人間確認が必要なため保留。",
    "",
    "## 管理画面確認",
    "",
    "- 管理画面URL: https://unicolle.vercel.app/admin/foods",
    "- 管理画面は既存認証により未ログイン時 `/admin/login` へリダイレクトされる。",
    "- 登録商品は通常の `/admin/foods` の商品一覧・詳細・編集で扱う。",
    "",
    "## Web / PWA / iOS互換性",
    "",
    "- Web/PWA/iOSはいずれも既存repositoryから同じfoodIdを参照する。",
    "- 画像はHTTPS URLのみを保持し、ローカルファイルパスは使用しない。",
    "- UserFoodLog、Bundle ID、Capacitor appId、AdMob設定は変更していない。",
    "",
    "## ロールバック方法",
    "",
    "- 新規manual_foodsは上記foodIdの `manual_foods` 行を削除し、対応する `food_collection_memberships` / `food_variants` / `food_publication_metadata` を削除する。",
    "- 既存商品追記は `food_overrides` を直前revisionのsnapshotに戻し、summer-2026 membership・variants・publication metadataを必要に応じて復元する。",
    "- 変更履歴は `food_override_revisions` の `action=summer-2026-auto-import` で追跡できる。"
  );

  fs.writeFileSync(FINAL_IMPORT_REPORT_FILE, `${lines.join("\n")}\n`, "utf8");
}

function escapeTable(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

if (typeof require !== "undefined" && require.main === module) {
  runSummer2026Import()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
