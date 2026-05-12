import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { ResourceCard } from "@/components/resource-card";

type IconName =
  | "tag"
  | "clock"
  | "shield"
  | "sun"
  | "thermometer"
  | "wind"
  | "drop";

const infoCards: Array<{ icon: IconName; label: string; value: string }> = [
  { icon: "tag", label: "Pris", value: "Gratis for medlemmer" },
  { icon: "clock", label: "Åpent", value: "08:00-22:00" },
  { icon: "shield", label: "Regler", value: "Maks 1 time" },
];

const weatherItems: Array<{ icon: IconName; label: string; value: string }> = [
  { icon: "thermometer", label: "Temp", value: "17°C" },
  { icon: "wind", label: "Vind", value: "2 m/s" },
  { icon: "drop", label: "Nedbør", value: "0 mm" },
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

        <section className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <IconBadge>
                <AppIcon name="sun" />
              </IconBadge>
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Vær ved tennisbanen
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  Rolige forhold
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
              17°C
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            {weatherItems.map((item) => (
              <div className="rounded-2xl bg-slate-50 px-2 py-2" key={item.label}>
                <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <AppIcon name={item.icon} />
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>
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
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.9 4.9 1.4 1.4" />
        <path d="m17.7 17.7 1.4 1.4" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m4.9 19.1 1.4-1.4" />
        <path d="m17.7 6.3 1.4-1.4" />
      </>
    ),
    thermometer: (
      <>
        <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
        <path d="M12 9v7" />
      </>
    ),
    wind: (
      <>
        <path d="M4 9h11a3 3 0 1 0-3-3" />
        <path d="M4 14h14a2 2 0 1 1-2 2" />
        <path d="M4 19h8" />
      </>
    ),
    drop: (
      <path d="M12 21a6 6 0 0 0 6-6c0-4-6-11-6-11S6 11 6 15a6 6 0 0 0 6 6Z" />
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
