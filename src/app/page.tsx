import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { WeatherCard } from "@/components/weather-card";

export default function Home() {
  return (
    <AppShell active="home">
      <section className="flex flex-col gap-4">
        <header className="rounded-[28px] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_52%,#ecfdf5_100%)] p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
            Serviceportal
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Reistadlia Vel
          </h1>
          <p className="mt-2 max-w-[22rem] text-sm font-semibold leading-6 text-slate-600">
            Book tennisbanen, lei velhuset og følg dine bookinger.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
          <ActionCard
            buttonLabel="Book tennisbane"
            description="Book ledig tid direkte"
            href="/tennisbane"
            icon={<TennisIcon />}
            tone="green"
            title="Tennisbane"
          />
          <ActionCard
            buttonLabel="Lei velhuset"
            description="Send forespørsel om leie"
            href="/velhuset"
            icon={<HouseIcon />}
            subtitle="Dag, kveld eller hel dag"
            tone="blue"
            title="Velhuset"
          />
        </div>

        <Link
          className="group flex items-center gap-4 rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
          href="/mine-bookinger"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <CalendarCheckIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-black text-slate-950">
              Mine bookinger
            </span>
            <span className="mt-1 block text-sm font-semibold leading-5 text-slate-500">
              Se status, avbestill eller følg forespørsler.
            </span>
          </span>
          <span className="hidden h-11 items-center rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 min-[380px]:inline-flex">
            Se mine bookinger
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
  icon,
  subtitle,
  title,
  tone,
}: {
  buttonLabel: string;
  description: string;
  href: string;
  icon: ReactNode;
  subtitle?: string;
  title: string;
  tone: "blue" | "green";
}) {
  const accent =
    tone === "green"
      ? "from-emerald-100 via-white to-sky-50 text-emerald-700"
      : "from-sky-100 via-white to-blue-50 text-blue-700";

  return (
    <Link
      className="group flex min-h-56 flex-col justify-between rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
      href={href}
    >
      <span
        className={`flex h-20 items-center justify-center rounded-3xl bg-gradient-to-br ${accent}`}
      >
        {icon}
      </span>
      <span className="mt-4 block">
        <span className="block text-xl font-black tracking-tight text-slate-950">
          {title}
        </span>
        <span className="mt-1 block text-sm font-semibold leading-5 text-slate-600">
          {description}
        </span>
        {subtitle ? (
          <span className="mt-1 block text-xs font-bold text-slate-400">
            {subtitle}
          </span>
        ) : null}
      </span>
      <span className="mt-4 flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
        {buttonLabel}
      </span>
    </Link>
  );
}

function TennisIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-12"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 48 48"
    >
      <ellipse cx="18" cy="17" rx="10" ry="13" />
      <path d="m25 27 14 14" />
      <path d="m31 35 4-4" />
      <path d="M10 12h16" />
      <path d="M9 18h18" />
      <path d="M12 24h12" />
      <path d="M16 5v24" />
      <path d="M22 7v20" />
      <circle cx="36" cy="13" r="5" />
      <path d="M33 10c2 3 4 5 8 5" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-12"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 48 48"
    >
      <path d="M7 23 24 9l17 14" />
      <path d="M12 21v19h24V21" />
      <path d="M20 40V28h8v12" />
      <path d="M16 25h5" />
      <path d="M27 25h5" />
      <path d="M9 40h30" />
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
      strokeWidth="2"
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
    <div className="relative h-28 overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#dbeafe_0%,#bfdbfe_100%)] shadow-sm ring-1 ring-blue-100">
      <div className="absolute -bottom-14 -left-10 h-28 w-64 rounded-[100%] bg-blue-500/35" />
      <div className="absolute -bottom-16 right-[-40px] h-32 w-72 rounded-[100%] bg-blue-700/45" />
      <div className="absolute bottom-8 left-7 h-9 w-11 rounded-t-2xl bg-white/90 shadow-sm">
        <div className="absolute -top-4 left-1 h-0 w-0 border-x-[18px] border-b-[18px] border-x-transparent border-b-blue-700" />
        <div className="absolute bottom-0 left-4 h-5 w-3 rounded-t bg-blue-600/80" />
      </div>
      <Tree className="absolute bottom-9 right-20" />
      <Tree className="absolute bottom-7 right-10 scale-75" />
      <div className="absolute bottom-8 left-28 flex items-end gap-1 text-blue-950/70">
        <span className="h-3 w-3 rounded-full border-2 border-current" />
        <span className="h-3 w-3 rounded-full border-2 border-current" />
        <span className="-mb-1 h-5 w-1 rotate-45 rounded-full bg-current" />
        <span className="mb-4 h-2 w-2 rounded-full bg-current" />
      </div>
    </div>
  );
}

function Tree({ className }: { className: string }) {
  return (
    <div className={className}>
      <div className="h-9 w-9 rounded-full bg-emerald-700/85" />
      <div className="mx-auto -mt-1 h-9 w-2 rounded-full bg-blue-950/40" />
    </div>
  );
}
