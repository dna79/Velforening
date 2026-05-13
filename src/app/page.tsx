import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ResourceCard } from "@/components/resource-card";
import { WeatherCard } from "@/components/weather-card";

export default function Home() {
  return (
    <AppShell active="home">
      <section className="flex flex-col gap-4">
        <Link aria-label="Book tennisbane" href="/r/tennisbane">
          <ResourceCard />
        </Link>

        <Link
          className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          href="/velhuset"
        >
          <div className="relative h-40 overflow-hidden bg-[linear-gradient(135deg,#e0f2fe_0%,#dbeafe_45%,#dcfce7_100%)]">
            <div className="absolute inset-x-0 bottom-0 h-14 bg-emerald-700/70" />
            <div className="absolute left-8 right-8 top-8 h-24 rounded-t-[32px] bg-white/85 shadow-lg shadow-slate-900/10" />
            <div className="absolute left-14 right-14 top-16 h-16 rounded-t-2xl bg-blue-600/85" />
            <div className="absolute bottom-6 left-20 right-20 h-16 rounded-t-full bg-slate-900/10" />
          </div>
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Velhuset
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Utleie til arrangementer
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Forespørsel
            </span>
          </div>
        </Link>

        <WeatherCard />
      </section>
    </AppShell>
  );
}
