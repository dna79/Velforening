import Image from "next/image";
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

export function AppLogo({ large = false }: { large?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Image
        alt="Reistadlia Vel"
        className={
          large ? "h-16 w-auto max-w-[180px]" : "h-12 w-auto max-w-[150px]"
        }
        height={64}
        src="/logo.svg"
        width={180}
      />
      <span className="sr-only">Reistadlia Vel</span>
    </div>
  );
}

export function LogoFallback() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
      RV
    </div>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 py-3 backdrop-blur">
      <Link className="flex min-w-0 items-center gap-3" href="/">
        <LogoMark />
        <span className="min-w-0 text-left">
          <span className="block text-sm font-extrabold uppercase tracking-[0.08em] text-slate-950">
            Reistadlia Vel
          </span>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 min-[360px]:block">
            Aktiv, trivelig, trygg
          </span>
        </span>
      </Link>

      <button
        aria-label="Åpne meny"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl font-semibold leading-none text-slate-700"
        type="button"
      >
        ≡
      </button>
    </header>
  );
}

function LogoMark() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
        viewBox="0 0 48 48"
      >
        <path d="M15 31c-6-2-9-6-8-12 1-4 4-7 8-7 2-5 8-7 13-4 5-1 10 2 12 7 5 2 7 8 3 13-3 5-9 7-16 6" />
        <path d="M24 16v24" />
        <path d="M14 23c3 5 6 7 10 7 5 0 8-3 11-8" />
        <path d="M24 30c3-1 5-3 7-6" />
      </svg>
      <span className="sr-only">Reistadlia Vel</span>
    </span>
  );
}

export function BottomNav({ active = "home" }: { active?: AppShellProps["active"] }) {
  return (
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
  );
}

export function AppShell({ active = "home", children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-slate-50 shadow-2xl shadow-slate-200/80">
        <AppHeader />
        <div className="flex-1 px-5 pb-32 pt-4">{children}</div>
        <BottomNav active={active} />
      </div>
    </main>
  );
}
