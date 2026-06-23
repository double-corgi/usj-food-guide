"use client";

import { ImagePlus, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { categoryLabels } from "@/lib/constants";
import type { ReactNode } from "react";
import type { FoodCategory, FoodWithRelations } from "@/types/domain";

type AdminFoodFormMode = "new" | "edit";
type AdminSaleStatus = "active" | "paused" | "ended" | "unknown";
type AdminPublicState = "draft" | "published";

type AdminFoodFormProps = {
  mode: AdminFoodFormMode;
  food?: FoodWithRelations;
  areaOptions?: string[];
  shopOptions?: string[];
};

const categoryOptions = Object.entries(categoryLabels) as Array<[FoodCategory, string]>;
const saleStatusOptions: AdminSaleStatus[] = ["active", "paused", "ended", "unknown"];
const publicStateOptions: AdminPublicState[] = ["draft", "published"];

export function AdminFoodForm({ mode, food, areaOptions = [], shopOptions = [] }: AdminFoodFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const selectedCategories = new Set<FoodCategory>(food?.category ? [food.category] : []);
  const activeImage = getActiveImage(food);
  const title = mode === "new" ? "商品追加フォーム" : "商品編集フォーム";
  const saleStatus = getFormSaleStatus(food);
  const publicState = getPublicState(food);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Lock className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden />
          <div>
            <h2 className="font-black text-amber-950">{title}はPhase 2のUI確認用です</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-amber-900">
              Phase 3で保存機能を実装予定です。現在はDB保存、画像保存、公開反映、hidden/paused/endedの永続変更を行いません。
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft lg:grid-cols-2">
        <TextField label="商品名 日本語" name="nameJa" defaultValue={food?.name ?? ""} required />
        <TextField label="商品名 英語" name="nameEn" defaultValue="" placeholder="Phase 3で翻訳seed連携予定" />
        <TextField label="価格" name="price" defaultValue={formatPriceValue(food)} inputMode="numeric" placeholder="例: 800" />
        <TextField label="エリア" name="area" defaultValue={food?.area.name ?? ""} list="admin-food-area-options" />
        <TextField label="店舗" name="shop" defaultValue={food?.shop.name ?? ""} list="admin-food-shop-options" />
        <SelectField label="販売状態" name="saleStatus" defaultValue={saleStatus}>
          {saleStatusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </SelectField>
        <SelectField label="公開状態" name="publicState" defaultValue={publicState}>
          {publicStateOptions.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </SelectField>
        <TextField label="販売期間 start" name="saleStart" defaultValue={food?.saleStartDate ?? food?.startDate ?? ""} type="date" />
        <TextField label="販売期間 end" name="saleEnd" defaultValue={food?.saleEndDate ?? food?.endDate ?? ""} type="date" />
        <TextField label="画像出典URL" name="imageSourceUrl" defaultValue={activeImage?.sourceUrl ?? ""} type="url" />
        <TextField label="商品情報出典URL" name="sourceUrl" defaultValue={food?.sourceUrl ?? ""} type="url" />
        <label className="block lg:col-span-2">
          <span className="text-xs font-black text-slate-500">メモ</span>
          <textarea
            name="memo"
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-park"
            placeholder="調査メモ、未確認事項、Phase 3での保存時注意点"
            defaultValue=""
          />
        </label>
        <datalist id="admin-food-area-options">
          {areaOptions.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
        <datalist id="admin-food-shop-options">
          {shopOptions.map((shop) => (
            <option key={shop} value={shop} />
          ))}
        </datalist>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-black text-ink">カテゴリタグ</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {categoryOptions.map(([value, label]) => (
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
              Phase 2では選択した画像をブラウザ内でプレビューするだけです。アップロード、保存、public画像追加は行いません。
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-500">保存ボタンはPhase 2では意図的に無効です。</p>
        <button type="submit" disabled className="h-11 cursor-not-allowed rounded-full bg-slate-200 px-6 text-sm font-black text-slate-500">
          保存はPhase 3で実装予定
        </button>
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

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <select name={name} defaultValue={defaultValue} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park">
        {children}
      </select>
    </label>
  );
}

function getActiveImage(food?: FoodWithRelations) {
  return food?.images.find((image) => image.enabled) ?? food?.images[0];
}

function getFormSaleStatus(food?: FoodWithRelations): AdminSaleStatus {
  if (food?.saleStatus === "active" || food?.saleStatus === "ended" || food?.saleStatus === "unknown") return food.saleStatus;
  if (food?.status === "active") return "active";
  if (food?.status === "ended") return "ended";
  return "unknown";
}

function getPublicState(food?: FoodWithRelations): AdminPublicState {
  if (!food) return "draft";
  return food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden ? "published" : "draft";
}

function formatPriceValue(food?: FoodWithRelations) {
  if (!food) return "";
  if (typeof food.price === "number") return String(food.price);
  if (typeof food.priceMin === "number" && typeof food.priceMax === "number") return `${food.priceMin}-${food.priceMax}`;
  if (typeof food.priceMin === "number") return String(food.priceMin);
  return "";
}
