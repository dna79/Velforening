import type { ReactNode } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ResourceCard } from "@/components/resource-card";
import { WeatherCard } from "@/components/weather-card";

type IconName =
  | "tag"
  | "clock"
  | "shield"
  | "calendar";

const infoCards: Array<{ icon: IconName; label: string; value: string }> = [
  { icon: "tag", label: "Pris", value: "Gratis for medlemmer" },
  { icon: "clock", label: "Åpent", value: "08:00-22:00" },
  { icon: "shield", label: "Regler", value: "Maks 1 time" },
];

export default function Home() {
  return (
    <AppShell active="home">
      <section className="flex flex-col gap-4">
        <ResourceCard />

        <div className="grid grid-cols-3 gap-2">
          {infoCards.map((item) => (
            <div
              className="flex min-h-[118px] flex-col items-center rounded-2xl bg-white px-2.5 py-3 text-center shadow-sm ring-1 ring-slate-200"
              key={item.label}
            >
              <IconBadge>
                <AppIcon name={item.icon} />
              </IconBadge>
              <p className="mt-2 text-[11px] font-bold uppercase text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 max-w-[90px] text-sm font-bold leading-snug text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <Link
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          href="/r/tennisbane"
        >
          <AppIcon name="calendar" />
          Book tid
        </Link>

        <WeatherCard />
      </section>
    </AppShell>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
      {children}
    </div>
  );
}

function AppIcon({ name }: { name: IconName }) {
  const icons: Record<IconName, ReactNode> = {
    tag: (
      <>
        <path d="M20 13.5 13.5 20a2 2 0 0 1-2.8 0L4 13.3V4h9.3l6.7 6.7a2 2 0 0 1 0 2.8Z" />
        <path d="M8 8h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 21s7-3.4 7-10V5l-7-3-7 3v6c0 6.6 7 10 7 10Z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </>
    ),
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
}
