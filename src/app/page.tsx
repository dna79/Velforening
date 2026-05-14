import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { HomeLandscapeFooter } from "@/components/HomeLandscapeFooter";
import { WeatherCard } from "@/components/weather-card";

export default function Home() {
  return (
    <AppShell active="home">
      <section className="flex flex-col gap-4">
        <header className="px-1">
          <p className="max-w-[19rem] text-[24px] font-black leading-tight tracking-[-0.03em] text-[#07122F]">
            Book tennisbanen, lei velhuset og følg dine bookinger.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
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
          className="group flex min-h-[94px] items-center gap-3 rounded-[28px] bg-white p-4 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5] transition hover:-translate-y-0.5 hover:shadow-md"
          href="/mine-bookinger"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <CalendarCheckIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[20px] font-black leading-tight tracking-[-0.03em] text-[#07122F]">
              Mine bookinger
            </span>
            <span className="mt-1 block text-[13px] font-semibold leading-5 text-[#53657D]">
              Se status, avbestill eller følg forespørsler.
            </span>
          </span>
          <span className="hidden h-12 shrink-0 items-center gap-1 rounded-[18px] border border-blue-600 px-3 text-sm font-black text-blue-600 min-[390px]:flex">
            Se mine
            <span aria-hidden="true" className="text-xl leading-none">
              ›
            </span>
          </span>
        </Link>

        <WeatherCard />
        <HomeLandscapeFooter />
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
      className="group flex min-h-[246px] flex-col items-center rounded-[30px] bg-white px-3 pb-4 pt-4 text-center shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5] transition hover:-translate-y-0.5 hover:shadow-md"
      href={href}
    >
      <div className="flex h-[104px] w-full items-center justify-center">
        {illustration}
      </div>
      <span className="mt-3 block text-[22px] font-black leading-tight tracking-[-0.04em] text-[#07122F]">
        {title}
      </span>
      <span className="mt-1.5 block min-h-11 text-[13px] font-semibold leading-[18px] text-[#53657D]">
        {description}
        {subtitle ? (
          <>
            <br />
            {subtitle}
          </>
        ) : null}
      </span>
      <span className="mt-auto flex h-12 w-full items-center justify-center rounded-[18px] bg-blue-600 px-1 text-[13px] font-black text-white shadow-lg shadow-blue-600/25">
        {buttonLabel}
      </span>
    </Link>
  );
}

function TennisIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="h-[104px] w-[132px]"
      fill="none"
      viewBox="0 0 150 132"
    >
      <ellipse cx="75" cy="68" fill="#E7F1FF" rx="68" ry="58" />
      <path
        d="M13 83c13-16 23 3 35-8 13-12 28-11 40 1 15 14 29-12 49 7v25H13V83Z"
        fill="#CFE2FF"
      />
      <path
        d="M19 91h115M19 99h115M30 84v23M48 84v23M66 84v23M84 84v23M102 84v23M120 84v23"
        stroke="#8CB7FB"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <ellipse
        cx="54"
        cy="45"
        rx="23"
        ry="35"
        stroke="#2563EB"
        strokeWidth="5"
        transform="rotate(16 54 45)"
      />
      <path d="M46 78 34 112" stroke="#2563EB" strokeLinecap="round" strokeWidth="9" />
      <path
        d="M49 21 65 68M38 28l31 27M31 42l43 15M34 57l38 13M58 14l-12 66M70 24 37 72"
        stroke="#9FC2FF"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="94" cy="82" fill="#B9EF2F" r="17" />
      <path
        d="M81 78c9 1 17 8 20 18M106 72c-7 1-14 7-16 15"
        stroke="#FFF"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path d="M109 47c6-10 18-9 21 1h-21ZM27 70c7-10 20-8 23 2H27Z" fill="#FFF" />
    </svg>
  );
}

function HouseIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="h-[104px] w-[132px]"
      fill="none"
      viewBox="0 0 150 132"
    >
      <ellipse cx="75" cy="70" fill="#E7F1FF" rx="68" ry="57" />
      <path
        d="M19 89c12-21 26-4 40-18 17-17 35-15 49 2 12 14 23-5 32 14v24H19V89Z"
        fill="#CFE2FF"
      />
      <path
        d="M35 61 73 29l39 32v45H35V61Z"
        fill="#FFF"
        stroke="#8CB7FB"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M30 65 73 25l45 40"
        stroke="#2563EB"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path d="M50 70h13v20H50zM86 70h13v20H86z" fill="#BFDBFE" stroke="#60A5FA" strokeWidth="3" />
      <path d="M67 75h15v31H67z" fill="#2563EB" />
      <path d="M54 52h38" stroke="#BFDBFE" strokeLinecap="round" strokeWidth="4" />
      <path
        d="M116 73c8-11 17-3 11 9 8 4 1 16-10 11M26 75c-7-12-17-2-10 9-7 4 0 15 9 10"
        stroke="#9FC2FF"
        strokeLinecap="round"
        strokeWidth="6"
      />
      <path d="M116 68v38M26 71v36" stroke="#8CB7FB" strokeLinecap="round" strokeWidth="3" />
      <path d="M103 44c6-10 18-9 21 1h-21ZM29 50c7-10 20-8 23 2H29Z" fill="#FFF" />
    </svg>
  );
}

function CalendarCheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
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
