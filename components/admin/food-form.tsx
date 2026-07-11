"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { AdminFoodImageViewer } from "@/components/admin/admin-food-image-viewer";
import {
  adminAreaOptions,
  adminCategoryTagOptions,
  adminReviewStatusOptions,
  adminSaleStatusOptions,
  formatAdminDateTime,
  getAdminPublicState,
  getAdminSaleState
} from "@/lib/admin-food-ui";
import type { ChangeEventHandler, ReactNode } from "react";
import type { FoodCollection, FoodVariant, FoodWithRelations, ReviewStatus, ShopType } from "@/types/domain";
import type { AdminFoodSaveState } from "@/app/admin/foods/actions";

type AdminFoodFormMode = "new" | "edit";
type AdminSaleStatus = "active" | "paused" | "ended" | "unknown";
type AdminPublicState = "draft" | "published";

type AdminFoodFormProps = {
  mode: AdminFoodFormMode;
  food?: FoodWithRelations;
  shopOptions?: AdminShopOption[];
  action?: (state: AdminFoodSaveState, formData: FormData) => Promise<AdminFoodSaveState>;
  visibilityAction?: (formData: FormData) => Promise<void>;
  sourceKind?: "manual" | "generated";
  adminNotes?: string | null;
  categoryTags?: string[] | null;
  nameEn?: string | null;
  infoSourceUrl?: string | null;
  duplicateCandidates?: DuplicateCandidate[];
  collections?: FoodCollection[];
};

export type DuplicateCandidate = {
  id: string;
  name: string;
  areaName: string;
  shopName: string;
  source: "generated" | "manual_foods";
};

export type AdminShopOption = {
  name: string;
  areaName: string;
  type: ShopType;
};

const otherShopValue = "__other";
const initialSaveState: AdminFoodSaveState = { ok: false, message: "" };
const disabledSaveAction = async (): Promise<AdminFoodSaveState> => ({ ok: false, message: "自動取得の商品はこの画面では保存できません。" });
const visibleCategoryValues = new Set<string>(adminCategoryTagOptions.map((option) => option.value));
const shopTypeOptions: Array<{ value: ShopType | "all"; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "restaurant", label: "レストラン" },
  { value: "cart", label: "フードカート" },
  { value: "wagon", label: "ワゴン" }
];

type VariantFormRow = {
  key: string;
  id: string;
  label: string;
  price: string;
  isDefault: boolean;
  sortOrder: string;
  sourceUrl: string;
  lastCheckedAt: string;
};

