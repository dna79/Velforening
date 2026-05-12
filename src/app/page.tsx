import Link from "next/link";

import { AppShell } from "@/components/app-shell";

export default function Home() {
  return (
    <AppShell active="home">
      <section className="flex flex-col gap-6">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="relative mb-5 h-52 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1d4ed8_0%,#38bdf8_45%,#bbf7d0_100%)]">
            <div className="absolute inset-x-8 bottom-8 top-8 rounded-[28px] border-4 border-white/80" />
            <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-1 -translate-x-1/2 bg-white/70" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/40 to-transparent p-5">
              <span className="inline-flex rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-blue-700">
                Ledige tider i dag
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Tennisbane
              </h1>
              <p className="mt-1 text-base font-medium text-slate-500">
                Utendørsbane
              </p>
            </div>

            <div className="grid gap-3">
              <InfoRow label="Pris" value="Gratis for medlemmer" />
              <InfoRow label="Åpent" value="08:00–22:00" />
              <InfoRow label="Regler" value="Maks 1 time" />
            </div>

            <Link
              className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              href="/r/tennisbane"
            >
              Book tid
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}
