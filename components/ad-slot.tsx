import type { ReactNode } from "react";

type AdSlotProps = {
  className?: string;
  slotId?: string;
  variant?: "inline" | "fixed";
  children?: ReactNode;
};

export function AdSlot({ className = "", slotId = "placeholder", variant = "inline", children }: AdSlotProps) {
  const baseClass =
    variant === "fixed"
      ? "pointer-events-none flex items-center justify-center rounded-full border border-slate-200/70 bg-cream/95 px-3 text-center shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur"
      : "flex flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-[0_1px_0_rgba(15,23,42,0.03)]";
  const variantClass =
    variant === "fixed"
      ? "fixed bottom-[calc(env(safe-area-inset-bottom)+0.45rem)] left-1/2 z-40 h-7 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 md:bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:h-9 md:w-[min(22rem,calc(100vw-2rem))]"
      : "mx-auto my-6 h-20 w-full max-w-3xl";

  return (
    <aside
      aria-label="広告"
      data-ad-slot={slotId}
      className={`${baseClass} ${variantClass} ${className}`.trim()}
    >
      {variant === "fixed" ? (
        <span className="text-[9px] font-bold tracking-wide text-slate-400">広告</span>
      ) : (
        <>
          <span className="self-start text-[10px] font-bold uppercase tracking-wide text-slate-400">広告</span>
          <div className="flex flex-1 items-center justify-center text-xs font-bold text-slate-300">
            {children ?? "広告スペース"}
          </div>
        </>
      )}
    </aside>
  );
}
