import Link from "next/link";
import { CheckCircle2, Globe2, House, Search, Store } from "lucide-react";

const navItems = [
  { href: "/", label: "ホーム", icon: House },
  { href: "/foods", label: "探す", icon: Search },
  { href: "/eaten", label: "食べた", icon: CheckCircle2 },
  { href: "/areas", label: "エリア", icon: Globe2 },
  { href: "/stores", label: "店舗", icon: Store }
];

export function AppHeader() {
  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-slate-200/60 bg-white/78 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:block">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end px-6 py-2.5 lg:px-8">
          <nav className="flex items-center gap-1">
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
      <nav className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 grid grid-cols-5 rounded-[1.55rem] border border-white/80 bg-white/86 p-1 shadow-[0_16px_42px_rgba(15,23,42,0.16)] backdrop-blur-2xl md:hidden">
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
