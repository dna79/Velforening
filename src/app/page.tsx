import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { WeatherCard } from "@/components/weather-card";

export default function Home() {
  return (
    <AppShell active="home">
      <section className="flex flex-col gap-2.5">
        <header className="px-1 pb-1 pt-0">
          <p className="text-[15px] font-semibold leading-5 text-slate-500">
            Book tennisbanen, lei velhuset og følg dine bookinger.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2.5">
          <ActionCard
            buttonLabel="Book tennisbane"
            description="Book ledig tid direkte"
            href="/tennisbane"
            illustration={<TennisIllustration />}
            title="Tennisbane"
          />
          <ActionCard
            buttonLabel="Lei velhuset"
            description="Send forespørsel om leie"
            href="/velhuset"
            illustration={<HouseIllustration />}
            subtitle="Dag, kveld eller hel dag"
            title="Velhuset"
          />
        </div>

        <Link
          className="group flex min-h-[74px] items-center gap-2.5 rounded-[22px] bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.07)] ring-1 ring-blue-100/80 transition hover:-translate-y-0.5 hover:shadow-md"
          href="/mine-bookinger"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <CalendarCheckIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[18px] font-black leading-tight tracking-[-0.02em] text-slate-950">
              Mine bookinger
            </span>
            <span className="mt-0.5 block text-[12px] font-medium leading-4 text-slate-500">
              Se status, avbestill eller følg forespørsler.
            </span>
          </span>
          <span className="flex h-10 shrink-0 items-center gap-1 rounded-2xl border border-blue-600 px-2.5 text-[12px] font-black text-blue-600">
            Se
            <span aria-hidden="true" className="text-xl leading-none">
              ›
            </span>
          </span>
        </Link>

        <WeatherCard />
        <PortalFooter />
      </section>
    </AppShell>
  );
}

function ActionCard({
  buttonLabel,
  description,
  href,
  illustration,
  subtitle,
  title,
}: {
  buttonLabel: string;
  description: string;
  href: string;
  illustration: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <Link
      className="group flex min-h-[206px] flex-col items-center rounded-[22px] bg-white px-2.5 pb-3 pt-3 text-center shadow-[0_10px_24px_rgba(15,23,42,0.07)] ring-1 ring-blue-100/80 transition hover:-translate-y-0.5 hover:shadow-md"
      href={href}
    >
      <div className="flex h-[86px] w-full items-center justify-center">
        {illustration}
      </div>
      <span className="mt-2 block text-[20px] font-black leading-tight tracking-[-0.03em] text-slate-950">
        {title}
      </span>
      <span className="mt-1.5 block min-h-9 text-[12px] font-medium leading-[18px] text-slate-500">
        {description}
        {subtitle ? (
          <>
            <br />
            {subtitle}
          </>
        ) : null}
      </span>
      <span className="mt-auto flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-1 text-[12px] font-black text-white shadow-lg shadow-blue-600/25">
        {buttonLabel}
      </span>
    </Link>
  );
}

function TennisIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="h-[86px] w-[108px]"
      fill="none"
      viewBox="0 0 150 132"
    >
      <ellipse cx="75" cy="68" fill="#e7f1ff" rx="68" ry="58" />
      <path d="M13 83c13-16 23 3 35-8 13-12 28-11 40 1 15 14 29-12 49 7v25H13V83Z" fill="#cfe2ff" />
      <path d="M19 91h115M19 99h115M30 84v23M48 84v23M66 84v23M84 84v23M102 84v23M120 84v23" stroke="#8cb7fb" strokeLinecap="round" strokeWidth="2" />
      <ellipse cx="54" cy="45" rx="23" ry="35" stroke="#2563eb" strokeWidth="5" transform="rotate(16 54 45)" />
      <path d="M46 78 34 112" stroke="#2563eb" strokeLinecap="round" strokeWidth="9" />
      <path d="M49 21 65 68M38 28l31 27M31 42l43 15M34 57l38 13M58 14l-12 66M70 24 37 72" stroke="#9fc2ff" strokeLinecap="round" strokeWidth="2" />
      <circle cx="94" cy="82" fill="#b9ef2f" r="17" />
      <path d="M81 78c9 1 17 8 20 18M106 72c-7 1-14 7-16 15" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
      <path d="M109 47c6-10 18-9 21 1h-21ZM27 70c7-10 20-8 23 2H27Z" fill="#fff" />
    </svg>
  );
}

function HouseIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="h-[86px] w-[108px]"
      fill="none"
      viewBox="0 0 150 132"
    >
      <ellipse cx="75" cy="70" fill="#e7f1ff" rx="68" ry="57" />
      <path d="M19 89c12-21 26-4 40-18 17-17 35-15 49 2 12 14 23-5 32 14v24H19V89Z" fill="#cfe2ff" />
      <path d="M35 61 73 29l39 32v45H35V61Z" fill="#fff" stroke="#8cb7fb" strokeLinejoin="round" strokeWidth="3" />
      <path d="M30 65 73 25l45 40" stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <path d="M50 70h13v20H50zM86 70h13v20H86z" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="3" />
      <path d="M67 75h15v31H67z" fill="#2563eb" />
      <path d="M54 52h38" stroke="#bfdbfe" strokeLinecap="round" strokeWidth="4" />
      <path d="M116 73c8-11 17-3 11 9 8 4 1 16-10 11M26 75c-7-12-17-2-10 9-7 4 0 15 9 10" stroke="#9fc2ff" strokeLinecap="round" strokeWidth="6" />
      <path d="M116 68v38M26 71v36" stroke="#8cb7fb" strokeLinecap="round" strokeWidth="3" />
      <path d="M103 44c6-10 18-9 21 1h-21ZM29 50c7-10 20-8 23 2H29Z" fill="#fff" />
    </svg>
  );
}

function CalendarCheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.3"
      viewBox="0 0 24 24"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect height="18" rx="3" width="18" x="3" y="4" />
      <path d="M3 10h18" />
      <path d="m8.5 16 2 2 5-5" />
    </svg>
  );
}

function PortalFooter() {
  return (
    <div className="relative -mx-4 h-24 overflow-hidden bg-transparent">
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-blue-100/70 [clip-path:ellipse(80%_55%_at_20%_85%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-blue-200/65 [clip-path:ellipse(85%_58%_at_88%_82%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-blue-300/55 [clip-path:ellipse(82%_56%_at_38%_96%)]" />
      <Tree className="absolute bottom-5 left-8 scale-75" />
      <Tree className="absolute bottom-7 left-20 scale-90" />
      <Tree className="absolute bottom-4 right-12 scale-75" />
      <div className="absolute bottom-10 right-28 h-6 w-7 rounded-t-lg border-2 border-blue-500/80 bg-white/45">
        <div className="absolute -top-4 left-0.5 h-0 w-0 border-x-[12px] border-b-[12px] border-x-transparent border-b-blue-500/80" />
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-end gap-0.5 text-blue-600/75">
        <span className="h-3 w-3 rounded-full border-2 border-current" />
        <span className="h-3 w-3 rounded-full border-2 border-current" />
        <span className="-mb-1 h-4 w-1 rotate-45 rounded-full bg-current" />
        <span className="mb-3 h-1.5 w-1.5 rounded-full bg-current" />
      </div>
    </div>
  );
}

function Tree({ className }: { className: string }) {
  return (
    <div className={className}>
      <div className="h-9 w-7 rounded-full bg-blue-300/90" />
      <div className="mx-auto -mt-1 h-8 w-1 rounded-full bg-blue-500/70" />
    </div>
  );
}
