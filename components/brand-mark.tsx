export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`grid aspect-square place-items-center overflow-hidden rounded-[1.05rem] bg-white p-0.5 ring-1 ring-[#071b3a]/10 ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/app-icon-512.png" alt="" className="h-full w-full rounded-[0.85rem] object-contain" />
    </span>
  );
}
