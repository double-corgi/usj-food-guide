import type { ReactNode } from "react";

type AdSlotProps = {
  className?: string;
  slotId?: string;
  children?: ReactNode;
};

export function AdSlot({ className = "", slotId = "placeholder", children }: AdSlotProps) {
  return (
    <aside
      aria-label="広告"
      data-ad-slot={slotId}
      className={`mx-auto my-6 flex h-24 w-full max-w-3xl flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-[0_1px_0_rgba(15,23,42,0.03)] ${className}`.trim()}
    >
      <span className="self-start text-[10px] font-bold uppercase tracking-wide text-slate-400">広告</span>
      <div className="flex flex-1 items-center justify-center text-xs font-bold text-slate-300">{children ?? "広告スペース"}</div>
    </aside>
  );
}
