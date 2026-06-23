"use client";

import { ImagePlus, Lock } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
  adminAreaOptions,
  adminCategoryTagOptions,
  adminPublicStateOptions,
  adminSaleStatusOptions,
  getAdminPublicState,
  getAdminSaleState
} from "@/lib/admin-food-ui";
import type { ChangeEventHandler, ReactNode } from "react";
import type { FoodWithRelations } from "@/types/domain";
import type { AdminFoodSaveState } from "@/app/admin/foods/actions";

type AdminFoodFormMode = "new" | "edit";
type AdminSaleStatus = "active" | "paused" | "ended" | "unknown";
type AdminPublicState = "draft" | "published";

type AdminFoodFormProps = {
  mode: AdminFoodFormMode;
  food?: FoodWithRelations;
  shopOptions?: string[];
  action?: (state: AdminFoodSaveState, formData: FormData) => Promise<AdminFoodSaveState>;
  adminNotes?: string | null;
  categoryTags?: string[] | null;
};

const otherShopValue = "__other";
const initialSaveState: AdminFoodSaveState = { ok: false, message: "" };
const disabledSaveAction = async (): Promise<AdminFoodSaveState> => ({ ok: false, message: "Phase 3Aでは既存商品の保存は未実装です。" });

export function AdminFoodForm({ mode, food, shopOptions = [], action, adminNotes, categoryTags }: AdminFoodFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shopSelection, setShopSelection] = useState(() => getInitialShopSelection(food, shopOptions));
  const saveEnabled = Boolean(action);
  const [saveState, formAction, pending] = useActionState(action ?? disabledSaveAction, initialSaveState);
  const selectedCategories = new Set<string>(categoryTags && categoryTags.length > 0 ? categoryTags : food?.category ? [food.category] : []);
  const activeImage = getActiveImage(food);
  const title = mode === "new" ? "商品追加フォーム" : "商品編集フォーム";
  const saleStatus = getFormSaleStatus(food);
  const publicState = getPublicState(food);
  const selectedArea = getInitialArea(food);
  const hiddenState = food?.hidden ? "hidden" : "visible";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <form className="space-y-5" action={formAction}>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Lock className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden />
          <div>
            <h2 className="font-black text-amber-950">{title}はPhase 3Bの最小保存UIです</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
              {mode === "new"
                ? "新規商品だけSupabaseのmanual_foodsへ保存します。画像は自動リサイズしてStorageへ保存します。削除、rollbackはまだ行いません。"
                : "Phase 3Bでは既存商品の編集保存はまだ行いません。表示内容の確認UIとして使います。"}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft lg:grid-cols-2">
        <TextField label="商品名 日本語" name="nameJa" defaultValue={food?.name ?? ""} required />
        <TextField label="商品名 英語" name="nameEn" defaultValue="" placeholder="Phase 3で翻訳seed連携予定" />
        <TextField label="価格" name="price" defaultValue={formatPriceValue(food)} inputMode="numeric" placeholder="例: 800" />
        <SelectField label="エリア" name="area" defaultValue={selectedArea}>
          {adminAreaOptions.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </SelectField>
        <div className="space-y-2">
          <SelectField
            label="店舗"
            name="shopSelection"
            defaultValue={shopSelection}
            onChange={(event) => setShopSelection(event.currentTarget.value)}
          >
            <option value="">店舗を選択</option>
            {shopOptions.map((shop) => (
              <option key={shop} value={shop}>
                {shop}
              </option>
            ))}
            <option value={otherShopValue}>その他（直接入力）</option>
          </SelectField>
          {shopSelection === otherShopValue ? (
            <TextField label="店舗名（その他）" name="shopOther" defaultValue={food?.shop.name ?? ""} placeholder="例: ユニバーサル・マーケット内ハピネス・ワゴン" />
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
              <span className="text-xs font-black text-slate-500">画像ファイル</span>
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
              新規保存時に画像を960x720の商品カード向け比率へ調整し、WebPとしてSupabase Storageへ保存します。
              画像なしでも商品は保存できます。
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-500">保存後は商品一覧へ戻ります。editor/ownerのみ保存できます。</p>
          {saveState.message ? <p className={`text-sm font-black ${saveState.ok ? "text-emerald-700" : "text-rose-700"}`}>{saveState.message}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {mode === "edit" ? (
            <button
              type="submit"
              name="intent"
              value={food?.hidden ? "show" : "hide"}
              disabled
              className="h-11 rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 disabled:cursor-wait disabled:bg-slate-100"
            >
              {food?.hidden ? "再表示する（未実装）" : "非表示にする（未実装）"}
            </button>
          ) : null}
          <button type="submit" disabled={pending || !saveEnabled} className="h-11 rounded-full bg-park px-6 text-sm font-black text-white disabled:cursor-wait disabled:bg-slate-300">
            {pending ? "保存中..." : saveEnabled ? "保存する" : "保存はPhase 3B以降"}
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
  list
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  inputMode?: "numeric";
  placeholder?: string;
  required?: boolean;
  list?: string;
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
  if (!food) return "unknown";
  const status = getAdminSaleState(food);
  if (status === "upcoming") return "unknown";
  return status;
}

function getPublicState(food?: FoodWithRelations): AdminPublicState {
  if (!food) return "draft";
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

function getInitialShopSelection(food: FoodWithRelations | undefined, shopOptions: string[]) {
  if (!food) return "";
  return shopOptions.includes(food.shop.name) ? food.shop.name : otherShopValue;
}
