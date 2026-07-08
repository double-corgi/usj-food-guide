"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Database,
  Filter,
  Link2,
  Loader2,
  MapPin,
  ReceiptText,
  RotateCcw,
  Save,
  Search,
  Store,
  Tags,
  XCircle
} from "lucide-react";
import { AdminFoodImagePicker } from "@/components/admin/admin-food-image-picker";
import { AdminFoodImagePreview } from "@/components/admin/admin-food-image-preview";
import { adminAreaOptions, adminFoodCategoryOptions, adminLegacyCategoryTagOptions, adminReviewStatusOptions } from "@/lib/admin-food-ui";
import { saveSummer2026ReviewDecisions } from "./actions";
import {
  decisionLabels,
  deriveExistingActionLabels,
  duplicateActionLabels,
  formatPriceVariantsForInput,
  imageReviewLabels,
  normalizePriceVariantsInput,
  normalizeStringListInput,
  parsePrice,
  priceReviewLabels,
  runRegistrationChecks
} from "./review-logic";
import type { ReactNode } from "react";
import type {
  DuplicateAction,
  EditableReviewData,
  ExcludedReviewItem,
  ImageReviewValue,
  PriceVerificationStatus,
  RegistrationCheckIssue,
  ReviewDecision,
  ReviewDecisionValue,
  ReviewItem,
  SourceFileInfo,
  TargetType
} from "./review-types";

type DecisionFilter = "all" | ReviewDecisionValue;
type ImageFilter = "all" | ImageReviewValue;
type TargetFilter = "all" | TargetType;
type MissingFilter = "none" | "price" | "no-candidates" | "official-url" | "shop" | "area";
type SaveMessageTone = "idle" | "success" | "error" | "warn" | "saving";

type ReviewFilters = {
  decision: DecisionFilter;
  image: ImageFilter;
  target: TargetFilter;
  missing: MissingFilter;
};

const decisionOptions: ReviewDecisionValue[] = ["unreviewed", "register", "needs_revision", "hold", "exclude"];
const imageReviewOptions: ImageReviewValue[] = ["confirmed", "incorrect", "unresolved", "candidate-only", "no-image"];
const priceReviewOptions: PriceVerificationStatus[] = ["official-confirmed", "secondary-confirmed", "unresolved"];
const decisionFilterOptions: Array<{ value: DecisionFilter; label: string }> = [{ value: "all", label: "すべて" }, ...decisionOptions.map((value) => ({ value, label: decisionLabels[value] }))];
const imageFilterOptions: Array<{ value: ImageFilter; label: string }> = [{ value: "all", label: "すべて" }, ...imageReviewOptions.map((value) => ({ value, label: imageReviewLabels[value] }))];
const targetTypeOptions: Array<{ value: TargetType; label: string }> = [
  { value: "new", label: "新規商品" },
  { value: "existing", label: "既存商品へ追記" }
];
const targetFilterOptions: Array<{ value: TargetFilter; label: string }> = [{ value: "all", label: "すべて" }, ...targetTypeOptions];
const missingFilterOptions: Array<{ value: MissingFilter; label: string }> = [
  { value: "none", label: "指定なし" },
  { value: "price", label: "価格未確認" },
  { value: "no-candidates", label: "画像候補なし" },
  { value: "official-url", label: "公式URLなし" },
  { value: "shop", label: "店舗未確認" },
  { value: "area", label: "エリア未確認" }
];
const duplicateActionOptions = Object.keys(duplicateActionLabels) as DuplicateAction[];

