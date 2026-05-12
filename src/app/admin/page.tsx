import { AppShell } from "@/components/app-shell";

export default function AdminPage() {
  return (
    <AppShell active="more">
      <section className="flex min-h-[calc(100vh-11rem)] flex-col justify-center gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-blue-700">Styret</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Admin
          </h1>
          <p className="mt-4 text-lg font-medium leading-7 text-slate-600">
            Her kan styret senere se bookinger og sperre tider.
          </p>
        </div>

        <button
          className="h-14 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25"
          type="button"
        >
          Sperr tid
        </button>
      </section>
    </AppShell>
  );
}
