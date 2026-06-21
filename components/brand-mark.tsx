export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`grid aspect-square place-items-center overflow-hidden rounded-[1rem] shadow-sm ring-1 ring-black/5 ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/app-icon-unicole-512.png" alt="" className="h-full w-full object-cover" />
    </span>
  );
}
