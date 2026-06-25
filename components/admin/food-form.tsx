"use client";

import { ImagePlus, Lock } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  adminAreaOptions,
  adminCategoryTagOptions,
  adminSaleStatusOptions,
  getAdminPublicState,
  getAdminSaleState
} from "@/lib/admin-food-ui";
import type { ChangeEventHandler, ReactNode } from "react";
import type { FoodWithRelations, ShopType } from "@/types/domain";
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
  adminNotes?: string | null;
  categoryTags?: string[] | null;
  duplicateCandidates?: DuplicateCandidate[];
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

export function AdminFoodForm({ mode, food, shopOptions = [], action, visibilityAction, adminNotes, categoryTags, duplicateCandidates = [] }: AdminFoodFormProps) {
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
  const title = mode === "new" ? "商品追加フォーム" : "商品編集フォーム";
  const sourceKind = mode === "new" || saveEnabled ? "manual" : "generated";
  const saleStatus = getFormSaleStatus(food);
  const publicState = getPublicState(food);
  const [publicStateSelection, setPublicStateSelection] = useState<AdminPublicState>(publicState);
  const hiddenState = food?.hidden ? "hidden" : "visible";
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

  return (
    <form className="space-y-5" action={formAction}>
      {food?.id ? <input type="hidden" name="foodId" value={food.id} /> : null}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Lock className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden />
          <div>
            <h2 className="font-black text-amber-950">{title}</h2>
            {mode === "edit" ? (
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${sourceKind === "manual" ? "bg-white text-park" : "bg-white text-slate-600"}`}>
                {sourceKind === "manual" ? "自分で追加した商品" : "自動取得の商品"}
              </span>
            ) : null}
            <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
              {mode === "new"
                ? "必要項目を入力して保存すると公開ページに反映されます。画像は自動でサイズ調整されます。重複候補があれば保存前に警告します。"
                : saveEnabled
                  ? "自分で追加した商品だけ保存できます。画像を選ばずに保存した場合、今の画像をそのまま残します。非表示にしても管理画面には残ります。"
                  : "自動取得の商品です。保存は次のPhaseで対応します。今は既存値の確認だけできます。"}
            </p>
          </div>
        </div>
      </div>

      {duplicateWarnings.length > 0 ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-black text-amber-950">重複候補があります</h2>
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <SectionHeading step="①" title="基本情報" description="商品名と価格を入力します。英語名は未入力でも保存できます。" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextField
            label="商品名 日本語"
            name="nameJa"
            defaultValue={food?.name ?? ""}
            required
            requirement="required"
            onChange={(event) => setNameInput(event.currentTarget.value)}
          />
          <TextField label="商品名 英語" name="nameEn" defaultValue="" placeholder="未入力でOK" requirement="optional" helpText="英語名は未入力でも保存できます。" />
          <TextField
            label="価格"
            name="price"
            defaultValue={priceInput}
            inputMode="numeric"
            placeholder="例: 800"
            required
            requirement="required"
            onChange={(event) => setPriceInput(event.currentTarget.value)}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <SectionHeading step="②" title="エリア・店舗" description="エリアを先に選ぶと、そのエリアの店舗候補だけを検索できます。" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <SelectField
            label="エリア"
            name="area"
            defaultValue={areaSelection}
            requirement="required"
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-ink">店舗 <RequiredBadge /></p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              1. エリアを選ぶ → 2. 店舗種別で絞る → 3. 店舗名で検索 → 4. 店舗を選ぶ、の順で入力してください。
            </p>
          </div>
          {!hasAreaSelection ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
              先にエリアを選択してください
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
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

          <div className={`rounded-lg border border-slate-200 p-3 ${hasAreaSelection ? "bg-white" : "bg-slate-50 opacity-75"}`}>
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
                className="mt-1 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm font-black text-ink">店舗候補</p>
              <div className="space-y-2">
                {filteredShopOptions.length > 0 ? (
                  visibleShopOptions.map((shop) => (
                    <button
                      key={`${shop.areaName}:${shop.type}:${shop.name}`}
                      type="button"
                      onClick={() => setSelectedShopName(shop.name)}
                      className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-bold ${
                        selectedShopName === shop.name ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-700 hover:border-park"
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
              required
              requirement="required"
              autoComplete="off"
              onChange={(event) => setCustomShopName(event.currentTarget.value)}
            />
          ) : null}
        </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <SectionHeading step="③" title="カテゴリ" description="公開ページの分類と同じカテゴリを1つ以上選びます。" required />
        {preservedHiddenCategories.map((value) => (
          <input key={value} type="hidden" name="categoryTags" value={value} />
        ))}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {adminCategoryTagOptions.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <SectionHeading step="④" title="画像" description="公開する商品には画像が必要です。画像なしでも下書き保存できます。" required />
        <div className="mt-3 grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {previewUrl || activeImage?.imageUrl || food?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl ?? activeImage?.imageUrl ?? food?.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center text-slate-400">
                <ImagePlus size={32} aria-hidden />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-black text-slate-500">画像ファイル <RequiredBadge /> <span className="ml-1 text-slate-400">公開時</span></span>
              <input
                name="imageFile"
                type="file"
                accept="image/*"
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink file:mr-3 file:rounded-full file:border-0 file:bg-mint file:px-3 file:py-1.5 file:text-xs file:font-black file:text-park"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setPreviewUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return file ? URL.createObjectURL(file) : null;
                  });
                }}
              />
            </label>
            <p className="text-sm font-bold leading-6 text-slate-500">
              画像なしでも下書き保存できます。公開する場合は画像が必要です。
              画像は自動で商品カード向けサイズに調整されます。編集時に画像を選ばなければ既存画像を維持します。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <SectionHeading step="⑤" title="公開設定" description="追加画面では「今すぐ公開」だけを選べば十分です。" />
        <div className="mt-4 grid gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input type="hidden" name="publicState" value={publicStateSelection} />
            {mode === "new" ? (
              <>
                <input type="hidden" name="saleStatus" value={saleStatus} />
                <input type="hidden" name="hiddenState" value={hiddenState} />
              </>
            ) : null}
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <SectionHeading step="⑥" title="詳細（任意）" description="販売期間や管理メモは必要なときだけ入力します。" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {mode === "edit" ? (
            <>
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
            </>
          ) : null}
          <TextField label="販売期間 start" name="saleStart" defaultValue={food?.saleStartDate ?? food?.startDate ?? ""} type="date" requirement="optional" />
          <TextField label="販売期間 end" name="saleEnd" defaultValue={food?.saleEndDate ?? food?.endDate ?? ""} type="date" requirement="optional" />
          <label className="block rounded-lg border border-slate-200 bg-slate-50 p-3 lg:col-span-2">
            <span className="flex items-center gap-2 text-xs font-black text-slate-600">
              <Lock size={14} aria-hidden />
              管理メモ <OptionalBadge /> <span className="text-amber-700">公開されません</span>
            </span>
            <textarea
              name="memo"
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-park"
              placeholder="家族向けの確認メモ、未確認事項、あとで直したい内容"
              defaultValue={adminNotes ?? ""}
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-500">
            保存後は商品詳細へ戻ります。編集者・オーナーのみ保存できます。
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
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
        <div className="flex flex-col gap-2 sm:flex-row">
          {mode === "edit" ? (
            <button
              type="submit"
              name="intent"
              value={food?.hidden ? "show" : "hide"}
              formAction={visibilityAction}
              formNoValidate
              disabled={pending || !saveEnabled || !visibilityAction}
              className="h-12 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 sm:h-11"
            >
              {saveEnabled ? (food?.hidden ? "再表示する" : "非表示にする") : "自動取得の商品は非表示にできません"}
            </button>
          ) : null}
          <button type="submit" disabled={pending || !saveEnabled} className="h-12 rounded-full bg-park px-6 text-sm font-black text-white disabled:cursor-wait disabled:bg-slate-300 sm:h-11">
            {pending ? "保存中..." : saveEnabled ? "保存する" : "自動取得の商品は保存できません"}
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
        className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park"
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
      <select name={name} defaultValue={defaultValue} onChange={onChange} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park">
        {children}
      </select>
    </label>
  );
}

function SectionHeading({ step, title, description, required = false }: { step: string; title: string; description: string; required?: boolean }) {
  return (
    <div>
      <p className="text-xs font-black text-park">{step}</p>
      <h2 className="mt-1 flex items-center gap-2 text-lg font-black text-ink">
        {title}
        {required ? <RequiredBadge /> : null}
      </h2>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function RequiredBadge() {
  return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">必須</span>;
}

function OptionalBadge() {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">任意</span>;
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