export function AdminFoodForm({
  mode,
  food,
  shopOptions = [],
  action,
  visibilityAction,
  sourceKind: sourceKindProp,
  adminNotes,
  categoryTags,
  nameEn,
  infoSourceUrl,
  duplicateCandidates = [],
  collections = []
}: AdminFoodFormProps) {
  const initialArea = getInitialArea(food);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedShopName, setSelectedShopName] = useState(() => getInitialSelectedShopName(food, shopOptions, initialArea));
  const [customShopName, setCustomShopName] = useState(() => (food && !hasShopOption(shopOptions, food.shop.name, initialArea) ? food.shop.name : ""));
  const [shopTypeFilter, setShopTypeFilter] = useState<ShopType | "all">("all");
  const [shopQuery, setShopQuery] = useState("");
  const [shopResultLimit, setShopResultLimit] = useState(5);
  const [nameInput, setNameInput] = useState(food?.name ?? "");
  const [priceInput, setPriceInput] = useState(formatPriceValue(food));
  const [areaSelection, setAreaSelection] = useState(initialArea);
  const saveEnabled = Boolean(action);
  const [saveState, formAction, pending] = useActionState(action ?? disabledSaveAction, initialSaveState);
  const initialCategoryValues = categoryTags && categoryTags.length > 0 ? categoryTags : food?.category ? [food.category] : [];
  const [selectedCategoryValues, setSelectedCategoryValues] = useState<Set<string>>(
    () => new Set(initialCategoryValues.filter((value) => visibleCategoryValues.has(value)))
  );
  const activeImage = getActiveImage(food);
  const formPreviewImageUrl = previewUrl ?? activeImage?.imageUrl ?? food?.imageUrl ?? "";
  const formPreviewSourceUrl = activeImage?.sourceUrl ?? formatSourceUrlValue(infoSourceUrl ?? food?.sourceUrl);
  const title = mode === "new" ? "商品追加フォーム" : "商品編集フォーム";
  const sourceKind = sourceKindProp ?? "manual";
  const isGeneratedOverride = sourceKind === "generated";
  const coreFieldsRequired = !isGeneratedOverride;
  const imageUploadEnabled = Boolean(action);
  const saleStatus = getFormSaleStatus(food);
  const initialSaleType = food?.saleStartDate || food?.saleEndDate || food?.startDate || food?.endDate || food?.isLimited ? "limited" : "regular";
  const [saleTypeSelection, setSaleTypeSelection] = useState<"regular" | "limited">(initialSaleType);
  const publicState = getPublicState(food);
  const [publicStateSelection, setPublicStateSelection] = useState<AdminPublicState>(publicState);
  const hiddenState = food?.hidden ? "hidden" : "visible";
  const [variantRows, setVariantRows] = useState<VariantFormRow[]>(() => buildInitialVariantRows(food?.variants));
  const defaultReviewStatus = food?.reviewStatus ?? (publicState === "published" ? "approved" : "draft");
  const preservedHiddenCategories = initialCategoryValues.filter((value) => !visibleCategoryValues.has(value));
  const hasAreaSelection = Boolean(areaSelection) && areaSelection !== "不明";
  const filteredShopOptions = useMemo(
    () => {
      if (!hasAreaSelection) return [];
      const matchedShops = shopOptions.filter((shop) => {
        if (shop.areaName !== areaSelection) return false;
        if (shopTypeFilter !== "all" && shop.type !== shopTypeFilter) return false;
        if (shopQuery.trim() && !normalizeSearchText(shop.name).includes(normalizeSearchText(shopQuery))) return false;
        return true;
      });
      const seenShopKeys = new Set<string>();
      return matchedShops.filter((shop) => {
        const key = `${shop.name}:${shop.type}`;
        if (seenShopKeys.has(key)) return false;
        seenShopKeys.add(key);
        return true;
      });
    },
    [areaSelection, hasAreaSelection, shopOptions, shopQuery, shopTypeFilter]
  );
  const visibleShopOptions = filteredShopOptions.slice(0, shopResultLimit);
  const selectedShop = hasAreaSelection ? shopOptions.find((shop) => shop.name === selectedShopName && shop.areaName === areaSelection) : undefined;
  const submittedShopName = hasAreaSelection ? (selectedShopName === otherShopValue ? customShopName : selectedShopName) : "";
  const selectedShopLabel = selectedShop?.name ?? (selectedShopName === otherShopValue && customShopName ? customShopName : null);
  const hasImageForPublish = Boolean(previewUrl || activeImage?.imageUrl || food?.imageUrl);
  const publishChecklist = [
    { label: "商品名", done: Boolean(nameInput.trim()) },
    { label: "価格", done: Boolean(priceInput.trim()) },
    { label: "エリア", done: hasAreaSelection },
    { label: "店舗", done: Boolean(submittedShopName.trim()) },
    { label: "カテゴリ", done: selectedCategoryValues.size > 0 },
    { label: "画像", done: hasImageForPublish }
  ];
  const visibleCollectionIds = new Set(getVisibleCollections(collections).map((collection) => collection.id));
  const preservedCollectionIds = (food?.collectionIds ?? (food?.collectionId ? [food.collectionId] : [])).filter((collectionId) => !visibleCollectionIds.has(collectionId));
  const duplicateWarnings =
    mode === "new"
      ? findDuplicateWarnings({
          name: nameInput,
          areaName: areaSelection,
          shopName: selectedShopName === otherShopValue ? customShopName : selectedShopName,
          candidates: duplicateCandidates
        })
      : [];

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function toggleCategory(value: string, checked: boolean) {
    setSelectedCategoryValues((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(value);
      } else {
        next.delete(value);
      }
      return next;
    });
  }

  function updateVariantRow(key: string, changes: Partial<Omit<VariantFormRow, "key">>) {
    setVariantRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  return (
    <form className="space-y-6" action={formAction}>
      {food?.id ? <input type="hidden" name="foodId" value={food.id} /> : null}
      <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
            <Lock size={18} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-black text-ink">{title}</h2>
            {mode === "edit" ? (
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${sourceKind === "manual" ? "bg-white text-park" : "bg-white text-slate-600"}`}>
                {sourceKind === "manual" ? "自分で追加した商品" : "自動取得の商品"}
              </span>
            ) : null}
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              {mode === "new"
                ? "必須項目を上から入力してください。画像は保存時に自動で商品カード向けに整えます。"
                : saveEnabled
                  ? isGeneratedOverride
                    ? "自動取得の商品です。変更したい基本情報と画像だけ修正内容として保存します。空欄にした項目は元データを使います。"
                    : "自分で追加した商品だけ保存できます。画像を選ばずに保存した場合、今の画像をそのまま残します。非表示にしても管理画面には残ります。"
                  : "自動取得の商品です。保存は次のPhaseで対応します。今は既存値の確認だけできます。"}
            </p>
          </div>
        </div>
      </div>

      {duplicateWarnings.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-soft sm:p-5">
          <h2 className="font-black text-amber-950">似ている商品があります</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
            保存はできますが、同じ商品ではないか確認してください。商品名・エリア・店舗が近い既存データです。
          </p>
          <ul className="mt-3 space-y-2">
            {duplicateWarnings.map((candidate) => (
              <li key={candidate.id} className="rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-700">
                <span className="text-ink">{candidate.name}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {candidate.areaName} / {candidate.shopName} / {candidate.source === "manual_foods" ? "自分で追加" : "自動取得"} / {candidate.id}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <SectionHeading step="①" title="基本情報" description="商品名と価格を入力します。英語名は未入力でも保存できます。" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextField
            label="商品名 日本語"
            name="nameJa"
            defaultValue={food?.name ?? ""}
            required={coreFieldsRequired}
            requirement={coreFieldsRequired ? "required" : "optional"}
            onChange={(event) => setNameInput(event.currentTarget.value)}
          />
          <TextField label="商品名 英語" name="nameEn" defaultValue={nameEn ?? ""} placeholder="未入力でOK" requirement="optional" helpText="英語名は未入力でも保存できます。" />
          <TextField
            label="価格"
            name="price"
            defaultValue={priceInput}
            inputMode="numeric"
            placeholder="例: 800"
            required={coreFieldsRequired}
            requirement={coreFieldsRequired ? "required" : "optional"}
            onChange={(event) => setPriceInput(event.currentTarget.value)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <SectionHeading step="②" title="エリア・店舗" description="エリアを先に選ぶと、そのエリアの店舗候補だけを検索できます。" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <SelectField
            label="エリア"
            name="area"
            defaultValue={areaSelection}
            requirement={coreFieldsRequired ? "required" : "optional"}
            onChange={(event) => {
              const nextArea = event.currentTarget.value;
              setAreaSelection(nextArea);
              setShopResultLimit(5);
              if (!nextArea || nextArea === "不明") {
                setSelectedShopName("");
                setCustomShopName("");
                setShopQuery("");
                return;
              }
              if (selectedShopName && selectedShopName !== otherShopValue && !hasShopOption(shopOptions, selectedShopName, nextArea)) {
                setSelectedShopName("");
              }
            }}
          >
            <option value="" disabled>
              エリアを選択
            </option>
            {adminAreaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </SelectField>
          <div className="space-y-3 lg:col-span-2">
          <input type="hidden" name="shopName" value={submittedShopName} />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-ink">店舗 {coreFieldsRequired ? <RequiredBadge /> : <OptionalBadge />}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              1. エリアを選ぶ → 2. 店舗種別で絞る → 3. 店舗名で検索 → 4. 店舗を選ぶ、の順で入力してください。
            </p>
          </div>
          {!hasAreaSelection ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
              先にエリアを選択してください
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black text-slate-500">選択済み店舗</p>
              <p className="mt-1 text-base font-black text-ink">{selectedShopLabel ? `選択中: ${selectedShopLabel}` : "店舗未選択"}</p>
              {selectedShop ? (
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {selectedShop.areaName} / {formatShopType(selectedShop.type)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedShopName("");
                setCustomShopName("");
              }}
              disabled={!selectedShopLabel}
              className="h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              解除
            </button>
          </div>

          <div className={`rounded-2xl border border-slate-200 p-4 ${hasAreaSelection ? "bg-white shadow-sm" : "bg-slate-50 opacity-75"}`}>
            <label className="block">
              <span className="text-sm font-black text-ink">店舗検索</span>
              <input
                type="search"
                value={shopQuery}
                onChange={(event) => {
                  setShopQuery(event.currentTarget.value);
                  setShopResultLimit(5);
                }}
                placeholder={hasAreaSelection ? "店舗名で検索（例: ハピネス）" : "先にエリアを選択してください"}
                disabled={!hasAreaSelection}
                autoComplete="off"
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-park focus:ring-4 focus:ring-mint disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </label>

            {hasAreaSelection ? (
              <div className="mt-3">
                <p className="mb-1 text-sm font-black text-ink">店舗種別</p>
                <div className="flex flex-wrap gap-1.5">
                  {shopTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setShopTypeFilter(option.value);
                        setShopResultLimit(5);
                      }}
                      className={`h-10 rounded-full border px-4 text-xs font-black ${
                        shopTypeFilter === option.value ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {hasAreaSelection ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm font-black text-ink">店舗候補</p>
              <div className="space-y-2">
                {filteredShopOptions.length > 0 ? (
                  visibleShopOptions.map((shop) => (
                    <button
                      key={`${shop.areaName}:${shop.type}:${shop.name}`}
                      type="button"
                      onClick={() => setSelectedShopName(shop.name)}
                      className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold shadow-sm transition ${
                        selectedShopName === shop.name ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-park"
                      }`}
                    >
                      <span>{shop.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">{formatShopType(shop.type)}</span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-lg bg-white px-4 py-3 text-sm font-bold text-slate-500">該当する店舗候補がありません。</p>
                )}
                {filteredShopOptions.length > visibleShopOptions.length ? (
                  <button
                    type="button"
                    onClick={() => setShopResultLimit((current) => current + 5)}
                    className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-park"
                  >
                    さらに表示（残り {filteredShopOptions.length - visibleShopOptions.length} 件）
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setSelectedShopName(otherShopValue)}
                className={`mt-3 min-h-12 w-full rounded-lg border px-4 py-3 text-left text-sm font-black ${
                  selectedShopName === otherShopValue ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                その他（直接入力）
              </button>
            </div>
          ) : null}
          {selectedShopName === otherShopValue ? (
            <TextField
              label="店舗名（その他）"
              name="customShopName"
              defaultValue={customShopName}
              placeholder="例: ユニバーサル・マーケット内ハピネス・ワゴン"
              required={coreFieldsRequired}
              requirement={coreFieldsRequired ? "required" : "optional"}
              autoComplete="off"
              onChange={(event) => setCustomShopName(event.currentTarget.value)}
            />
          ) : null}
        </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <SectionHeading step="③" title="カテゴリ" description="公開ページの分類と同じカテゴリを選びます。自動取得の商品では未選択にすると元のカテゴリを使います。" required={coreFieldsRequired} />
        {preservedHiddenCategories.map((value) => (
          <input key={value} type="hidden" name="categoryTags" value={value} />
        ))}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {adminCategoryTagOptions.map(({ value, label }) => (
            <label key={value} className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition has-[:checked]:border-park has-[:checked]:bg-mint">
              <input
                type="checkbox"
                name="categoryTags"
                value={value}
                checked={selectedCategoryValues.has(value)}
                onChange={(event) => toggleCategory(value, event.currentTarget.checked)}
                className="h-4 w-4 accent-park"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <SectionHeading step="④" title="販売区分・特集タグ・価格" description="期間限定や2026夏限定の掲載先を選びます。特集タグだけでは公開されません。" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
            <p className="text-sm font-black text-ink">販売区分</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">期間限定を選ぶと販売開始日・終了日を入力できます。日付が分からない場合は空欄で保存できます。</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 has-[:checked]:border-park has-[:checked]:bg-mint has-[:checked]:text-park">
                <input type="radio" name="saleType" value="regular" checked={saleTypeSelection === "regular"} onChange={() => setSaleTypeSelection("regular")} className="accent-park" />
                通常販売
              </label>
              <label className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 has-[:checked]:border-park has-[:checked]:bg-mint has-[:checked]:text-park">
                <input type="radio" name="saleType" value="limited" checked={saleTypeSelection === "limited"} onChange={() => setSaleTypeSelection("limited")} className="accent-park" />
                期間限定
              </label>
            </div>
            {saleTypeSelection === "limited" ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <TextField label="販売開始日" name="saleStart" defaultValue={food?.saleStartDate ?? food?.startDate ?? ""} type="date" requirement="optional" />
                <TextField label="販売終了日" name="saleEnd" defaultValue={food?.saleEndDate ?? food?.endDate ?? ""} type="date" requirement="optional" />
              </div>
            ) : (
              <>
                <input type="hidden" name="saleStart" value="" />
                <input type="hidden" name="saleEnd" value="" />
              </>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <p className="text-sm font-black text-ink">特集タグ</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">ONにすると対象の特集一覧に入ります。公開するには下の「保存して公開」も必要です。</p>
            {preservedCollectionIds.map((collectionId) => (
              <input key={collectionId} type="hidden" name="collectionIds" value={collectionId} />
            ))}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {getVisibleCollections(collections).map((collection) => {
                const checked = (food?.collectionIds ?? (food?.collectionId ? [food.collectionId] : [])).includes(collection.id);
                return (
                  <label key={collection.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 has-[:checked]:border-park has-[:checked]:bg-mint has-[:checked]:text-park">
                    <span className="flex items-start gap-2">
                      <input type="checkbox" name="collectionIds" value={collection.id} defaultChecked={checked} className="mt-1 h-4 w-4 accent-park" />
                      <span>
                        <span className="block font-black">{formatCollectionAdminLabel(collection)}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">ONにすると、対応する特集一覧に掲載できます。</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <SelectField label="公開状態（詳細）" name="reviewStatus" defaultValue={defaultReviewStatus} requirement="required">
            {adminReviewStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatReviewStatusForOperator(option.value)}
              </option>
            ))}
          </SelectField>
          <TextField
            label="初回公開日時"
            name="publishedAt"
            type="datetime-local"
            defaultValue={formatDateTimeLocalValue(food?.publishedAt)}
            requirement="optional"
            helpText={`未入力の場合、初めて公開にした時だけ自動で入ります。現在: ${formatAdminDateTime(food?.publishedAt)}`}
          />
          <TextField
            label="公式参照URL"
            name="infoSourceUrl"
            defaultValue={formatSourceUrlValue(infoSourceUrl ?? food?.sourceUrl)}
            placeholder="https://..."
            requirement="optional"
            helpText="未入力の場合は現在の参照元をそのまま使います。"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-black text-ink">価格バリエーション</h3>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">単品、カップ付き、セットなどを同じ商品内に登録します。既定価格は公開画面の価格として使われます。</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setVariantRows((current) => [
                  ...current,
                  {
                    key: `new-${Date.now()}-${current.length}`,
                    id: "",
                    label: "",
                    price: "",
                    isDefault: current.length === 0,
                    sortOrder: String((current.length + 1) * 10),
                    sourceUrl: "",
                    lastCheckedAt: ""
                  }
                ])
              }
              className="h-10 rounded-full bg-park px-4 text-xs font-black text-white"
            >
              価格行を追加
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {variantRows.length > 0 ? (
              variantRows.map((variant, index) => (
                <div key={variant.key} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <input type="hidden" name="variantKey" value={variant.key} />
                  <input type="hidden" name="variantId" value={variant.id} />
                  <div className="grid gap-3 lg:grid-cols-[1.3fr_110px_86px_1.4fr_150px_auto] lg:items-end">
                    <TextField
                      label="ラベル"
                      name="variantLabel"
                      defaultValue={variant.label}
                      placeholder="例: 単品"
                      onChange={(event) => updateVariantRow(variant.key, { label: event.currentTarget.value })}
                    />
                    <TextField
                      label="価格"
                      name="variantPrice"
                      inputMode="numeric"
                      defaultValue={variant.price}
                      placeholder="800"
                      onChange={(event) => updateVariantRow(variant.key, { price: event.currentTarget.value })}
                    />
                    <TextField
                      label="並び順"
                      name="variantSortOrder"
                      inputMode="numeric"
                      defaultValue={variant.sortOrder}
                      onChange={(event) => updateVariantRow(variant.key, { sortOrder: event.currentTarget.value })}
                    />
                    <TextField
                      label="参照URL"
                      name="variantSourceUrl"
                      defaultValue={variant.sourceUrl}
                      placeholder="https://..."
                      onChange={(event) => updateVariantRow(variant.key, { sourceUrl: event.currentTarget.value })}
                    />
                    <TextField
                      label="確認日"
                      name="variantLastCheckedAt"
                      type="date"
                      defaultValue={variant.lastCheckedAt}
                      onChange={(event) => updateVariantRow(variant.key, { lastCheckedAt: event.currentTarget.value })}
                    />
                    <div className="flex items-center gap-2 lg:justify-end">
                      <label className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">
                        <input
                          type="radio"
                          name="variantDefaultKey"
                          value={variant.key}
                          checked={variant.isDefault}
                          onChange={() => setVariantRows((current) => current.map((row) => ({ ...row, isDefault: row.key === variant.key })))}
                          className="accent-park"
                        />
                        既定
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setVariantRows((current) => {
                            const next = current.filter((row) => row.key !== variant.key);
                            if (variant.isDefault && next.length > 0 && !next.some((row) => row.isDefault)) {
                              next[0] = { ...next[0], isDefault: true };
                            }
                            return next;
                          })
                        }
                        className="h-10 rounded-full border border-rose-100 bg-rose-50 px-3 text-xs font-black text-rose-700"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  {index === 0 ? <p className="mt-2 text-xs font-bold text-slate-500">価格行がない場合は従来の価格を使います。</p> : null}
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-500">価格バリエーションは未設定です。従来の価格を使います。</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <SectionHeading step="⑤" title="画像" description={isGeneratedOverride ? "画像を選ぶと、元画像は残したまま修正画像として保存します。未選択なら現在の画像を維持します。" : "公開する商品には画像が必要です。画像なしでも下書き保存できます。"} required={!isGeneratedOverride} />
        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
          <AdminFoodImageViewer
            src={formPreviewImageUrl}
            alt={`${nameInput || food?.name || "商品"}の保存前画像プレビュー`}
            sourceUrl={formPreviewSourceUrl}
            label={previewUrl ? "保存前プレビュー" : "現在の画像"}
            variant="form"
            placeholderState="no-image"
            zoomable
          />
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-black text-slate-500">
                画像ファイル {isGeneratedOverride ? <OptionalBadge /> : <RequiredBadge />} <span className="ml-1 text-slate-400">{isGeneratedOverride ? "確認のみ" : "公開時"}</span>
              </span>
              <input
                name="imageFile"
                type="file"
                accept="image/*"
                disabled={!imageUploadEnabled}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-ink shadow-sm file:mr-3 file:rounded-full file:border-0 file:bg-park file:px-4 file:py-2 file:text-xs file:font-black file:text-white"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setPreviewUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return file ? URL.createObjectURL(file) : null;
                  });
                }}
              />
            </label>
            <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-900">
              {isGeneratedOverride
                ? "画像を選んで保存すると、修正画像として商品カード向けサイズに自動調整されます。画像を選ばなければ現在の画像を維持します。"
                : "画像なしでも下書き保存できます。公開する場合は画像が必要です。画像は自動で商品カード向けサイズに調整されます。編集時に画像を選ばなければ既存画像を維持します。"}
            </p>
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-600">
              出典URLは「公式参照URL」欄または既存画像のsourceUrlを表示します。画像をクリックしても保存は実行されません。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
        <SectionHeading step="⑥" title="公開設定" description="追加画面では「今すぐ公開」だけを選べば十分です。" />
        <div className="mt-4 grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input type="hidden" name="publicState" value={publicStateSelection} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-ink">今すぐ公開</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  ONにすると保存後に公開ページへ反映されます。OFFなら下書きとして保存します。
                </p>
              </div>
              <button
                type="button"
                aria-pressed={publicStateSelection === "published"}
                onClick={() => setPublicStateSelection((current) => (current === "published" ? "draft" : "published"))}
                className={`flex h-12 w-full items-center justify-between rounded-full border px-2 text-sm font-black sm:w-44 ${
                  publicStateSelection === "published" ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-full ${publicStateSelection === "published" ? "bg-park text-white" : "bg-slate-200 text-slate-500"}`}>
                  {publicStateSelection === "published" ? "ON" : "OFF"}
                </span>
                <span className="pr-3">{publicStateSelection === "published" ? "公開" : "下書き"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <CollapsibleSection step="⑦" title="詳細（任意）" description="販売期間や管理メモを入力できます。必要なときだけ開いてください。">
        <div className="grid gap-4 lg:grid-cols-2">
          <SelectField label="販売状態" name="saleStatus" defaultValue={saleStatus} requirement="required">
            {adminSaleStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <SelectField label="表示状態" name="hiddenState" defaultValue={hiddenState}>
            <option value="visible">表示中</option>
            <option value="hidden">非表示</option>
          </SelectField>
          <label className="block rounded-2xl border border-amber-100 bg-amber-50 p-4 lg:col-span-2">
            <span className="flex items-center gap-2 text-xs font-black text-slate-600">
              <Lock size={14} aria-hidden />
              管理メモ <OptionalBadge /> <span className="text-amber-700">公開されません</span>
            </span>
            <textarea
              name="memo"
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink outline-none transition focus:border-park focus:ring-4 focus:ring-mint"
              placeholder="家族向けの確認メモ、未確認事項、あとで直したい内容"
              defaultValue={adminNotes ?? ""}
            />
          </label>
        </div>
      </CollapsibleSection>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-soft sm:p-5">
        <h2 className="text-lg font-black text-amber-950">別の商品だった場合</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
          別の商品だった場合は、この商品を非表示または削除し、正しい商品を新規追加してください。foodIdを別の商品へ使い回さないでください。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/foods/new" className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-xs font-black text-white">正しい商品を新規追加</Link>
          {mode === "edit" ? <span className="inline-flex h-10 items-center rounded-full border border-amber-300 bg-white px-4 text-xs font-black text-amber-900">この商品は下の操作から非表示・削除できます</span> : null}
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl border border-park/20 bg-white p-4 shadow-soft sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
            <p className="text-sm font-bold text-slate-500">
            {isGeneratedOverride ? "保存後は商品詳細へ戻ります。元データは直接変更せず、修正内容だけを保存します。" : "保存後は商品詳細へ戻ります。編集者・オーナーのみ保存できます。"}
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-black text-ink">公開準備チェック</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              公開には商品名・価格・エリア・店舗・カテゴリ・画像が必要です。下書き保存なら画像なしでも保存できます。
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {publishChecklist.map((item) => (
                <span
                  key={item.label}
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${item.done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
                >
                  {item.done ? "☑" : "☐"} {item.label}
                </span>
              ))}
            </div>
          </div>
          {saveState.message ? <p className={`text-sm font-black ${saveState.ok ? "text-emerald-700" : "text-rose-700"}`}>{saveState.message}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          {mode === "edit" ? (
            <button
              type="submit"
              name="intent"
              value={food?.hidden ? "show" : "hide"}
              formAction={visibilityAction}
              formNoValidate
              disabled={pending || !saveEnabled || !visibilityAction}
              className="h-12 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 sm:h-11"
            >
              {saveEnabled ? (food?.hidden ? "再表示する" : "非表示にする") : "自動取得の商品は非表示にできません"}
            </button>
          ) : null}
          <button type="submit" name="saveMode" value="draft" disabled={pending || !saveEnabled} className="h-12 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-wait disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:translate-y-0 sm:h-11">
            {pending ? "保存中..." : saveEnabled ? "下書き保存" : "保存できません"}
          </button>
          <button type="submit" name="saveMode" value="publish" disabled={pending || !saveEnabled} className="h-12 rounded-full bg-park px-7 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-wait disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0 sm:h-11">
            {pending ? "保存中..." : saveEnabled ? (isGeneratedOverride ? "修正して公開" : "保存して公開") : "保存できません"}
          </button>
        </div>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  inputMode,
  placeholder,
  required = false,
  autoComplete,
  requirement,
  helpText,
  onChange
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  inputMode?: "numeric";
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  requirement?: "required" | "optional";
  helpText?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-black text-slate-500">
        {label}
        {requirement === "required" ? <RequiredBadge /> : null}
        {requirement === "optional" ? <OptionalBadge /> : null}
      </span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        onChange={onChange}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-park focus:ring-4 focus:ring-mint"
      />
      {helpText ? <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{helpText}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
  requirement,
  onChange
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
  requirement?: "required" | "optional";
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-black text-slate-500">
        {label}
        {requirement === "required" ? <RequiredBadge /> : null}
        {requirement === "optional" ? <OptionalBadge /> : null}
      </span>
      <select name={name} defaultValue={defaultValue} onChange={onChange} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-ink outline-none transition focus:border-park focus:ring-4 focus:ring-mint">
        {children}
      </select>
    </label>
  );
}

function SectionHeading({ step, title, description, required = false }: { step: string; title: string; description: string; required?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-sm font-black text-park">
        {step}
      </span>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-ink">
          {title}
          {required ? <RequiredBadge /> : null}
        </h2>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function CollapsibleSection({ step, title, description, children }: { step: string; title: string; description: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl outline-none transition focus-visible:ring-4 focus-visible:ring-mint [&::-webkit-details-marker]:hidden">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-sm font-black text-park">
            {step}
          </span>
          <div>
            <h2 className="text-lg font-black text-ink">{title}</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 group-open:hidden">
          開く
        </span>
        <span className="hidden shrink-0 rounded-full bg-mint px-3 py-1 text-xs font-black text-park group-open:inline-flex">
          閉じる
        </span>
      </summary>
      <div className="mt-4 border-t border-slate-100 pt-4">{children}</div>
    </details>
  );
}

function RequiredBadge() {
  return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">必須</span>;
}

function OptionalBadge() {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">任意</span>;
}

function getVisibleCollections(collections: FoodCollection[]) {
  return collections.filter((collection) => collection.isFeatured || collection.id === "summer-2026");
}

function formatCollectionAdminLabel(collection: FoodCollection) {
  if (collection.id === "summer-2026") return "2026夏限定";
  return collection.name;
}

function formatReviewStatusForOperator(value: string) {
  if (value === "approved") return "公開中";
  if (value === "pending" || value === "draft") return "下書き";
  if (value === "rejected") return "差し戻し";
  return value;
}

function getActiveImage(food?: FoodWithRelations) {
  return food?.images.find((image) => image.enabled) ?? food?.images[0];
}

function getFormSaleStatus(food?: FoodWithRelations): AdminSaleStatus {
  if (!food) return "active";
  const status = getAdminSaleState(food);
  if (status === "upcoming") return "unknown";
  return status;
}

function getPublicState(food?: FoodWithRelations): AdminPublicState {
  if (!food) return "published";
  return getAdminPublicState(food);
}

function formatPriceValue(food?: FoodWithRelations) {
  if (!food) return "";
  if (typeof food.price === "number") return String(food.price);
  if (typeof food.priceMin === "number" && typeof food.priceMax === "number") return `${food.priceMin}-${food.priceMax}`;
  if (typeof food.priceMin === "number") return String(food.priceMin);
  return "";
}

function buildInitialVariantRows(variants?: FoodVariant[]): VariantFormRow[] {
  return (variants ?? [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((variant, index) => ({
      key: variant.id || `variant-${index}`,
      id: variant.id,
      label: variant.label,
      price: typeof variant.price === "number" ? String(variant.price) : "",
      isDefault: variant.isDefault,
      sortOrder: String(variant.sortOrder),
      sourceUrl: variant.sourceUrl ?? "",
      lastCheckedAt: formatDateValue(variant.lastCheckedAt)
    }));
}

function formatDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatDateValue(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatSourceUrlValue(value?: string | null) {
  if (!value || value === "manual-admin") return "";
  if (!/^https?:\/\//.test(value)) return "";
  return value;
}

function getInitialArea(food?: FoodWithRelations) {
  if (!food) return "";
  const area = food?.area.name;
  return area && adminAreaOptions.some((option) => option === area) ? area : "不明";
}

function getInitialSelectedShopName(food: FoodWithRelations | undefined, shopOptions: AdminShopOption[], areaName: string) {
  if (!food) return "";
  return hasShopOption(shopOptions, food.shop.name, areaName) ? food.shop.name : otherShopValue;
}

function hasShopOption(shopOptions: AdminShopOption[], shopName: string, areaName?: string) {
  return shopOptions.some((shop) => shop.name === shopName && (!areaName || areaName === "不明" || shop.areaName === areaName));
}

function formatShopType(type: ShopType) {
  if (type === "restaurant") return "レストラン";
  if (type === "cart") return "フードカート";
  if (type === "wagon") return "ワゴン";
  return "種別不明";
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[ \s　・･〜~ー\-—＿_「」『』（）()【】[\]]/g, "")
    .trim();
}

function findDuplicateWarnings({
  name,
  areaName,
  shopName,
  candidates
}: {
  name: string;
  areaName: string;
  shopName: string;
  candidates: DuplicateCandidate[];
}) {
  const normalizedName = normalizeComparableText(name);
  if (normalizedName.length < 3) return [];
  const normalizedArea = normalizeComparableText(areaName);
  const normalizedShop = normalizeComparableText(shopName);

  return candidates
    .filter((candidate) => {
      const candidateName = normalizeComparableText(candidate.name);
      if (!candidateName) return false;
      const nameIsClose =
        candidateName === normalizedName ||
        candidateName.includes(normalizedName) ||
        normalizedName.includes(candidateName) ||
        getSharedPrefixLength(candidateName, normalizedName) >= 6;
      if (!nameIsClose) return false;

      const candidateArea = normalizeComparableText(candidate.areaName);
      const candidateShop = normalizeComparableText(candidate.shopName);
      const areaIsClose = normalizedArea && candidateArea ? normalizedArea === candidateArea : true;
      const shopIsClose =
        normalizedShop && candidateShop
          ? candidateShop === normalizedShop || candidateShop.includes(normalizedShop) || normalizedShop.includes(candidateShop)
          : true;
      return areaIsClose || shopIsClose;
    })
    .slice(0, 5);
}

function normalizeComparableText(value: string) {
  return value
    .toLowerCase()
    .replace(/[ \s　・･〜~ー\-—＿_「」『』（）()【】[\]]/g, "")
    .trim();
}

function getSharedPrefixLength(left: string, right: string) {
  let length = 0;
  while (length < left.length && length < right.length && left[length] === right[length]) {
    length += 1;
  }
  return length;
}
