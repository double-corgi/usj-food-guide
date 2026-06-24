"use client";

import { ImagePlus, Lock } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  adminAreaOptions,
  adminCategoryTagOptions,
  adminPublicStateOptions,
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
const disabledSaveAction = async (): Promise<AdminFoodSaveState> => ({ ok: false, message: "generated商品の保存はできません。" });
const visibleCategoryValues = new Set<string>(adminCategoryTagOptions.map((option) => option.value));
const shopTypeOptions: Array<{ value: ShopType | "all"; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "restaurant", label: "レストラン" },
  { value: "cart", label: "フードカート" },
  { value: "wagon", label: "ワゴン" }
];

export function AdminFoodForm({ mode, food, shopOptions = [], action, visibilityAction, adminNotes, categoryTags, duplicateCandidates = [] }: AdminFoodFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shopSelection, setShopSelection] = useState(() => getInitialShopSelection(food, shopOptions));
  const [shopOther, setShopOther] = useState(() => (food && !hasShopOption(shopOptions, food.shop.name) ? food.shop.name : ""));
  const [shopTypeFilter, setShopTypeFilter] = useState<ShopType | "all">("all");
  const [shopQuery, setShopQuery] = useState("");
  const [nameInput, setNameInput] = useState(food?.name ?? "");
  const [areaSelection, setAreaSelection] = useState(() => getInitialArea(food));
  const saveEnabled = Boolean(action);
  const [saveState, formAction, pending] = useActionState(action ?? disabledSaveAction, initialSaveState);
  const selectedCategories = new Set<string>(categoryTags && categoryTags.length > 0 ? categoryTags : food?.category ? [food.category] : []);
  const activeImage = getActiveImage(food);
  const title = mode === "new" ? "商品追加フォーム" : "商品編集フォーム";
  const saleStatus = getFormSaleStatus(food);
  const publicState = getPublicState(food);
  const hiddenState = food?.hidden ? "hidden" : "visible";
  const preservedHiddenCategories = Array.from(selectedCategories).filter((value) => !visibleCategoryValues.has(value));
  const filteredShopOptions = useMemo(
    () =>
      shopOptions.filter((shop) => {
        if (areaSelection && areaSelection !== "不明" && shop.areaName !== areaSelection) return false;
        if (shopTypeFilter !== "all" && shop.type !== shopTypeFilter) return false;
        if (shopQuery.trim() && !normalizeSearchText(shop.name).includes(normalizeSearchText(shopQuery))) return false;
        return true;
      }),
    [areaSelection, shopOptions, shopQuery, shopTypeFilter]
  );
  const selectedShop = shopOptions.find((shop) => shop.name === shopSelection && (areaSelection === "不明" || shop.areaName === areaSelection));
  const duplicateWarnings =
    mode === "new"
      ? findDuplicateWarnings({
          name: nameInput,
          areaName: areaSelection,
          shopName: shopSelection === otherShopValue ? shopOther : shopSelection,
          candidates: duplicateCandidates
        })
      : [];

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <form className="space-y-5" action={formAction}>
      {food?.id ? <input type="hidden" name="foodId" value={food.id} /> : null}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Lock className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden />
          <div>
            <h2 className="font-black text-amber-950">{title}</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
              {mode === "new"
                ? "必要項目を入力して保存すると公開ページに反映されます。画像は自動でサイズ調整されます。重複候補があれば保存前に警告します。"
                : saveEnabled
                  ? "手動追加した商品だけ保存できます。画像未選択なら既存画像を維持します。非表示にしても管理画面には残ります。"
                  : "generated商品の編集保存はまだ行いません。表示内容の確認UIとして使います。"}
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
                  {candidate.areaName} / {candidate.shopName} / {candidate.source === "manual_foods" ? "手動追加" : "generated"} / {candidate.id}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft lg:grid-cols-2">
        <TextField label="商品名 日本語" name="nameJa" defaultValue={food?.name ?? ""} required onChange={(event) => setNameInput(event.currentTarget.value)} />
        <TextField label="商品名 英語（任意）" name="nameEn" defaultValue="" placeholder="未入力でOK" />
        <TextField label="価格" name="price" defaultValue={formatPriceValue(food)} inputMode="numeric" placeholder="例: 800" required />
        <SelectField
          label="エリア"
          name="area"
          defaultValue={areaSelection}
          onChange={(event) => {
            const nextArea = event.currentTarget.value;
            setAreaSelection(nextArea);
            if (shopSelection && shopSelection !== otherShopValue && !shopOptions.some((shop) => shop.name === shopSelection && (nextArea === "不明" || shop.areaName === nextArea))) {
              setShopSelection("");
            }
          }}
        >
          {adminAreaOptions.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </SelectField>
        <div className="space-y-3 lg:col-span-2">
          <input type="hidden" name="shopSelection" value={shopSelection} />
          <div>
            <p className="text-xs font-black text-slate-500">店舗</p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              エリア、店舗種別、検索で候補を絞れます。見つからない場合は「その他」を選んで入力してください。
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-xs font-black text-slate-500">店舗検索</span>
              <input
                type="search"
                value={shopQuery}
                onChange={(event) => setShopQuery(event.currentTarget.value)}
                placeholder="例: ハピ"
                className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {shopTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setShopTypeFilter(option.value)}
                  className={`h-9 rounded-full border px-3 text-xs font-black ${
                    shopTypeFilter === option.value ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {filteredShopOptions.length > 0 ? (
                filteredShopOptions.map((shop) => (
                  <button
                    key={`${shop.areaName}:${shop.type}:${shop.name}`}
                    type="button"
                    onClick={() => setShopSelection(shop.name)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-bold ${
                      shopSelection === shop.name ? "bg-mint text-park" : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{shop.name}</span>
                    <span className="shrink-0 text-xs text-slate-500">{formatShopType(shop.type)}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm font-bold text-slate-500">該当する店舗候補がありません。</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShopSelection(otherShopValue)}
            className={`h-10 rounded-full border px-4 text-xs font-black ${
              shopSelection === otherShopValue ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            その他（直接入力）
          </button>
          {selectedShop ? (
            <p className="text-xs font-bold text-slate-500">
              選択中: {selectedShop.name} / {selectedShop.areaName} / {formatShopType(selectedShop.type)}
            </p>
          ) : null}
          {shopSelection === otherShopValue ? (
            <TextField label="店舗名（その他）" name="shopOther" defaultValue={shopOther} placeholder="例: ユニバーサル・マーケット内ハピネス・ワゴン" required onChange={(event) => setShopOther(event.currentTarget.value)} />
          ) : null}
        </div>
        <SelectField label="販売状態" name="saleStatus" defaultValue={saleStatus}>
          {adminSaleStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="公開状態" name="publicState" defaultValue={publicState}>
          {adminPublicStateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="表示状態" name="hiddenState" defaultValue={hiddenState}>
          <option value="visible">表示中</option>
          <option value="hidden">非表示</option>
        </SelectField>
        <TextField label="販売期間 start" name="saleStart" defaultValue={food?.saleStartDate ?? food?.startDate ?? ""} type="date" />
        <TextField label="販売期間 end" name="saleEnd" defaultValue={food?.saleEndDate ?? food?.endDate ?? ""} type="date" />
        <label className="block lg:col-span-2">
          <span className="text-xs font-black text-slate-500">管理メモ（公開されません）</span>
          <textarea
            name="memo"
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-park"
            placeholder="調査メモ、未確認事項、Phase 3での保存時注意点"
            defaultValue={adminNotes ?? ""}
          />
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-ink">カテゴリタグ</h2>
        {preservedHiddenCategories.map((value) => (
          <input key={value} type="hidden" name="categoryTags" value={value} />
        ))}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {adminCategoryTagOptions.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
              <input type="checkbox" name="categoryTags" value={value} defaultChecked={selectedCategories.has(value)} className="h-4 w-4 accent-park" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-ink">画像UI</h2>
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
              <span className="text-xs font-black text-slate-500">画像ファイル（保存時にWebP化）</span>
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
              保存時に画像を商品カード向け比率へ自動調整し、WebPとして保存します。
              画像なしでも商品は保存できます。編集時に画像を選ばなければ既存画像を維持します。
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-500">
            保存後は商品詳細へ戻ります。編集者・オーナーのみ保存できます。
          </p>
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
              {saveEnabled ? (food?.hidden ? "再表示する" : "非表示にする") : "generated商品は非表示保存不可"}
            </button>
          ) : null}
          <button type="submit" disabled={pending || !saveEnabled} className="h-12 rounded-full bg-park px-6 text-sm font-black text-white disabled:cursor-wait disabled:bg-slate-300 sm:h-11">
            {pending ? "保存中..." : saveEnabled ? "保存する" : "generated商品は保存不可"}
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
  list,
  onChange
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  inputMode?: "numeric";
  placeholder?: string;
  required?: boolean;
  list?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        list={list}
        onChange={onChange}
        className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
  onChange
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: ReactNode;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <select name={name} defaultValue={defaultValue} onChange={onChange} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park">
        {children}
      </select>
    </label>
  );
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
  const area = food?.area.name;
  return area && adminAreaOptions.some((option) => option === area) ? area : "不明";
}

function getInitialShopSelection(food: FoodWithRelations | undefined, shopOptions: AdminShopOption[]) {
  if (!food) return "";
  return hasShopOption(shopOptions, food.shop.name) ? food.shop.name : otherShopValue;
}

function hasShopOption(shopOptions: AdminShopOption[], shopName: string) {
  return shopOptions.some((shop) => shop.name === shopName);
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
