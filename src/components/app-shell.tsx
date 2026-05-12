import Link from "next/link";
import type { ReactNode } from "react";

type AppShellProps = {
  active?: "home" | "mine" | "alerts" | "more";
  children: ReactNode;
};

const navItems = [
  { href: "/", key: "home", label: "Hjem" },
  { href: "/mine", key: "mine", label: "Mine bookinger" },
  { href: "#varsler", key: "alerts", label: "Varsler" },
  { href: "/admin", key: "more", label: "Mer" },
] as const;

export function AppShell({ active = "home", children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-slate-50 shadow-2xl shadow-slate-200/80">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
              RV
            </span>
            <span className="text-sm font-bold tracking-[0.18em] text-slate-900">
              REISTADLIA VEL
            </span>
          </Link>

          <button
            aria-label="Åpne meny"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl font-semibold text-slate-700"
            type="button"
          >
            ≡
          </button>
        </header>

        <div className="flex-1 px-5 pb-28 pt-6">{children}</div>

        <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          {navItems.map((item) => {
            const isActive = active === item.key;

            return (
              <Link
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-500"
                }`}
                href={item.href}
                key={item.key}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive ? "bg-blue-600" : "bg-slate-300"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
