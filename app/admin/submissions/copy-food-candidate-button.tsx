"use client";

import { ClipboardCopy } from "lucide-react";

export function CopyFoodCandidateButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value)}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 text-xs font-black text-slate-700 active:scale-[0.98]"
    >
      <ClipboardCopy size={14} aria-hidden />
      food候補としてコピー
    </button>
  );
}
