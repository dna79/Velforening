"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

type AppShellProps = {
  active?: "home" | "mine" | "alerts" | "more";
  children: ReactNode;
  headerBackHref?: string;
};

const menuItems = [
  { href: "/", label: "Forside" },
  { href: "/tennisbane", label: "Tennisbane" },
  { href: "/velhuset", label: "Velhuset" },
  { href: "/mine-bookinger", label: "Mine bookinger" },
  { href: "/admin", label: "Admin" },
];

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

export function AppHeader({ backHref }: { backHref?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex min-h-[78px] items-center justify-between bg-[#F4F8FC]/95 px-6 pb-[18px] pt-6 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <Link
            aria-label="Tilbake"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-semibold leading-none text-[#07122F] shadow-sm ring-1 ring-[#DDE8F5]"
            href={backHref}
          >
            ‹
          </Link>
        ) : null}

        <Link className="flex min-w-0 items-center gap-3" href="/">
          <LogoMark />
          <span className="min-w-0 text-left">
            <span className="block text-[14px] font-black uppercase tracking-[0.12em] text-[#07122F]">
              REISTADLIA VEL
            </span>
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-[#53657D] min-[340px]:block">
              AKTIV, TRIVELIG, TRYGG
            </span>
          </span>
        </Link>
      </div>

      <div className="relative">
        <button
          aria-expanded={isMenuOpen}
          aria-label="Åpne meny"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-semibold leading-none text-[#07122F] shadow-sm ring-1 ring-[#DDE8F5]"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          ≡
        </button>

        {isMenuOpen ? (
          <nav className="absolute right-0 top-14 w-56 overflow-hidden rounded-[28px] bg-white p-2 shadow-2xl shadow-slate-900/15 ring-1 ring-[#DDE8F5]">
            {menuItems.map((item) => (
              <Link
                className="block rounded-[18px] px-4 py-3 text-sm font-bold text-[#53657D] hover:bg-blue-50 hover:text-blue-700"
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm ring-1 ring-[#DDE8F5]">
      <svg
        aria-hidden="true"
        className="h-9 w-9"
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

export function AppShell({ children, headerBackHref }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#F4F8FC] text-[#07122F]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[#F4F8FC]">
        <AppHeader backHref={headerBackHref} />
        <div className="flex-1 px-5 pb-0 pt-0">{children}</div>
      </div>
    </main>
  );
}
