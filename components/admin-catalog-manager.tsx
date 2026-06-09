"use client";

import { Download, EyeOff, Pencil, Plus, Save, Store, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { categoryLabels, shopTypeLabels } from "@/lib/constants";
import type { FoodCategory, SaleStatus, ShopType } from "@/types/domain";

type AdminFood = {
  id: string;
  name: string;
  imageUrl: string;
  price: number | null;
  shopName: string;
  areaName: string;
  category: FoodCategory;
  isLimited: boolean;
  isAnniversary25: boolean;
  saleStatus: SaleStatus;
  hidden: boolean;
  description: string;
  officialUrl: string;
};

type AdminStore = {
  id: string;
  name: string;
  areaName: string;
  type: ShopType;
  imageUrl: string;
  description: string;
  officialUrl: string;
  hidden: boolean;
};

type AdminArea = {
  id: string;
  name: string;
  sortOrder: number;
};

type DraftState = {
  foods: Array<Partial<AdminFood> & { id: string; operation: "add" | "edit" | "hide" }>;
  stores: Array<Partial<AdminStore> & { id: string; operation: "add" | "edit" | "hide" }>;
  areas: Array<Partial<AdminArea> & { id: string; operation: "edit" }>;
  updatedAt?: string;
};

const storageKey = "unicore-admin-catalog-drafts-v1";
const defaultDrafts: DraftState = { foods: [], stores: [], areas: [] };

export function AdminCatalogManager({ foods, stores, areas }: { foods: AdminFood[]; stores: AdminStore[]; areas: AdminArea[] }) {
  const [drafts, setDrafts] = useState<DraftState>(() => {
    if (typeof window === "undefined") return defaultDrafts;
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as DraftState) : defaultDrafts;
    } catch {
      return defaultDrafts;
    }
  });
  const [foodQuery, setFoodQuery] = useState("");
  const [storeQuery, setStoreQuery] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState(foods[0]?.id ?? "");
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id ?? "");
  const selectedFood = foods.find((food) => food.id === selectedFoodId) ?? foods[0];
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0];
  const selectedArea = areas.find((area) => area.id === selectedAreaId) ?? areas[0];

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(drafts));
  }, [drafts]);

  const filteredFoods = useMemo(() => {
    const query = foodQuery.trim().toLowerCase();
    return foods
      .filter((food) => !query || `${food.name} ${food.shopName} ${food.areaName}`.toLowerCase().includes(query))
      .slice(0, 80);
  }, [foods, foodQuery]);

  const filteredStores = useMemo(() => {
    const query = storeQuery.trim().toLowerCase();
    return stores
      .filter((store) => !query || `${store.name} ${store.areaName}`.toLowerCase().includes(query))
      .slice(0, 80);
  }, [stores, storeQuery]);

  function upsertFoodDraft(draft: DraftState["foods"][number]) {
    setDrafts((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      foods: [...current.foods.filter((item) => item.id !== draft.id), draft]
    }));
  }

  function upsertStoreDraft(draft: DraftState["stores"][number]) {
    setDrafts((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      stores: [...current.stores.filter((item) => item.id !== draft.id), draft]
    }));
  }

  function upsertAreaDraft(draft: DraftState["areas"][number]) {
    setDrafts((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      areas: [...current.areas.filter((item) => item.id !== draft.id), draft]
    }));
  }

  function exportDrafts() {
    const blob = new Blob([JSON.stringify(drafts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unicore-catalog-drafts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.16em] text-park">CATALOG MANAGER</p>
            <h1 className="mt-1 text-3xl font-black text-ink">カタログ管理</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              商品・店舗・エリアの追加や修正をドラフト化します。削除は物理削除ではなく非表示として扱い、公開データを壊さず運用できます。
            </p>
          </div>
          <button type="button" onClick={exportDrafts} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-white">
            <Download size={17} aria-hidden />
            ドラフトを書き出す
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Summary label="商品ドラフト" value={drafts.foods.length} />
          <Summary label="店舗ドラフト" value={drafts.stores.length} />
          <Summary label="エリアドラフト" value={drafts.areas.length} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <SectionTitle icon={Pencil} title="商品編集" caption="商品名、画像、価格、販売場所、状態を修正します。" />
          <input
            value={foodQuery}
            onChange={(event) => setFoodQuery(event.target.value)}
            placeholder="商品名・店舗・エリアで検索"
            className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-park"
          />
          <select value={selectedFoodId} onChange={(event) => setSelectedFoodId(event.target.value)} className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold">
            {filteredFoods.map((food) => (
              <option key={food.id} value={food.id}>{food.name}</option>
            ))}
          </select>
          {selectedFood ? <FoodEditForm key={selectedFood.id} food={selectedFood} areas={areas} stores={stores} onSave={upsertFoodDraft} /> : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <SectionTitle icon={Plus} title="商品追加" caption="Googleフォーム確認後の新商品候補を登録します。" />
          <FoodEditForm
            food={{
              id: "new-food-draft",
              name: "",
              imageUrl: "",
              price: null,
              shopName: "",
              areaName: areas[0]?.name ?? "",
              category: "unknown",
              isLimited: false,
              isAnniversary25: false,
              saleStatus: "unknown",
              hidden: false,
              description: "",
              officialUrl: ""
            }}
            areas={areas}
            stores={stores}
            operation="add"
            onSave={upsertFoodDraft}
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <SectionTitle icon={Store} title="店舗編集" caption="店舗名、種別、画像、公式URLを修正します。" />
          <input
            value={storeQuery}
            onChange={(event) => setStoreQuery(event.target.value)}
            placeholder="店舗名・エリアで検索"
            className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-park"
          />
          <select value={selectedStoreId} onChange={(event) => setSelectedStoreId(event.target.value)} className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold">
            {filteredStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
          {selectedStore ? <StoreEditForm key={selectedStore.id} store={selectedStore} areas={areas} onSave={upsertStoreDraft} /> : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <SectionTitle icon={Pencil} title="エリア編集" caption="エリア名と表示順を管理します。" />
          <select value={selectedAreaId} onChange={(event) => setSelectedAreaId(event.target.value)} className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold">
            {areas.map((area) => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
          {selectedArea ? <AreaEditForm key={selectedArea.id} area={selectedArea} onSave={upsertAreaDraft} /> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-ink">保存中ドラフト</h2>
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {JSON.stringify(drafts, null, 2)}
        </pre>
      </section>
    </div>
  );
}

function FoodEditForm({
  food,
  areas,
  stores,
  operation = "edit",
  onSave
}: {
  food: AdminFood;
  areas: AdminArea[];
  stores: AdminStore[];
  operation?: "add" | "edit";
  onSave: (draft: DraftState["foods"][number]) => void;
}) {
  const [form, setForm] = useState(food);

  return (
    <div className="mt-4 grid gap-3">
      <Field label="商品名" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
      <Field label="画像URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
      <Field label="価格" type="number" value={form.price?.toString() ?? ""} onChange={(value) => setForm({ ...form, price: value ? Number(value) : null })} />
      <Field label="販売場所" value={form.shopName} list="store-names" onChange={(value) => setForm({ ...form, shopName: value })} />
      <Field label="エリア" value={form.areaName} list="area-names" onChange={(value) => setForm({ ...form, areaName: value })} />
      <label className="grid gap-1 text-xs font-black text-slate-500">
        カテゴリ
        <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as FoodCategory })} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-ink">
          {(Object.keys(categoryLabels) as FoodCategory[]).map((category) => (
            <option key={category} value={category}>{categoryLabels[category]}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-black text-slate-500">
        販売状態
        <select value={form.saleStatus} onChange={(event) => setForm({ ...form, saleStatus: event.target.value as SaleStatus })} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-ink">
          <option value="active">販売中</option>
          <option value="ended">販売終了</option>
          <option value="upcoming">販売予定</option>
          <option value="unknown">確認中</option>
        </select>
      </label>
      <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center justify-between gap-3 text-sm font-black text-ink">
          <span>限定フラグ</span>
          <input
            type="checkbox"
            checked={form.isLimited}
            onChange={(event) => setForm({ ...form, isLimited: event.target.checked })}
            className="h-5 w-5 accent-park"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm font-black text-ink">
          <span>25周年フラグ</span>
          <input
            type="checkbox"
            checked={form.isAnniversary25}
            onChange={(event) => setForm({ ...form, isAnniversary25: event.target.checked })}
            className="h-5 w-5 accent-park"
          />
        </label>
      </div>
      <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="説明文" className="min-h-24 rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none focus:border-park" />
      <Field label="公式URL" value={form.officialUrl} onChange={(value) => setForm({ ...form, officialUrl: value })} />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSave({ ...form, id: operation === "add" ? `new-food-${Date.now()}` : form.id, operation })} className="inline-flex h-11 items-center gap-2 rounded-full bg-park px-5 text-sm font-black text-white">
          <Save size={16} aria-hidden />
          保存ドラフト
        </button>
        <button type="button" onClick={() => onSave({ id: form.id, name: form.name, hidden: true, operation: "hide" })} className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-100 px-5 text-sm font-black text-slate-700">
          <EyeOff size={16} aria-hidden />
          非表示
        </button>
        <button type="button" onClick={() => onSave({ id: form.id, name: form.name, hidden: true, operation: "hide" })} className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-50 px-5 text-sm font-black text-rose-700">
          <Trash2 size={16} aria-hidden />
          削除扱い
        </button>
      </div>
      <datalist id="store-names">{stores.map((store) => <option key={store.id} value={store.name} />)}</datalist>
      <datalist id="area-names">{areas.map((area) => <option key={area.id} value={area.name} />)}</datalist>
    </div>
  );
}

function StoreEditForm({ store, areas, onSave }: { store: AdminStore; areas: AdminArea[]; onSave: (draft: DraftState["stores"][number]) => void }) {
  const [form, setForm] = useState(store);
  return (
    <div className="mt-4 grid gap-3">
      <Field label="店舗名" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
      <Field label="エリア" value={form.areaName} list="store-area-names" onChange={(value) => setForm({ ...form, areaName: value })} />
      <label className="grid gap-1 text-xs font-black text-slate-500">
        種別
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ShopType })} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-ink">
          {(Object.keys(shopTypeLabels) as ShopType[]).map((type) => <option key={type} value={type}>{shopTypeLabels[type]}</option>)}
        </select>
      </label>
      <Field label="店舗画像" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
      <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="説明" className="min-h-24 rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none focus:border-park" />
      <Field label="公式URL" value={form.officialUrl} onChange={(value) => setForm({ ...form, officialUrl: value })} />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSave({ ...form, operation: "edit" })} className="inline-flex h-11 items-center gap-2 rounded-full bg-park px-5 text-sm font-black text-white">
          <Save size={16} aria-hidden />
          保存ドラフト
        </button>
        <button type="button" onClick={() => onSave({ id: form.id, name: form.name, hidden: true, operation: "hide" })} className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-100 px-5 text-sm font-black text-slate-700">
          <EyeOff size={16} aria-hidden />
          非表示
        </button>
      </div>
      <datalist id="store-area-names">{areas.map((area) => <option key={area.id} value={area.name} />)}</datalist>
    </div>
  );
}

function AreaEditForm({ area, onSave }: { area: AdminArea; onSave: (draft: DraftState["areas"][number]) => void }) {
  const [form, setForm] = useState(area);
  return (
    <div className="mt-4 grid gap-3">
      <Field label="エリア名" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
      <Field label="表示順" type="number" value={form.sortOrder.toString()} onChange={(value) => setForm({ ...form, sortOrder: Number(value) })} />
      <button type="button" onClick={() => onSave({ ...form, operation: "edit" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-park px-5 text-sm font-black text-white">
        <Save size={16} aria-hidden />
        保存ドラフト
      </button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", list }: { label: string; value: string; onChange: (value: string) => void; type?: string; list?: string }) {
  return (
    <label className="grid gap-1 text-xs font-black text-slate-500">
      {label}
      <input
        type={type}
        value={value}
        list={list}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-ink outline-none focus:border-park"
      />
    </label>
  );
}

function SectionTitle({ icon: Icon, title, caption }: { icon: LucideIcon; title: string; caption: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint text-park">
        <Icon size={19} aria-hidden />
      </span>
      <div>
        <h2 className="text-xl font-black text-ink">{title}</h2>
        <p className="mt-1 text-sm font-bold leading-5 text-slate-500">{caption}</p>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}
