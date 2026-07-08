import fs from "node:fs";
import { normalizeFoodName } from "../lib/food-utils";
import { buildManualFoodId } from "../lib/repositories/manual-foods";
import { readGeneratedFoods } from "../lib/repositories/generated-data";
import { createServiceSupabaseClient } from "../lib/supabase-server";
import type { Database, Json } from "../types/database";
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
const actorEmail = "summer-2026-auto-import";
const now = new Date().toISOString();

async function main() {
  const importReady = readJson<ImportReadyFile>(IMPORT_READY_FILE);
  validateImportReady(importReady);

  if (importReady.items.length === 0) {
    appendImportResult([], "import-readyが0件のためSupabase書き込みなし。");
    console.log(JSON.stringify({ importReady: 0, inserted: 0, updated: 0, skipped: 0, wroteSupabase: false }, null, 2));
    return;
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("Supabase service role settings are missing; import stopped before writes.");

  const before = await readImportSnapshot(supabase, importReady.items);
  const results: ImportResult[] = [];
  for (const decision of importReady.items) {
    results.push(await importDecision(supabase, decision));
  }
  const after = await readImportSnapshot(supabase, importReady.items);
  appendImportResult(results, buildSnapshotSummary(before, after));

  console.log(
    JSON.stringify(
      {
        importReady: importReady.items.length,
        inserted: results.filter((result) => result.status === "inserted").length,
        updated: results.filter((result) => result.status === "updated").length,
        skipped: results.filter((result) => result.status === "skipped").length,
        wroteSupabase: results.length > 0
      },
      null,
      2
    )
  );
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
    category: decision.editedData.category || "unknown",
    category_tags: [decision.editedData.category || "unknown", "seasonal"],
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
    const update = await supabase.from("manual_foods").update({ ...payload, created_at: undefined }).eq("id", foodId);
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
  if (decision.duplicateAction === "override_add" || decision.duplicateAction === "existing_update") {
    await upsertOverride(supabase, decision, foodId);
    details.push("food_overridesを冪等upsert");
  }
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
      review_status: "pending",
      published_at: null,
      updated_at: now
    },
    { onConflict: "food_id" }
  );
  if (metadata.error) throw new Error(`publication metadata保存失敗 ${foodId}: ${metadata.error.message}`);
  details.push("publication metadata pending/published_at null");

  await saveVariants(supabase, foodId, decision.editedData.priceVariants, decision.editedData.price, decision.editedData.sourceUrl || decision.editedData.officialReferenceUrls[0] || null);
  details.push("food_variants冪等保存");
  await insertRevision(supabase, foodId, decision, "summer-2026-auto-import");
  details.push("food_override_revisionsへ履歴追加");
  return details;
}

async function saveVariants(supabase: Supabase, foodId: string, variants: ReviewPriceVariant[], fallbackPrice: number | null, sourceUrl: string | null) {
  const rows = normalizeVariants(variants, fallbackPrice, sourceUrl);
  const existing = await supabase.from("food_variants").select("*").eq("food_id", foodId);
  if (existing.error) throw new Error(`variant確認失敗 ${foodId}: ${existing.error.message}`);

  for (const row of rows) {
    const current = existing.data?.find((candidate) => candidate.label === row.label);
    if (current) {
      const update = await supabase.from("food_variants").update(row).eq("id", current.id);
      if (update.error) throw new Error(`variant更新失敗 ${foodId}: ${update.error.message}`);
    } else {
      const insert = await supabase.from("food_variants").insert({ ...row, food_id: foodId });
      if (insert.error) throw new Error(`variant追加失敗 ${foodId}: ${insert.error.message}`);
    }
  }
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
    category: decision.editedData.category,
    category_tags: [decision.editedData.category || "unknown", "seasonal"],
    image_source_url: decision.editedData.imageSourceUrl || null,
    info_source_url: decision.editedData.sourceUrl || decision.editedData.officialReferenceUrls[0] || null,
    admin_source_type: "summer-2026-auto-import",
    admin_confidence: "high",
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
  const version = (latest.data?.version ?? 0) + 1;
  const result = await supabase.from("food_override_revisions").insert({
    food_id: foodId,
    version,
    action,
    actor_email: actorEmail,
    snapshot: JSON.parse(JSON.stringify({ source: "summer-2026-auto-import", decision })) as Json
  });
  if (result.error) throw new Error(`revision追加失敗 ${foodId}: ${result.error.message}`);
}

function validateImportReady(importReady: ImportReadyFile) {
  if (importReady.itemCount !== importReady.items.length) throw new Error("import-ready itemCount mismatch");
  const ids = new Set<string>();
  for (const decision of importReady.items) {
    if (decision.decision !== "register") throw new Error(`register以外が含まれています: ${decision.editedData.name}`);
    if (decision.imageReview !== "confirmed") throw new Error(`画像confirmed以外が含まれています: ${decision.editedData.name}`);
    if (decision.editedData.reviewStatus === "approved") throw new Error(`approvedが含まれています: ${decision.editedData.name}`);
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

function buildSnapshotSummary(before: Record<string, number>, after: Record<string, number>) {
  return `登録前後件数: manual ${before.manual}->${after.manual}, memberships ${before.memberships}->${after.memberships}, metadata ${before.metadata}->${after.metadata}, variants ${before.variants}->${after.variants}`;
}

function resolveFoodId(decision: ReviewDecision) {
  if (decision.targetType === "existing") return decision.existingFoodId ?? "";
  return buildManualFoodId(decision.editedData.areaName, decision.editedData.shopName, decision.editedData.name);
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

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
