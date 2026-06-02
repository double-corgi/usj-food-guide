import Link from "next/link";
import { CheckCircle2, Globe2, House, Search } from "lucide-react";

const navItems = [
  { href: "/", label: "ホーム", icon: House },
  { href: "/foods", label: "探す", icon: Search },
  { href: "/eaten", label: "食べた", icon: CheckCircle2 },
  { href: "/areas", label: "エリア", icon: Globe2 }
];

export function AppHeader() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white shadow-[0_10px_28px_rgba(15,23,42,0.18)]">
              <Globe2 size={22} aria-hidden />
            </span>
            <span>
              <span className="block text-base font-black leading-tight text-ink">ユニバフード制覇</span>
              <span className="block text-xs font-bold text-slate-500">今日食べるものを探す非公式ガイド</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-mint hover:text-park"
              >
                <item.icon size={17} aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.6rem)] z-40 md:hidden">
        <div className="pointer-events-none flex min-h-12 items-center justify-center rounded-[1.15rem] border border-dashed border-slate-300/90 bg-white/84 text-xs font-black text-slate-400 shadow-[0_14px_34px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          広告枠
        </div>
      </div>
      <nav className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.15rem)] z-50 grid grid-cols-4 rounded-[1.55rem] border border-white/80 bg-white/84 p-1 shadow-[0_18px_58px_rgba(15,23,42,0.20)] backdrop-blur-2xl md:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[1.15rem] text-[10.5px] font-black text-slate-600 transition hover:bg-white/70 active:scale-95 active:bg-mint">
            <item.icon size={19} aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
