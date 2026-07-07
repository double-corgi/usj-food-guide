"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Database, Filter, Link2, MapPin, ReceiptText, Save, Store, Tags } from "lucide-react";
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

type ReviewFilter =
  | "all"
  | "unreviewed"
  | "register"
  | "needs_revision"
  | "hold"
  | "exclude"
  | "image-wrong"
  | "image-unconfirmed"
  | "price-missing"
  | "new"
  | "existing"
  | "pending"
  | "draft";

const FILTERS: Array<{ id: ReviewFilter; label: string }> = [
  { id: "all", label: "すべて" },
  { id: "unreviewed", label: "未判断" },
  { id: "register", label: "登録する" },
  { id: "needs_revision", label: "修正が必要" },
  { id: "hold", label: "保留" },
  { id: "exclude", label: "除外" },
  { id: "image-wrong", label: "画像が違う" },
  { id: "image-unconfirmed", label: "画像未確認" },
  { id: "price-missing", label: "価格未確認" },
  { id: "new", label: "新規商品" },
  { id: "existing", label: "既存商品へ追記" },
  { id: "pending", label: "pending" },
  { id: "draft", label: "draft" }
];

const decisionOptions: ReviewDecisionValue[] = ["unreviewed", "register", "needs_revision", "hold", "exclude"];
const imageReviewOptions: ImageReviewValue[] = ["verified", "wrong", "unconfirmed", "no_image_planned"];
const priceReviewOptions: PriceVerificationStatus[] = ["official-confirmed", "secondary-confirmed", "unresolved"];
const targetTypeOptions: Array<{ value: TargetType; label: string }> = [
  { value: "new", label: "新規商品" },
  { value: "existing", label: "既存商品へ追記" }
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
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("all");
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [orderedItemIds] = useState(() => sortItems(items, initialDecisions).map((item) => item.id));
  const [saveMessage, setSaveMessage] = useState<{ tone: "idle" | "success" | "error" | "warn"; text: string }>({
    tone: canSave ? "idle" : "warn",
    text: canSave ? "変更はまだありません。" : "viewer権限では保存できません。editor以上で保存できます。"
  });
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const metrics = useMemo(() => buildMetrics(decisions), [decisions]);
  const issues = useMemo(() => runRegistrationChecks(decisions), [decisions]);
  const decisionsMap = useMemo(() => decisionsById(decisions), [decisions]);
  const visibleItems = useMemo(() => {
    const orderedItems = orderedItemIds.map((id) => itemById.get(id)).filter((item): item is ReviewItem => Boolean(item));
    return orderedItems.filter((item) => matchesFilter(item, decisionsMap.get(item.id), activeFilter));
  }, [activeFilter, decisionsMap, itemById, orderedItemIds]);

  const saveAll = useCallback(
    async (mode: "auto" | "manual" = "manual") => {
      if (!canSave || isSaving) return;
      const snapshot = decisions.map((decision) => ({ ...decision, editedData: { ...decision.editedData } }));
      startSaving(async () => {
        const result = await saveSummer2026ReviewDecisions(snapshot);
        if (result.ok) {
          setDecisions(result.decisions);
          setDirtyIds(new Set());
          setLastSavedAt(result.savedAt);
          setSaveMessage({
            tone: "success",
            text: `${mode === "auto" ? "自動保存" : "保存"}しました。import-ready ${result.importReadyCount}件、チェック指摘 ${result.issues.length}件。`
          });
        } else {
          setSaveMessage({ tone: "error", text: result.message });
        }
      });
    },
    [canSave, decisions, isSaving, startSaving]
  );

  useEffect(() => {
    if (!canSave || dirtyIds.size === 0 || isSaving) return;
    const timer = window.setTimeout(() => {
      void saveAll("auto");
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [canSave, dirtyIds, isSaving, saveAll]);

  function markDirty(id: string) {
    setDirtyIds((current) => new Set(current).add(id));
    setSaveMessage({ tone: "warn", text: "未保存の変更があります。自動保存待ちです。" });
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
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="未判断" value={metrics.unreviewed} tone="slate" />
        <MetricCard label="登録する" value={metrics.register} tone="blue" />
        <MetricCard label="修正が必要" value={metrics.needsRevision} tone="warn" />
        <MetricCard label="保留" value={metrics.hold} tone="slate" />
        <MetricCard label="除外" value={metrics.exclude} tone="slate" />
        <MetricCard label="画像未確認" value={metrics.imageUnconfirmed} tone="warn" />
        <MetricCard label="価格未確認" value={metrics.priceMissing} tone="warn" />
        <MetricCard label="新規登録" value={metrics.newItems} tone="gold" />
        <MetricCard label="既存商品へ追記" value={metrics.existingItems} tone="blue" />
        <MetricCard label="全候補" value={decisions.length} tone="slate" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <Save size={18} aria-hidden />
              保存状態
            </div>
            <p className={`mt-1 text-sm font-bold leading-6 ${saveMessageClass(saveMessage.tone)}`}>
              {saveMessage.text}
              {lastSavedAt ? <span className="ml-2 text-slate-500">最終保存: {formatDateTime(lastSavedAt)}</span> : null}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {dirtyIds.size > 0 ? <span className="rounded-full bg-sun/25 px-3 py-2 text-xs font-black text-amber-900">未保存 {dirtyIds.size}件</span> : null}
            <button
              type="button"
              onClick={() => void saveAll("manual")}
              disabled={!canSave || dirtyIds.size === 0 || isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-white shadow-soft disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save size={16} aria-hidden />
              {isSaving ? "保存中" : "変更を保存"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Filter size={18} aria-hidden />
            表示フィルター
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                    activeFilter === filter.id ? "border-park bg-park text-white" : "border-slate-200 bg-white text-ink hover:border-park hover:text-park"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-black text-slate-600">
              <span>
                表示中 {visibleItems.length}件 / 全{items.length}件
              </span>
              <button
                type="button"
                onClick={() => setExpandedIds(new Set())}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink shadow-soft transition hover:border-ink"
              >
                <ChevronUp size={14} aria-hidden />
                すべて閉じる
              </button>
            </div>
          </div>
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
              expanded={expandedIds.has(item.id)}
              issues={issues.filter((issue) => issue.proposedId === item.id)}
              canSave={canSave}
              isSaving={isSaving}
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
            placeholderState={decision.imageReview === "no_image_planned" ? "no-image" : "unconfirmed"}
          />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.reviewStatus} />
              <span className={`rounded-full px-3 py-1 text-xs font-black ${decision.targetType === "existing" ? "bg-ink text-white" : "bg-sun/25 text-amber-900"}`}>
                {decision.targetType === "existing" ? "既存商品へ追記" : "新規商品"}
              </span>
              <ImageReviewBadge value={decision.imageReview} />
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
              <SaveStateBadge dirty={dirty} />
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
          <section className="rounded-2xl border border-park/20 bg-mint p-4">
            <h3 className="text-sm font-black text-ink">採用判断</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <RadioGroup
                label="判断"
                value={decision.decision}
                options={decisionOptions.map((value) => ({ value, label: decisionLabels[value] }))}
                onChange={(value) => {
                  if (value === "register" && decision.imageReview === "wrong") return;
                  onDecisionChange(item.id, (current) => ({ ...current, decision: value as ReviewDecisionValue }));
                }}
              />
              <RadioGroup
                label="画像確認"
                value={decision.imageReview}
                options={imageReviewOptions.map((value) => ({ value, label: imageReviewLabels[value] }))}
                onChange={(value) => onDecisionChange(item.id, (current) => ({ ...current, imageReview: value as ImageReviewValue }))}
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
            {decision.imageReview === "wrong" ? <WarningText>画像が違う商品は「登録する」にできません。修正後に画像確認を変更してください。</WarningText> : null}
            {decision.imageReview === "unconfirmed" ? <WarningText>画像未確認です。登録前に商品画像の一致確認が必要です。</WarningText> : null}
            {decision.decision === "register" && decision.priceReview === "unresolved" ? <WarningText>価格未確認のまま登録判断になっています。登録可能性チェックにも表示されます。</WarningText> : null}
          </section>

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
                  <span key={label} className="rounded-full bg-white px-3 py-1 text-xs font-black text-park ring-1 ring-park/20">
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
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${issues.length > 0 ? "bg-sun/20 text-amber-800" : "bg-mint text-park"}`}>
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
        <p className="mt-5 rounded-xl bg-mint px-4 py-3 text-sm font-black text-park">現在の「登録する」商品には登録可能性チェックの指摘がありません。</p>
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

function MetricCard({ label, value, tone }: { label: string; value: number; tone: "blue" | "gold" | "slate" | "warn" }) {
  const toneClass = {
    blue: "border-park/20 bg-mint text-park",
    gold: "border-sun/40 bg-sun/20 text-amber-900",
    slate: "border-slate-200 bg-white text-ink",
    warn: "border-amber-300 bg-amber-50 text-amber-900"
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${toneClass}`}>
      <p className="text-xs font-black">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className = status === "pending" ? "bg-park text-white" : status === "draft" ? "bg-slate-100 text-slate-700" : "bg-berry text-white";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{status}</span>;
}

function DecisionBadge({ decision }: { decision: ReviewDecisionValue }) {
  const className =
    decision === "register"
      ? "bg-park text-white"
      : decision === "needs_revision"
        ? "bg-sun/25 text-amber-900"
        : decision === "exclude"
          ? "bg-slate-700 text-white"
          : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>判断: {decisionLabels[decision]}</span>;
}

function ImageReviewBadge({ value }: { value: ImageReviewValue }) {
  const className =
    value === "verified"
      ? "bg-mint text-park"
      : value === "wrong"
        ? "bg-berry text-white"
        : value === "no_image_planned"
          ? "bg-slate-700 text-white"
          : "bg-sun/25 text-amber-900";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{imageReviewLabels[value]}</span>;
}

function PriceStatusBadge({ status }: { status: PriceVerificationStatus }) {
  const config =
    status === "official-confirmed"
      ? { label: "価格: 公式確認", className: "bg-mint text-park" }
      : status === "secondary-confirmed"
        ? { label: "価格: 補助情報確認", className: "bg-sun/25 text-amber-900" }
        : { label: "価格: 未確認", className: "bg-slate-100 text-slate-700" };

  return <span className={`rounded-full px-3 py-1 text-xs font-black ${config.className}`}>{config.label}</span>;
}

function SaveStateBadge({ dirty }: { dirty: boolean }) {
  return dirty ? (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">未保存</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">保存済み</span>
  );
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
          const disabled = value === "register" && decision.imageReview === "wrong";
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
      {decision.imageReview === "wrong" ? <p className="mt-2 text-xs font-bold leading-5 text-amber-900">画像が違う商品は登録不可です。</p> : null}
    </div>
  );
}

function RadioGroup({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-black text-slate-600">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-black ${value === option.value ? "border-park bg-white text-park" : "border-slate-200 bg-white text-ink"}`}>
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
      <input value={value} onChange={(event) => onChange(event.currentTarget.value)} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-2 focus:ring-park/10" />
    </label>
  );
}

function TextareaControl({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-600">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} rows={rows} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold leading-6 text-ink outline-none focus:border-park focus:ring-2 focus:ring-park/10" />
    </label>
  );
}

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-ink outline-none focus:border-park focus:ring-2 focus:ring-park/10">
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
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-start gap-2 text-xs font-black leading-5 text-park underline underline-offset-4">
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
    imageUnconfirmed: decisions.filter((decision) => decision.imageReview === "unconfirmed").length,
    priceMissing: decisions.filter((decision) => decision.priceReview === "unresolved").length,
    newItems: decisions.filter((decision) => decision.targetType === "new").length,
    existingItems: decisions.filter((decision) => decision.targetType === "existing").length
  };
}

function matchesFilter(item: ReviewItem, decision: ReviewDecision | undefined, filter: ReviewFilter) {
  if (!decision) return false;
  if (filter === "all") return true;
  if (filter === "pending") return item.reviewStatus === "pending";
  if (filter === "draft") return item.reviewStatus === "draft";
  if (filter === "unreviewed" || filter === "register" || filter === "needs_revision" || filter === "hold" || filter === "exclude") return decision.decision === filter;
  if (filter === "image-wrong") return decision.imageReview === "wrong";
  if (filter === "image-unconfirmed") return decision.imageReview === "unconfirmed";
  if (filter === "price-missing") return decision.priceReview === "unresolved";
  if (filter === "new") return decision.targetType === "new";
  if (filter === "existing") return decision.targetType === "existing";
  return true;
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
  if (decision.imageReview === "wrong" && decision.decision === "register") {
    return { ...decision, decision: "needs_revision" };
  }
  if (decision.targetType === "new" && decision.duplicateAction !== "exclude") {
    return { ...decision, existingFoodId: null, duplicateAction: decision.duplicateAction === "new_manual_food" ? decision.duplicateAction : decision.duplicateAction };
  }
  return decision;
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

function saveMessageClass(tone: "idle" | "success" | "error" | "warn") {
  if (tone === "success") return "text-park";
  if (tone === "error") return "text-berry";
  if (tone === "warn") return "text-amber-900";
  return "text-slate-600";
}

function uniqueText(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function safeDomId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}
