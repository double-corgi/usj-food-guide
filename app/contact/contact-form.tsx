"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitContact, type ContactState } from "./actions";

const initialState: ContactState = { ok: false, message: "" };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialState);
  const submittedAtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (submittedAtRef.current) submittedAtRef.current.value = String(Date.now());
  }, []);

  return (
    <form action={action} className="mt-6 grid gap-4 rounded-[1.6rem] border border-white/80 bg-white p-5 shadow-soft">
      <input type="text" name="companyWebsite" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <input ref={submittedAtRef} type="hidden" name="submittedAt" defaultValue="" />
      <Field label="件名" name="subject" maxLength={120} placeholder="例: 価格表示について" required />
      <label className="grid gap-1 text-sm font-black text-slate-600">
        内容
        <textarea name="message" maxLength={1200} rows={6} required className="rounded-xl border border-slate-200 p-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-4 focus:ring-mint" placeholder="問い合わせ内容を入力してください。" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="お名前 任意" name="senderName" maxLength={80} placeholder="ニックネーム可" />
        <Field label="連絡先 任意" name="contact" maxLength={160} placeholder="メールアドレスなど" />
      </div>
      <button type="submit" disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-black text-white shadow-soft active:scale-[0.98] disabled:bg-slate-300">
        <Send size={17} aria-hidden />
        {pending ? "送信中..." : "送信する"}
      </button>
      {state.message ? (
        <div className={`rounded-2xl px-4 py-3 text-sm font-black ${state.ok ? "bg-mint text-park" : "bg-rose-50 text-rose-700"}`}>
          {state.ok ? <CheckCircle2 className="mr-2 inline h-5 w-5" aria-hidden /> : null}
          {state.message}
        </div>
      ) : null}
    </form>
  );
}

function Field({ label, name, maxLength, placeholder, required }: { label: string; name: string; maxLength: number; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-black text-slate-600">
      {label}
      <input name={name} maxLength={maxLength} placeholder={placeholder} required={required} className="h-12 rounded-xl border border-slate-200 px-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-4 focus:ring-mint" />
    </label>
  );
}
