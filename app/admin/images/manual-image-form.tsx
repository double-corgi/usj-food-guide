"use client";

import { useActionState, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { FoodWithRelations } from "@/types/domain";
import { keepPlaceholderImage, saveManualImageUrl, type ManualImageState } from "./actions";

const initialState: ManualImageState = { ok: false, message: "" };

export function ManualImageForm({ food }: { food: FoodWithRelations }) {
  const [imageUrl, setImageUrl] = useState("");
  const [state, formAction, pending] = useActionState(saveManualImageUrl, initialState);
  const queries = useMemo(() => buildSearchQueries(food), [food]);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-xs font-black text-slate-400">現在placeholder</div>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <div className="flex flex-wrap gap-2 text-xs font-black text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{food.category}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{food.area.name}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{food.shop.name}</span>
            </div>
            <h3 className="mt-2 text-lg font-black text-ink">{food.name}</h3>
          </div>

          <form action={formAction} className="space-y-2">
            <input type="hidden" name="foodId" value={food.id} />
            <label className="block">
              <span className="text-xs font-black text-slate-500">画像URL</span>
              <input
                name="imageUrl"
                required
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/product.jpg"
                className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-park"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black text-slate-500">source URL</span>
                <input name="imageSourceUrl" type="url" placeholder="https://..." className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-park" />
              </label>
              <label className="block">
                <span className="text-xs font-black text-slate-500">source name</span>
                <input name="imageSourceName" placeholder="official / manual" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-park" />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={pending} className="inline-flex h-10 items-center justify-center rounded-full bg-park px-4 text-xs font-black text-white disabled:bg-slate-300">
                {pending ? "確認中..." : "保存して代表画像にする"}
              </button>
              <a href={`/foods/${food.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-black text-park hover:border-park">
                通常画面で確認 <ExternalLink size={14} aria-hidden />
              </a>
            </div>
            {state.message ? <p className={`text-xs font-black ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p> : null}
          </form>

          <form action={keepPlaceholderImage}>
            <input type="hidden" name="foodId" value={food.id} />
            <button type="submit" className="text-xs font-black text-slate-500 underline underline-offset-4 hover:text-ink">placeholder維持として記録</button>
          </form>

          <div className="flex flex-wrap gap-2">
            {queries.map((query) => (
              <a key={query} href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-600 hover:bg-slate-200">
                {query} <ExternalLink size={12} aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function buildSearchQueries(food: FoodWithRelations) {
  const base = [`${food.name} USJ`, `${food.name} ユニバ`, `${food.name} フード`];
  const churro = food.category === "churro" || /チュリトス|チュロス/i.test(food.name) ? [`${food.name} チュリトス USJ`, `${food.name} チュロス USJ`] : [];
  return Array.from(new Set([...base, ...churro]));
}