export function Summer2026ReviewClient({
  items,
  initialDecisions,
  excludedItems,
  sourceFiles,
  canSave
}: {
  items: ReviewItem[];
  initialDecisions: ReviewDecision[];
  excludedItems: ExcludedReviewItem[];
  sourceFiles: SourceFileInfo[];
  canSave: boolean;
}) {
  const [decisions, setDecisions] = useState(initialDecisions);
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");
  const [imageFilter, setImageFilter] = useState<ImageFilter>("all");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [missingFilter, setMissingFilter] = useState<MissingFilter>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set());
  const [recentlySavedIds, setRecentlySavedIds] = useState<Set<string>>(() => new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [orderedItemIds] = useState(() => sortItems(items, initialDecisions).map((item) => item.id));
  const [saveMessage, setSaveMessage] = useState<{ tone: SaveMessageTone; text: string }>({
    tone: canSave ? "idle" : "warn",
    text: canSave ? "変更はまだありません。" : "viewer権限では保存できません。editor以上で保存できます。"
  });
  const [autoSavePaused, setAutoSavePaused] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [savingInFlight, setSavingInFlight] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const saving = isSaving || savingInFlight;

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const metrics = useMemo(() => buildMetrics(decisions), [decisions]);
  const issues = useMemo(() => runRegistrationChecks(decisions), [decisions]);
  const decisionsMap = useMemo(() => decisionsById(decisions), [decisions]);
  const filters = useMemo<ReviewFilters>(
    () => ({ decision: decisionFilter, image: imageFilter, target: targetFilter, missing: missingFilter }),
    [decisionFilter, imageFilter, targetFilter, missingFilter]
  );
  const hasActiveFilters = decisionFilter !== "all" || imageFilter !== "all" || targetFilter !== "all" || missingFilter !== "none" || searchQuery.trim().length > 0;
  const visibleItems = useMemo(() => {
    const orderedItems = orderedItemIds.map((id) => itemById.get(id)).filter((item): item is ReviewItem => Boolean(item));
    return orderedItems.filter((item) => matchesFilters(item, decisionsMap.get(item.id), filters, searchQuery));
  }, [decisionsMap, filters, itemById, orderedItemIds, searchQuery]);

  const saveAll = useCallback(
    async (mode: "auto" | "manual" = "manual") => {
      if (!canSave || savingInFlight) return;
      if (dirtyIds.size === 0) return;
      const savingIds = Array.from(dirtyIds);
      const snapshot = decisions.map((decision) => ({ ...decision, editedData: { ...decision.editedData } }));
      setSavingInFlight(true);
      setSaveMessage({ tone: "saving", text: `${mode === "auto" ? "自動保存" : "保存"}中です。` });
      startSaving(async () => {
        try {
          const result = await saveSummer2026ReviewDecisions(snapshot);
          if (result.ok) {
            setDecisions(result.decisions);
            setDirtyIds(new Set());
            setRecentlySavedIds(new Set(savingIds));
            setAutoSavePaused(false);
            setLastSavedAt(result.savedAt);
            setSaveMessage({
              tone: "success",
              text: `${mode === "auto" ? "自動保存" : "保存"}しました。import-ready ${result.importReadyCount}件、チェック指摘 ${result.issues.length}件。`
            });
            window.setTimeout(() => {
              setRecentlySavedIds(new Set());
            }, 2500);
            window.setTimeout(() => {
              setSaveMessage((current) => (current.tone === "success" ? { tone: "idle", text: "保存済みです。" } : current));
            }, 4000);
          } else {
            setAutoSavePaused(true);
            setSaveMessage({ tone: "error", text: result.message });
          }
        } catch (error) {
          setAutoSavePaused(true);
          setSaveMessage({ tone: "error", text: error instanceof Error ? error.message : "保存に失敗しました。" });
        } finally {
          setSavingInFlight(false);
        }
      });
    },
    [canSave, decisions, dirtyIds, savingInFlight, startSaving]
  );

  useEffect(() => {
    if (!canSave || dirtyIds.size === 0 || saving || autoSavePaused) return;
    const timer = window.setTimeout(() => {
      void saveAll("auto");
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [autoSavePaused, canSave, dirtyIds, saveAll, saving]);

  useEffect(() => {
    if (dirtyIds.size === 0) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirtyIds.size]);

  function markDirty(id: string) {
    setDirtyIds((current) => new Set(current).add(id));
    setRecentlySavedIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setSaveMessage({ tone: "warn", text: "未保存の変更があります。自動保存待ちです。" });
  }

  function clearFilters() {
    setDecisionFilter("all");
    setImageFilter("all");
    setTargetFilter("all");
    setMissingFilter("none");
    setSearchQuery("");
  }

  function updateDecision(id: string, updater: (decision: ReviewDecision) => ReviewDecision) {
    setDecisions((current) =>
      current.map((decision) => {
        if (decision.proposedId !== id) return decision;
        const next = enforceDecisionRules(updater(decision));
        return next;
      })
    );
    markDirty(id);
  }

  function updateEditedData(id: string, changes: Partial<EditableReviewData>) {
    updateDecision(id, (decision) => ({
      ...decision,
      editedData: {
        ...decision.editedData,
        ...changes
      }
    }));
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <>
      <section className="z-20 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft lg:sticky lg:top-0">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-black leading-tight text-ink">2026夏 登録前レビュー</h2>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                表示中 {visibleItems.length}件 / 全{items.length}件
                {hasActiveFilters ? <span className="ml-2 text-amber-900">絞り込み中</span> : null}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SaveStatusPill
                tone={saving ? "saving" : saveMessage.tone}
                dirtyCount={dirtyIds.size}
                message={saveMessage.text}
                lastSavedAt={lastSavedAt}
              />
              <button
                type="button"
                onClick={() => void saveAll("manual")}
                disabled={!canSave || dirtyIds.size === 0 || saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-white shadow-soft transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />}
                {saving ? "保存中" : dirtyIds.size > 0 ? "変更を保存" : "保存済み"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="状態集計">
            <MetricChip label="全" value={decisions.length} tone="slate" onClick={clearFilters} />
            <MetricChip label="未判断" value={metrics.unreviewed} tone="slate" onClick={() => setDecisionFilter("unreviewed")} />
            <MetricChip label="登録する" value={metrics.register} tone="blue" onClick={() => setDecisionFilter("register")} />
            <MetricChip label="修正が必要" value={metrics.needsRevision} tone="gold" onClick={() => setDecisionFilter("needs_revision")} />
            <MetricChip label="保留" value={metrics.hold} tone="slate" onClick={() => setDecisionFilter("hold")} />
            <MetricChip label="除外" value={metrics.exclude} tone="slate" onClick={() => setDecisionFilter("exclude")} />
            <MetricChip label="confirmed" value={metrics.imageConfirmed} tone="blue" onClick={() => setImageFilter("confirmed")} />
            <MetricChip label="candidate-only" value={metrics.imageCandidateOnly} tone="gold" onClick={() => setImageFilter("candidate-only")} />
            <MetricChip label="unresolved" value={metrics.imageUnresolved} tone="slate" onClick={() => setImageFilter("unresolved")} />
            <MetricChip label="incorrect" value={metrics.imageIncorrect} tone="danger" onClick={() => setImageFilter("incorrect")} />
            <MetricChip label="no-image" value={metrics.imageNoImage} tone="slate" onClick={() => setImageFilter("no-image")} />
            <MetricChip label="価格未確認" value={metrics.priceMissing} tone="gold" onClick={() => setMissingFilter("price")} />
            <MetricChip label="新規" value={metrics.newItems} tone="gold" onClick={() => setTargetFilter("new")} />
            <MetricChip label="既存追記" value={metrics.existingItems} tone="blue" onClick={() => setTargetFilter("existing")} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(150px,180px))_auto] xl:items-end">
            <label className="block">
              <span className="flex items-center gap-2 text-xs font-black text-slate-600">
                <Search size={14} aria-hidden />
                検索
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                placeholder="商品名・店舗・エリア・foodId"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              />
            </label>
            <SelectControl label="判断状態" value={decisionFilter} options={decisionFilterOptions} onChange={(value) => setDecisionFilter(value as DecisionFilter)} />
            <SelectControl label="画像状態" value={imageFilter} options={imageFilterOptions} onChange={(value) => setImageFilter(value as ImageFilter)} />
            <SelectControl label="登録方式" value={targetFilter} options={targetFilterOptions} onChange={(value) => setTargetFilter(value as TargetFilter)} />
            <SelectControl label="情報不足" value={missingFilter} options={missingFilterOptions} onChange={(value) => setMissingFilter(value as MissingFilter)} />
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink shadow-soft transition hover:border-ink disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <RotateCcw size={14} aria-hidden />
                フィルター解除
              </button>
              <button
                type="button"
                onClick={() => setExpandedIds(new Set())}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink shadow-soft transition hover:border-ink"
              >
                <ChevronUp size={14} aria-hidden />
                すべて閉じる
              </button>
            </div>
          </div>
          <p className="text-xs font-bold leading-5 text-slate-600">
            現在の条件: {describeFilters(filters, searchQuery)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-cream p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-ink">確認元ファイル</h2>
            <p className="mt-1 text-sm font-bold text-slate-600">元の候補JSONは直接変更せず、判断結果とimport-readyを別ファイルへ保存します。</p>
          </div>
          <div className="grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
            {sourceFiles.map((file) => (
              <div key={file.path} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="break-all font-black text-ink">{file.path}</p>
                <p className="mt-1">{file.size > 0 ? `${formatFileSize(file.size)} / ${formatDate(file.updatedAt)}` : "未作成"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5">
        {visibleItems.map((item) => {
          const decision = decisions.find((candidate) => candidate.proposedId === item.id);
          if (!decision) return null;
          return (
            <ReviewCard
              key={item.id}
              item={item}
              decision={decision}
              dirty={dirtyIds.has(item.id)}
              recentlySaved={recentlySavedIds.has(item.id)}
              expanded={expandedIds.has(item.id)}
              issues={issues.filter((issue) => issue.proposedId === item.id)}
              canSave={canSave}
              isSaving={saving}
              onSave={() => void saveAll("manual")}
              onToggleExpanded={() => toggleExpanded(item.id)}
              onClose={() => setExpandedIds((current) => {
                const next = new Set(current);
                next.delete(item.id);
                return next;
              })}
              onDecisionChange={updateDecision}
              onEditedDataChange={updateEditedData}
            />
          );
        })}
      </section>

      <RegistrationCheckPanel issues={issues} decisions={decisions} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun/20 text-amber-800">
            <AlertTriangle size={21} aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-black text-ink">今回の登録候補から除外</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">夏フード候補30件とは別に、登録しない方針として確認した商品です。</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {excludedItems.map((item) => (
            <ExcludedCard key={item.name} item={item} />
          ))}
        </div>
      </section>

      <div className="hidden">{itemById.size}</div>
    </>
  );
}

function ReviewCard({
  item,
  decision,
  dirty,
  recentlySaved,
  expanded,
  issues,
  canSave,
  isSaving,
  onSave,
  onToggleExpanded,
  onClose,
  onDecisionChange,
  onEditedDataChange
}: {
  item: ReviewItem;
  decision: ReviewDecision;
  dirty: boolean;
  recentlySaved: boolean;
  expanded: boolean;
  issues: RegistrationCheckIssue[];
  canSave: boolean;
  isSaving: boolean;
  onSave: () => void;
  onToggleExpanded: () => void;
  onClose: () => void;
  onDecisionChange: (id: string, updater: (decision: ReviewDecision) => ReviewDecision) => void;
  onEditedDataChange: (id: string, changes: Partial<EditableReviewData>) => void;
}) {
  const references = uniqueText([decision.editedData.sourceUrl, ...decision.editedData.officialReferenceUrls, item.shopOfficialUrl]);
  const existingName = item.duplicateCandidates?.find((candidate) => candidate.name)?.name ?? "既存商品名未確認";
  const existingActions = deriveExistingActionLabels(decision, item);
  const detailsId = `summer-review-details-${safeDomId(item.id)}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft" data-review-card={item.id}>
      <div className="p-3">
        <div className="grid items-start gap-3 lg:grid-cols-[176px_minmax(0,1fr)_minmax(210px,240px)]">
          <div className="lg:w-[176px]">
          <AdminFoodImagePreview
            src={decision.editedData.imageUrl}
            alt={decision.editedData.name || item.name}
            variant="card"
            placeholderState={decision.imageReview === "no-image" ? "no-image" : "unconfirmed"}
          />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.reviewStatus} />
              <span className={`rounded-full px-3 py-1 text-xs font-black ${decision.targetType === "existing" ? "bg-ink text-white" : "bg-sun/25 text-amber-900"}`}>
                {decision.targetType === "existing" ? "既存商品へ追記" : "新規商品"}
              </span>
              <ImageReviewBadge value={decision.imageReview} candidateCount={decision.editedData.imageCandidates.length} />
              <PriceStatusBadge status={decision.priceReview} />
            </div>
            <h2 className="mt-3 text-lg font-black leading-snug text-ink [overflow-wrap:anywhere] sm:text-xl" title={decision.editedData.name || item.name}>
              {decision.editedData.name || "商品名未確認"}
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-700 [overflow-wrap:anywhere]">
              {decision.editedData.priceText || "価格未確認"} ・ {decision.editedData.shopName || "店舗未確認"}
            </p>
            <p className="text-sm font-bold leading-6 text-slate-600 [overflow-wrap:anywhere]">{decision.editedData.areaName || "エリア未確認"}</p>
          </div>

          <div className="grid gap-2">
            <div>
              <SaveStateBadge dirty={dirty} saving={isSaving && dirty} recentlySaved={recentlySaved} />
            </div>
            <CompactDecisionControl
              decision={decision}
              onChange={(value) => onDecisionChange(item.id, (current) => ({ ...current, decision: value }))}
            />
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={detailsId}
              onClick={onToggleExpanded}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink shadow-soft transition hover:border-ink"
            >
              {expanded ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
              {expanded ? "詳細を閉じる" : "詳細を開く"}
            </button>
          </div>
        </div>

        {expanded ? (
          <div id={detailsId} className="mt-5 space-y-5 border-t border-slate-200 pt-5">
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-black text-ink">採用判断</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <RadioGroup
                label="判断"
                value={decision.decision}
                options={decisionOptions.map((value) => ({ value, label: decisionLabels[value] }))}
                onChange={(value) => {
                  if (value === "register" && blocksRegisterForImage(decision.imageReview)) return;
                  onDecisionChange(item.id, (current) => ({ ...current, decision: value as ReviewDecisionValue }));
                }}
              />
              <RadioGroup
                label="画像確認"
                value={decision.imageReview}
                options={imageReviewOptions.map((value) => ({ value, label: imageReviewLabels[value] }))}
                onChange={(value) =>
                  onDecisionChange(item.id, (current) => ({
                    ...current,
                    imageReview: value as ImageReviewValue,
                    editedData: {
                      ...current.editedData,
                      imageReviewStatus: value as ImageReviewValue,
                      imageCheckedAt: value === "confirmed" || value === "incorrect" || value === "no-image" ? new Date().toISOString() : current.editedData.imageCheckedAt
                    }
                  }))
                }
              />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <SelectControl
                label="価格確認"
                value={decision.priceReview}
                options={priceReviewOptions.map((value) => ({ value, label: priceReviewLabels[value] ?? value }))}
                onChange={(value) => onDecisionChange(item.id, (current) => ({ ...current, priceReview: value }))}
              />
              <SelectControl
                label="新規/既存"
                value={decision.targetType}
                options={targetTypeOptions}
                onChange={(value) =>
                  onDecisionChange(item.id, (current) => ({
                    ...current,
                    targetType: value as TargetType,
                    existingFoodId: value === "existing" ? current.existingFoodId : null,
                    duplicateAction: value === "existing" && current.duplicateAction === "new_manual_food" ? "existing_update" : current.duplicateAction
                  }))
                }
              />
              <SelectControl
                label="重複処理"
                value={decision.duplicateAction}
                options={duplicateActionOptions.map((value) => ({ value, label: duplicateActionLabels[value] }))}
                onChange={(value) => onDecisionChange(item.id, (current) => ({ ...current, duplicateAction: value as DuplicateAction }))}
              />
            </div>
            {decision.imageReview === "incorrect" ? <WarningText>画像が違う商品は「登録する」にできません。修正後に画像確認を変更してください。</WarningText> : null}
            {decision.imageReview === "unresolved" ? <WarningText>画像未確認です。登録前に商品画像の一致確認が必要です。</WarningText> : null}
            {decision.imageReview === "candidate-only" ? <WarningText>候補画像はありますが未採用です。「この画像を採用」または画像なし方針を選ぶまでimport-readyには入りません。</WarningText> : null}
            {decision.decision === "register" && decision.priceReview === "unresolved" ? <WarningText>価格未確認のまま登録判断になっています。登録可能性チェックにも表示されます。</WarningText> : null}
          </section>

          <AdminFoodImagePicker
            productName={decision.editedData.name || item.name}
            imageUrl={decision.editedData.imageUrl}
            imageSourceUrl={decision.editedData.imageSourceUrl}
            imageCandidates={decision.editedData.imageCandidates}
            imageReviewStatus={decision.imageReview}
            imageReviewNote={decision.editedData.imageReviewNote}
            imageCheckedAt={decision.editedData.imageCheckedAt}
            onChange={(changes) =>
              onDecisionChange(item.id, (current) => {
                const imageReview = changes.imageReviewStatus ?? current.imageReview;
                return {
                  ...current,
                  imageReview,
                  editedData: {
                    ...current.editedData,
                    ...changes,
                    imageReviewStatus: imageReview
                  }
                };
              })
            }
          />

          {decision.targetType === "existing" ? (
            <section className="rounded-2xl border border-slate-200 bg-cream p-4">
              <h3 className="text-sm font-black text-ink">既存商品への追記候補</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <InfoBlock icon={<Database size={18} aria-hidden />} label="既存foodId" value={decision.existingFoodId || "未確認"} />
                <InfoBlock icon={<Tags size={18} aria-hidden />} label="既存商品名" value={existingName} />
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{decision.editedData.duplicateHandling || item.importReview?.registrationPolicy || "追加予定の内容未確認"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {existingActions.map((label) => (
                  <span key={label} className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-800 ring-1 ring-blue-200">
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-600">既存追記候補は新しいmanual_foodsとして登録しません。</p>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-black text-ink">編集フォーム</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <TextControl label="商品名" value={decision.editedData.name} onChange={(value) => onEditedDataChange(item.id, { name: value })} />
              <TextControl
                label="価格"
                value={decision.editedData.priceText}
                onChange={(value) => onEditedDataChange(item.id, { priceText: value, price: parsePrice(value) })}
                placeholder="例: 900円"
              />
              <TextControl label="店舗" value={decision.editedData.shopName} onChange={(value) => onEditedDataChange(item.id, { shopName: value })} />
              <SelectControl
                label="エリア"
                value={decision.editedData.areaName}
                options={adminAreaOptions.map((value) => ({ value, label: value }))}
                onChange={(value) => onEditedDataChange(item.id, { areaName: value })}
              />
              <SelectControl
                label="カテゴリ"
                value={decision.editedData.category}
                options={[...adminFoodCategoryOptions, ...adminLegacyCategoryTagOptions].map((option) => ({ value: option.value, label: option.label }))}
                onChange={(value) => onEditedDataChange(item.id, { category: value })}
              />
              <TextControl label="collectionId" value={decision.editedData.collectionId} onChange={(value) => onEditedDataChange(item.id, { collectionId: value })} />
              <SelectControl
                label="reviewStatus"
                value={decision.editedData.reviewStatus}
                options={adminReviewStatusOptions.filter((option) => option.value !== "approved").map((option) => ({ value: option.value, label: option.label }))}
                onChange={(value) => onEditedDataChange(item.id, { reviewStatus: value })}
              />
              <TextControl label="使用予定foodId" value={decision.targetType === "existing" ? decision.existingFoodId ?? "" : decision.proposedId} onChange={(value) => onDecisionChange(item.id, (current) => (current.targetType === "existing" ? { ...current, existingFoodId: value } : { ...current, proposedId: value }))} />
              <TextControl label="画像URL" value={decision.editedData.imageUrl} onChange={(value) => onEditedDataChange(item.id, { imageUrl: value })} />
              <TextControl label="画像出典URL" value={decision.editedData.imageSourceUrl} onChange={(value) => onEditedDataChange(item.id, { imageSourceUrl: value })} />
            </div>
            <div className="mt-4 grid gap-4">
              <TextareaControl label="商品説明" value={decision.editedData.description} onChange={(value) => onEditedDataChange(item.id, { description: value })} rows={3} />
              <TextareaControl label="公式参照URL（1行1URL）" value={references.join("\n")} onChange={(value) => onEditedDataChange(item.id, { sourceUrl: normalizeStringListInput(value)[0] ?? "", officialReferenceUrls: normalizeStringListInput(value) })} rows={3} />
              <TextareaControl label="未確認項目（カンマまたは改行区切り）" value={decision.editedData.unconfirmedFields.join("\n")} onChange={(value) => onEditedDataChange(item.id, { unconfirmedFields: normalizeStringListInput(value) })} rows={3} />
              <TextareaControl label="重複処理方針" value={decision.editedData.duplicateHandling} onChange={(value) => onEditedDataChange(item.id, { duplicateHandling: value })} rows={3} />
              <TextareaControl
                label="priceVariants（1行: ラベル | 価格 | メモ）"
                value={formatPriceVariantsForInput(decision.editedData.priceVariants)}
                onChange={(value) => onEditedDataChange(item.id, { priceVariants: normalizePriceVariantsInput(value) })}
                rows={4}
              />
              <TextareaControl label="レビューメモ" value={decision.reviewerNote} onChange={(value) => onDecisionChange(item.id, (current) => ({ ...current, reviewerNote: value }))} rows={3} />
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBlock icon={<ReceiptText size={18} aria-hidden />} label="価格" value={decision.editedData.priceText || "未確認"} />
            <InfoBlock icon={<Store size={18} aria-hidden />} label="店舗" value={decision.editedData.shopName || "未確認"} />
            <InfoBlock icon={<MapPin size={18} aria-hidden />} label="エリア" value={decision.editedData.areaName || "未確認"} />
            <InfoBlock icon={<CalendarDays size={18} aria-hidden />} label="販売期間" value={formatSalePeriod(item)} />
          </div>

          <DetailSection title="公式URL">
            <LinkList urls={references} emptyText="公式参照URL未確認" />
          </DetailSection>

          <DetailSection title="画像出典URL">
            {decision.editedData.imageSourceUrl ? <LinkList urls={[decision.editedData.imageSourceUrl]} emptyText="画像出典URL未確認" /> : <p className="text-sm font-bold text-slate-500">画像出典URL未確認</p>}
          </DetailSection>

          {issues.length > 0 ? (
            <DetailSection title="この商品の登録可能性チェック">
              <ul className="space-y-2">
                {issues.map((issue, index) => (
                  <li key={`${issue.reason}-${index}`} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">
                    {issue.reason}
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || !dirty || isSaving}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-white shadow-soft disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            <Save size={16} aria-hidden />
            この状態を保存
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink shadow-soft sm:ml-3 sm:w-auto"
          >
            <ChevronUp size={16} aria-hidden />
            詳細を閉じる
          </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RegistrationCheckPanel({ issues, decisions }: { issues: RegistrationCheckIssue[]; decisions: ReviewDecision[] }) {
  const registerCount = decisions.filter((decision) => decision.decision === "register").length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${issues.length > 0 ? "bg-sun/20 text-amber-800" : "bg-blue-50 text-blue-800"}`}>
          {issues.length > 0 ? <AlertTriangle size={21} aria-hidden /> : <CheckCircle2 size={21} aria-hidden />}
        </span>
        <div>
          <h2 className="text-xl font-black text-ink">登録可能性チェック</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
            「登録する」判断の商品 {registerCount}件を対象に、重複・不足・approved混入を確認します。問題がある商品はimport-readyから除外される場合があります。
          </p>
        </div>
      </div>
      {issues.length > 0 ? (
        <ul className="mt-5 grid gap-2">
          {issues.map((issue, index) => (
            <li key={`${issue.proposedId}-${issue.reason}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-950">
              <span className="font-black">{issue.name}</span>
              <span className="mx-2 text-amber-700">/</span>
              {issue.reason}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-800">現在の「登録する」商品には登録可能性チェックの指摘がありません。</p>
      )}
    </section>
  );
}

function ExcludedCard({ item }: { item: ExcludedReviewItem }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-cream p-4">
      <h3 className="text-base font-black leading-tight text-ink [overflow-wrap:anywhere]">{item.name}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{item.reason}</p>
      <dl className="mt-3 space-y-2 text-xs font-bold leading-5 text-slate-700">
        <Definition label="使用予定foodId" value={item.plannedFoodId || "なし"} />
        <Definition label="重複処理" value={item.duplicateHandling} />
        <Definition label="登録方針" value={item.registrationPolicy} />
      </dl>
      <div className="mt-3">
        <LinkList urls={uniqueText([item.sourceUrl, item.imageSourceUrl])} emptyText="参照URL未確認" />
      </div>
    </article>
  );
}

function SaveStatusPill({
  tone,
  dirtyCount,
  message,
  lastSavedAt
}: {
  tone: SaveMessageTone;
  dirtyCount: number;
  message: string;
  lastSavedAt: string | null;
}) {
  const config = {
    idle: { icon: <CheckCircle2 size={16} aria-hidden />, label: "保存済み", className: "border-slate-200 bg-slate-50 text-slate-700" },
    success: { icon: <CheckCircle2 size={16} aria-hidden />, label: "保存成功", className: "border-blue-200 bg-blue-50 text-blue-800" },
    error: { icon: <XCircle size={16} aria-hidden />, label: "保存失敗", className: "border-rose-200 bg-rose-50 text-rose-700" },
    warn: { icon: <Clock3 size={16} aria-hidden />, label: "未保存", className: "border-amber-200 bg-sun/25 text-amber-900" },
    saving: { icon: <Loader2 size={16} className="animate-spin" aria-hidden />, label: "保存中", className: "border-blue-200 bg-blue-50 text-blue-800" }
  }[tone];

  return (
    <div className={`rounded-2xl border px-3 py-2 ${config.className}`} aria-live="polite">
      <p className="flex items-center gap-2 text-xs font-black">
        {config.icon}
        {config.label}
        {dirtyCount > 0 ? <span>未保存{dirtyCount}件</span> : null}
      </p>
      <p className="mt-1 max-w-xl text-xs font-bold leading-5 [overflow-wrap:anywhere]">
        {message}
        {lastSavedAt ? <span className="ml-2 opacity-80">最終保存: {formatDateTime(lastSavedAt)}</span> : null}
      </p>
    </div>
  );
}

function MetricChip({ label, value, tone, onClick }: { label: string; value: number; tone: "blue" | "gold" | "slate" | "danger"; onClick?: () => void }) {
  const toneClass = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    gold: "border-amber-200 bg-sun/25 text-amber-900",
    slate: "border-slate-200 bg-white text-slate-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700"
  }[tone];

  const className = `inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-black shadow-sm ${toneClass}`;
  if (!onClick) return <span className={className}>{label} {value}件</span>;

  return (
    <button type="button" onClick={onClick} className={`${className} transition hover:border-ink hover:text-ink`}>
      {label} {value}件
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className = status === "pending" ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200" : status === "draft" ? "bg-slate-100 text-slate-700" : "bg-berry text-white";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function ImageReviewBadge({ value, candidateCount }: { value: ImageReviewValue; candidateCount: number }) {
  const className =
    value === "confirmed"
      ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200"
      : value === "incorrect"
        ? "bg-berry text-white"
        : value === "no-image"
          ? "bg-slate-700 text-white"
          : value === "candidate-only"
            ? "bg-sun/25 text-amber-900"
          : "bg-sun/25 text-amber-900";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{imageReviewLabels[value]} / 候補{candidateCount > 0 ? `${candidateCount}件` : "なし"}</span>;
}

function PriceStatusBadge({ status }: { status: PriceVerificationStatus }) {
  const config =
    status === "official-confirmed"
      ? { label: "価格: 公式確認", className: "bg-blue-50 text-blue-800 ring-1 ring-blue-200" }
      : status === "secondary-confirmed"
        ? { label: "価格: 補助情報確認", className: "bg-sun/25 text-amber-900" }
        : { label: "価格: 未確認", className: "bg-slate-100 text-slate-700" };

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${config.className}`}>{config.label}</span>;
}

function SaveStateBadge({ dirty, saving, recentlySaved }: { dirty: boolean; saving: boolean; recentlySaved: boolean }) {
  if (saving) return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800"><Loader2 size={13} className="animate-spin" aria-hidden />保存中</span>;
  if (dirty) return <span className="inline-flex items-center gap-1 rounded-full bg-sun/25 px-3 py-1 text-xs font-black text-amber-900"><Clock3 size={13} aria-hidden />未保存</span>;
  if (recentlySaved) return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800"><CheckCircle2 size={13} aria-hidden />保存成功</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"><CheckCircle2 size={13} aria-hidden />保存済み</span>;
}

function CompactDecisionControl({ decision, onChange }: { decision: ReviewDecision; onChange: (value: ReviewDecisionValue) => void }) {
  return (
    <div>
      <select
        aria-label="登録判断"
        value={decision.decision}
        onChange={(event) => onChange(event.currentTarget.value as ReviewDecisionValue)}
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
      >
        {decisionOptions.map((value) => {
          const disabled = value === "register" && blocksRegisterForImage(decision.imageReview);
          return (
            <option
              key={value}
              value={value}
              disabled={disabled}
            >
              {decisionLabels[value]}
            </option>
          );
        })}
      </select>
      {blocksRegisterForImage(decision.imageReview) ? <p className="mt-2 text-xs font-bold leading-5 text-amber-900">画像状態が未確定のため登録不可です。</p> : null}
    </div>
  );
}

function RadioGroup({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-black text-slate-600">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-black ${value === option.value ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-ink"}`}>
            <input type="radio" className="h-4 w-4 accent-blue-700" checked={value === option.value} onChange={() => onChange(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TextControl({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-600">{label}</span>
      <input value={value} onChange={(event) => onChange(event.currentTarget.value)} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" />
    </label>
  );
}

function TextareaControl({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-600">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} rows={rows} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold leading-6 text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" />
    </label>
  );
}

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function WarningText({ children }: { children: ReactNode }) {
  return <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black leading-5 text-amber-900">{children}</p>;
}

function InfoBlock({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="flex items-center gap-2 text-xs font-black text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-5 text-ink [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-black text-slate-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-black text-ink [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function LinkList({ urls, emptyText }: { urls: string[]; emptyText: string }) {
  if (urls.length === 0) return <p className="text-sm font-bold text-slate-500">{emptyText}</p>;

  return (
    <ul className="space-y-2">
      {urls.map((url) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-start gap-2 text-xs font-black leading-5 text-blue-800 underline underline-offset-4">
            <Link2 size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span className="[overflow-wrap:anywhere]">{url}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function buildMetrics(decisions: ReviewDecision[]) {
  return {
    unreviewed: decisions.filter((decision) => decision.decision === "unreviewed").length,
    register: decisions.filter((decision) => decision.decision === "register").length,
    needsRevision: decisions.filter((decision) => decision.decision === "needs_revision").length,
    hold: decisions.filter((decision) => decision.decision === "hold").length,
    exclude: decisions.filter((decision) => decision.decision === "exclude").length,
    imageConfirmed: decisions.filter((decision) => decision.imageReview === "confirmed").length,
    imageCandidateOnly: decisions.filter((decision) => decision.imageReview === "candidate-only").length,
    imageUnresolved: decisions.filter((decision) => decision.imageReview === "unresolved").length,
    imageIncorrect: decisions.filter((decision) => decision.imageReview === "incorrect").length,
    imageNoImage: decisions.filter((decision) => decision.imageReview === "no-image").length,
    priceMissing: decisions.filter((decision) => decision.priceReview === "unresolved").length,
    newItems: decisions.filter((decision) => decision.targetType === "new").length,
    existingItems: decisions.filter((decision) => decision.targetType === "existing").length
  };
}

function matchesFilters(item: ReviewItem, decision: ReviewDecision | undefined, filters: ReviewFilters, searchQuery: string) {
  if (!decision) return false;
  if (filters.decision !== "all" && decision.decision !== filters.decision) return false;
  if (filters.image !== "all" && decision.imageReview !== filters.image) return false;
  if (filters.target !== "all" && decision.targetType !== filters.target) return false;
  if (filters.missing !== "none" && !matchesMissingFilter(decision, filters.missing)) return false;
  if (searchQuery.trim() && !matchesSearch(item, decision, searchQuery)) return false;
  return true;
}

function matchesMissingFilter(decision: ReviewDecision, filter: MissingFilter) {
  if (filter === "price") return decision.priceReview === "unresolved" || !decision.editedData.priceText.trim();
  if (filter === "no-candidates") return decision.editedData.imageCandidates.length === 0;
  if (filter === "official-url") return !decision.editedData.sourceUrl.trim() && decision.editedData.officialReferenceUrls.length === 0;
  if (filter === "shop") return !decision.editedData.shopName.trim();
  if (filter === "area") return !decision.editedData.areaName.trim();
  return true;
}

function matchesSearch(item: ReviewItem, decision: ReviewDecision, query: string) {
  const search = normalizeSearch(query);
  if (!search) return true;
  const fields = [
    decision.editedData.name,
    item.name,
    decision.editedData.shopName,
    decision.editedData.areaName,
    decision.editedData.category,
    decision.proposedId,
    decision.existingFoodId,
    item.id
  ];
  return fields.some((field) => normalizeSearch(field ?? "").includes(search));
}

function describeFilters(filters: ReviewFilters, searchQuery: string) {
  const labels: string[] = [];
  if (searchQuery.trim()) labels.push(`検索「${searchQuery.trim()}」`);
  if (filters.decision !== "all") labels.push(`判断=${decisionLabels[filters.decision]}`);
  if (filters.image !== "all") labels.push(`画像=${imageReviewLabels[filters.image]}`);
  if (filters.target !== "all") labels.push(`登録方式=${targetTypeOptions.find((option) => option.value === filters.target)?.label ?? filters.target}`);
  if (filters.missing !== "none") labels.push(`不足=${missingFilterOptions.find((option) => option.value === filters.missing)?.label ?? filters.missing}`);
  return labels.length > 0 ? labels.join(" / ") : "すべて表示";
}

function normalizeSearch(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

function sortItems(items: ReviewItem[], decisions: ReviewDecision[]) {
  const byId = decisionsById(decisions);
  return [...items].sort((left, right) => {
    const leftDecision = byId.get(left.id);
    const rightDecision = byId.get(right.id);
    const decisionDiff = decisionRank(leftDecision?.decision) - decisionRank(rightDecision?.decision);
    if (decisionDiff !== 0) return decisionDiff;
    const targetDiff = targetRank(leftDecision?.targetType) - targetRank(rightDecision?.targetType);
    if (targetDiff !== 0) return targetDiff;
    return left.name.localeCompare(right.name, "ja");
  });
}

function decisionsById(decisions: ReviewDecision[]) {
  return new Map(decisions.map((decision) => [decision.proposedId, decision]));
}

function decisionRank(value: ReviewDecisionValue | undefined) {
  if (value === "register") return 0;
  if (value === "needs_revision") return 1;
  if (value === "unreviewed") return 2;
  if (value === "hold") return 3;
  if (value === "exclude") return 4;
  return 5;
}

function targetRank(value: TargetType | undefined) {
  return value === "new" ? 0 : 1;
}

function enforceDecisionRules(decision: ReviewDecision): ReviewDecision {
  if (blocksRegisterForImage(decision.imageReview) && decision.decision === "register") {
    return {
      ...decision,
      decision: "needs_revision",
      editedData: {
        ...decision.editedData,
        imageReviewStatus: decision.imageReview
      }
    };
  }
  if (decision.targetType === "new" && decision.duplicateAction !== "exclude") {
    return { ...decision, existingFoodId: null, duplicateAction: decision.duplicateAction === "new_manual_food" ? decision.duplicateAction : decision.duplicateAction };
  }
  return decision;
}

function blocksRegisterForImage(value: ImageReviewValue) {
  return value === "incorrect" || value === "unresolved" || value === "candidate-only";
}

function formatSalePeriod(item: ReviewItem) {
  if (item.saleStartDate || item.saleEndDate) return `${item.saleStartDate ?? "開始未確認"} - ${item.saleEndDate ?? "終了未確認"}`;
  if (item.eventStartDate || item.eventEndDate) return `collection参考: ${item.eventStartDate ?? "開始未確認"} - ${item.eventEndDate ?? "終了未確認"}`;
  return "未確認";
}

function formatDate(value: string) {
  if (!value) return "未作成";
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size}B`;
  return `${Math.round(size / 1024).toLocaleString("ja-JP")}KB`;
}

function uniqueText(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function safeDomId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}
