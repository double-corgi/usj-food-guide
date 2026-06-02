"use client";

import { useActionState, useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Image, Link2, MapPin, Send } from "lucide-react";
import { categoryLabels } from "@/lib/constants";
import { submitProductRequest, type SubmissionState } from "./actions";

const initialState: SubmissionState = { ok: false, message: "" };

export function ProductRequestForm() {
  const [state, action, pending] = useActionState(submitProductRequest, initialState);
  const submittedAtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (submittedAtRef.current) submittedAtRef.current.value = String(Date.now());
  }, []);

  return (
    <form action={action} className="space-y-4 rounded-[1.85rem] border border-white/80 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.10)]">
      <input type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <input ref={submittedAtRef} type="hidden" name="submittedAt" defaultValue="" />
      <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#ecfff6_0%,#f8fbff_100%)] p-4">
        <p className="text-lg font-black text-ink">見つけた情報を共有</p>
        <p className="mt-1 text-sm font-bold text-slate-500">画像URLだけでも送れます。管理者確認後に必要に応じて反映します。</p>
        <div className="mt-4">
          <Field label="写真・画像URL" name="imageUrl" type="url" placeholder="https://..." icon={Image} />
        </div>
        <button type="submit" disabled={pending} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-park px-4 py-3 text-sm font-black text-white shadow-sm transition active:scale-[0.98] disabled:bg-slate-300">
          <Send size={16} aria-hidden />
          {pending ? "送信中..." : "画像URLだけ送信"}
        </button>
      </div>
      <label className="grid gap-1 text-sm font-black text-slate-600">
        送信内容
        <select name="requestType" className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-4 focus:ring-mint">
          <option value="add">商品追加</option>
          <option value="info_fix">情報修正</option>
          <option value="ended_report">販売終了報告</option>
          <option value="contact">問い合わせ</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="商品名 / 件名" name="foodName" placeholder="例: ミニオン・チュリトス" />
        <Field label="価格 任意" name="price" inputMode="numeric" placeholder="例: 750" />
        <Field label="販売場所" name="shopName" placeholder="例: フードカート" icon={MapPin} />
        <Field label="エリア" name="areaName" placeholder="例: ミニオン・パーク" />
        <label className="grid gap-1 text-sm font-black text-slate-600">
          カテゴリ
          <select name="category" className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-4 focus:ring-mint">
            <option value="">未選択</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Field label="送信者名 任意" name="senderName" placeholder="ニックネーム" />
        <Field label="公式URL" name="officialUrl" type="url" placeholder="https://www.usj.co.jp/..." icon={Link2} />
        <Field label="連絡先 任意" name="contact" placeholder="メールやSNSなど" />
      </div>
      <label className="grid gap-1 text-sm font-black text-slate-600">
        メモ
        <textarea name="memo" rows={4} maxLength={1200} className="rounded-xl border border-slate-200 p-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-4 focus:ring-mint" placeholder="見かけた日、情報修正内容、問い合わせ内容など" />
      </label>
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 text-sm font-black text-white shadow-soft active:scale-[0.98] disabled:bg-slate-300">
        <Send size={17} aria-hidden />
        {pending ? "送信中..." : "送信する"}
      </button>
      {state.message ? (
        <div className={`rounded-2xl px-4 py-3 text-sm font-black shadow-sm ${state.ok ? "animate-soft-glow bg-mint text-park" : "bg-rose-50 text-rose-700"}`}>
          {state.ok ? (
            <div className="flex items-start gap-3">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-park shadow-sm">
                <Send className="absolute h-4 w-4 -translate-x-2 -translate-y-2 rotate-[-18deg] text-park/60" aria-hidden />
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              </span>
              <span>
                <span className="block text-base">情報提供ありがとう</span>
                <span className="mt-1 block text-xs font-bold text-park/80">採用された内容は、管理者確認後にフード一覧へ反映されます。</span>
              </span>
            </div>
          ) : null}
          {!state.ok ? <p>{state.message}</p> : null}
          {state.ok ? (
            <p className="sr-only">
              {state.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
  icon: Icon
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric";
  maxLength?: number;
  icon?: LucideIcon;
}) {
  return (
    <label className="grid gap-1 text-sm font-black text-slate-600">
      {label}
      <span className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden /> : null}
        <input
          name={name}
          required={required}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength ?? (type === "url" ? 600 : 120)}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-4 focus:ring-mint ${Icon ? "pl-9" : ""}`}
        />
      </span>
    </label>
  );
}
