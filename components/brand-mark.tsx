export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`grid aspect-square place-items-center overflow-hidden rounded-xl bg-[#f7d47b] ring-1 ring-[#071b3a]/10 ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/app-icon.svg" alt="" className="h-full w-full object-contain" />
    </span>
  );
}
