"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { getBookingStatusLabel } from "@/lib/booking-status";
import { createSupabaseClient } from "@/lib/supabase";
import type { Booking, BlockedTime, Resource } from "@/lib/types";

type RentalRequest = Booking & {
  booking_types: {
    name: string;
    slug: string;
  } | null;
  resources: {
    name: string;
    slug: string;
  } | null;
};

type AdminError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createDateTimeIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

const ADMIN_ACCESS_KEY = "admin_unlocked";

export default function AdminPage() {
  const [resource, setResource] = useState<Resource | null>(null);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [adminCode, setAdminCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [hasCheckedAdminAccess, setHasCheckedAdminAccess] = useState(false);
  const [date, setDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [reason, setReason] = useState("Vedlikehold");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [, setAdminError] = useState<AdminError | null>(null);
  const [requestComments, setRequestComments] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setHasAdminAccess(
        window.sessionStorage.getItem(ADMIN_ACCESS_KEY) === "true",
      );
      setHasCheckedAdminAccess(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function loadBlockedTimes(resourceId: string) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("blocked_times")
      .select("*")
      .eq("resource_id", resourceId)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Kunne ikke hente sperrede tider", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });
      setAdminError({
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });
      setErrorMessage("Kunne ikke hente sperrede tider.");
      setBlockedTimes([]);
    } else {
      setBlockedTimes(data ?? []);
    }
  }

  async function loadRentalRequests(resourceId: string) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*, resources(name, slug), booking_types(name, slug)")
      .eq("resource_id", resourceId)
      .eq("status", "requested")
      .order("start_time", { ascending: true });

    if (error) {
      console.warn("Kunne ikke hente leieforespørsler med relasjoner", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });

      const fallbackResult = await supabase
        .from("bookings")
        .select("*")
        .eq("resource_id", resourceId)
        .eq("status", "requested")
        .order("start_time", { ascending: true });

      if (fallbackResult.error) {
        console.warn("Kunne ikke hente leieforespørsler", {
          code: fallbackResult.error.code,
          details: fallbackResult.error.details,
          hint: fallbackResult.error.hint,
          message: fallbackResult.error.message,
        });
        setErrorMessage("Kunne ikke hente leieforespørsler.");
        setRentalRequests([]);
      } else {
        const fallbackRequests = (fallbackResult.data ?? []).map(
          (request) => ({
            ...request,
            booking_types: null,
            resources: {
              name: "Velhuset",
              slug: "velhuset",
            },
          }),
        ) as RentalRequest[];

        setRentalRequests(fallbackRequests);
      }
    } else {
      setRentalRequests((data ?? []) as unknown as RentalRequest[]);
    }
  }

  useEffect(() => {
    if (!hasAdminAccess) {
      return;
    }

    let isActive = true;

    async function loadAdminData() {
      setIsLoading(true);
      setErrorMessage("");
      setAdminError(null);

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("slug", "tennisbane")
        .single();

      if (!isActive) {
        return;
      }

      if (error || !data) {
        console.error("Kunne ikke hente tennisbane", {
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          message: error?.message,
        });
        setAdminError({
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          message: error?.message,
        });
        setErrorMessage("Kunne ikke hente tennisbanen.");
        setIsLoading(false);
        return;
      }

      setResource(data);
      await loadBlockedTimes(data.id);

      const { data: velhusetData, error: velhusetError } = await supabase
        .from("resources")
        .select("*")
        .eq("slug", "velhuset")
        .single();

      if (!velhusetError && velhusetData) {
        await loadRentalRequests(velhusetData.id);
      } else {
        console.warn("Kunne ikke hente Velhuset", {
          code: velhusetError?.code,
          details: velhusetError?.details,
          hint: velhusetError?.hint,
          message: velhusetError?.message,
        });
        setRentalRequests([]);
      }

      if (isActive) {
        setIsLoading(false);
      }
    }

    loadAdminData();

    return () => {
      isActive = false;
    };
  }, [hasAdminAccess]);

  function logInAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN?.trim();
    const enteredPin = adminCode.trim();

    console.warn("Admin env debug", {
      hasExpectedPin: Boolean(expectedPin),
      expectedPinLength: expectedPin?.length ?? 0,
      enteredLength: enteredPin.length,
    });

    if (!expectedPin) {
      setLoginError(
        "Admin-PIN er ikke konfigurert. Sjekk at NEXT_PUBLIC_ADMIN_PIN finnes i .env.local og restart dev-serveren.",
      );
      return;
    }

    if (enteredPin === expectedPin) {
      window.sessionStorage.setItem(ADMIN_ACCESS_KEY, "true");
      setHasAdminAccess(true);
      setLoginError("");
      setAdminCode("");
      return;
    }

    setLoginError("Feil PIN.");
  }

  function logOutAdmin() {
    window.sessionStorage.removeItem(ADMIN_ACCESS_KEY);
    setHasAdminAccess(false);
    setResource(null);
    setBlockedTimes([]);
    setRentalRequests([]);
    setMessage("");
    setErrorMessage("");
    setAdminError(null);
  }

  async function createBlockedTime(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resource) {
      setErrorMessage("Tennisbanen er ikke lastet ennå.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");
    setAdminError(null);

    const startTimeIso = createDateTimeIso(date, startTime);
    const endTimeIso = createDateTimeIso(date, endTime);

    const supabase = createSupabaseClient();
    const { error } = await supabase.rpc("create_blocked_time", {
      p_end_time: endTimeIso,
      p_reason: reason,
      p_resource_id: resource.id,
      p_start_time: startTimeIso,
    });

    if (error) {
      console.error("Kunne ikke sperre tid", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });
      setAdminError({
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });
      setErrorMessage("Kunne ikke sperre tiden.");
    } else {
      setMessage("Tiden er sperret");
      await loadBlockedTimes(resource.id);
    }

    setIsSaving(false);
  }

  async function deleteBlockedTime(blockedTimeId: string) {
    const confirmed = window.confirm("Vil du fjerne denne sperringen?");

    if (!confirmed || !resource) {
      return;
    }

    setDeletingId(blockedTimeId);
    setMessage("");
    setErrorMessage("");
    setAdminError(null);

    const supabase = createSupabaseClient();
    const { error } = await supabase.rpc("delete_blocked_time", {
      p_blocked_time_id: blockedTimeId,
    });

    if (error) {
      console.error("Kunne ikke fjerne sperring", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });
      setAdminError({
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });
      setErrorMessage("Kunne ikke fjerne sperringen.");
    } else {
      setBlockedTimes((currentBlockedTimes) =>
        currentBlockedTimes.filter(
          (blockedTime) => blockedTime.id !== blockedTimeId,
        ),
      );
      setMessage("Sperringen er fjernet");
    }

    setDeletingId(null);
  }

  async function updateRentalRequest(
    bookingId: string,
    status: "approved" | "rejected",
  ) {
    setUpdatingRequestId(bookingId);
    setMessage("");
    setErrorMessage("");
    setAdminError(null);

    const supabase = createSupabaseClient();
    const { error } = await supabase.rpc("update_booking_request", {
      p_admin_comment: requestComments[bookingId]?.trim() ?? "",
      p_booking_id: bookingId,
      p_status: status,
    });

    if (error) {
      console.warn("Kunne ikke oppdatere forespørsel", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message,
      });
      setErrorMessage("Kunne ikke oppdatere forespørselen.");
    } else {
      setRentalRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== bookingId),
      );
      setRequestComments((currentComments) => {
        const nextComments = { ...currentComments };
        delete nextComments[bookingId];
        return nextComments;
      });
      setMessage(
        status === "approved"
          ? "Forespørselen er godkjent"
          : "Forespørselen er avslått",
      );
    }

    setUpdatingRequestId(null);
  }

  if (!hasCheckedAdminAccess) {
    return (
      <AppShell active="more">
        <p className="text-base font-medium text-slate-500">Laster...</p>
      </AppShell>
    );
  }

  if (!hasAdminAccess) {
    return (
      <AppShell active="more">
        <section className="flex min-h-[calc(100vh-11rem)] flex-col justify-center gap-6">
          <form
            className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            onSubmit={logInAdmin}
          >
            <div>
              <p className="text-sm font-semibold text-blue-700">Styret</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Admin
              </h1>
              <p className="mt-3 text-base font-medium text-slate-600">
                Skriv inn adminkode for å fortsette
              </p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
              Kode
              <input
                className="h-14 rounded-2xl border border-slate-200 px-4 text-base font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => {
                  setAdminCode(event.target.value);
                  setLoginError("");
                }}
                type="password"
                value={adminCode}
              />
            </label>

            {loginError ? (
              <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
                {loginError}
              </p>
            ) : null}

            <button
              className="h-14 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25"
              type="submit"
            >
              Logg inn
            </button>
          </form>

          <p className="rounded-3xl bg-amber-50 p-4 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
            Dette er enkel MVP-beskyttelse. Før produksjon bør admin sikres
            bedre.
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell active="more">
      <section className="flex flex-col gap-6">
        <div className="rounded-3xl bg-amber-50 p-4 shadow-sm ring-1 ring-amber-200">
          <p className="text-base font-bold text-amber-900">
            Admin er ikke beskyttet ennå. Må sikres før produksjon.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-blue-700">Styret</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Admin
          </h1>
          <p className="mt-3 text-base font-medium text-slate-600">
            Sperr tider for {resource?.name ?? "Tennisbane"}.
          </p>
        </div>

        <button
          className="h-12 rounded-2xl bg-white px-5 text-base font-bold text-slate-700 ring-1 ring-slate-300"
          onClick={logOutAdmin}
          type="button"
        >
          Logg ut admin
        </button>

        {message ? (
          <p className="rounded-3xl bg-white p-4 text-base font-bold text-slate-950 shadow-sm ring-1 ring-slate-200">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <div className="rounded-3xl bg-white p-4 text-base text-slate-700 shadow-sm ring-1 ring-slate-200">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <form
          className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          onSubmit={createBlockedTime}
        >
          <h2 className="text-xl font-bold text-slate-950">Sperr tid</h2>

          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            Dato
            <input
              className="h-14 rounded-2xl border border-slate-200 px-4 text-base font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              min={getTodayDate()}
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
              Starttid
              <input
                className="h-14 rounded-2xl border border-slate-200 px-4 text-base font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setStartTime(event.target.value)}
                required
                type="time"
                value={startTime}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
              Sluttid
              <input
                className="h-14 rounded-2xl border border-slate-200 px-4 text-base font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setEndTime(event.target.value)}
                required
                type="time"
                value={endTime}
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            Årsak
            <input
              className="h-14 rounded-2xl border border-slate-200 px-4 text-base font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              onChange={(event) => setReason(event.target.value)}
              placeholder="Dugnad, vedlikehold, arrangement"
              required
              type="text"
              value={reason}
            />
          </label>

          <button
            className="h-14 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-60"
            disabled={isSaving || isLoading || !resource}
            type="submit"
          >
            {isSaving ? "Sperrer..." : "Sperr tid"}
          </button>
        </form>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Velhuset-forespørsler
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Godkjenn eller avslå leieforespørsler.
            </p>
          </div>

          {!isLoading && rentalRequests.length === 0 ? (
            <p className="rounded-3xl bg-white p-5 text-base font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
              Ingen leieforespørsler venter på behandling.
            </p>
          ) : null}

          {rentalRequests.map((request) => (
            <article
              className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              key={request.id}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-blue-700">
                      {request.resources?.name ?? "Velhuset"}
                    </p>
                    <p className="text-lg font-bold text-slate-950">
                      {request.booking_types?.name ?? "Leieforespørsel"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {formatDate(request.start_time)} kl.{" "}
                      {formatTime(request.start_time)}-
                      {formatTime(request.end_time)}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {getBookingStatusLabel(request.status)}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
                  <p>
                    <span className="font-bold text-slate-950">Navn:</span>{" "}
                    {request.guest_name}
                  </p>
                  <p>
                    <span className="font-bold text-slate-950">Telefon:</span>{" "}
                    {request.guest_phone}
                  </p>
                  <p>
                    <span className="font-bold text-slate-950">E-post:</span>{" "}
                    {request.guest_email ?? "Ikke oppgitt"}
                  </p>
                </div>
                {request.purpose ? (
                  <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
                    <span className="font-bold text-slate-950">Formål:</span>{" "}
                    {request.purpose}
                  </p>
                ) : null}
              </div>

              {request.status === "requested" ? (
                <>
                  <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
                    Kommentar til bruker
                    <textarea
                      className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-base font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                      disabled={updatingRequestId === request.id}
                      onChange={(event) =>
                        setRequestComments((currentComments) => ({
                          ...currentComments,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="F.eks. Godkjent. Husk vask etter bruk. eller Avslått fordi velhuset er opptatt."
                      value={requestComments[request.id] ?? ""}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="h-12 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white disabled:opacity-60"
                      disabled={updatingRequestId === request.id}
                      onClick={() =>
                        updateRentalRequest(request.id, "approved")
                      }
                      type="button"
                    >
                      {updatingRequestId === request.id
                        ? "Oppdaterer..."
                        : "Godkjenn"}
                    </button>
                    <button
                      className="h-12 rounded-2xl bg-white px-5 text-base font-bold text-slate-700 ring-1 ring-slate-300 disabled:opacity-60"
                      disabled={updatingRequestId === request.id}
                      onClick={() =>
                        updateRentalRequest(request.id, "rejected")
                      }
                      type="button"
                    >
                      {updatingRequestId === request.id
                        ? "Oppdaterer..."
                        : "Avslå"}
                    </button>
                  </div>
                </>
              ) : null}
            </article>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Kommende sperringer
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Viser bare sperringer frem i tid.
            </p>
          </div>

          {isLoading ? (
            <p className="text-base font-medium text-slate-500">
              Laster sperringer...
            </p>
          ) : null}

          {!isLoading && blockedTimes.length === 0 ? (
            <p className="rounded-3xl bg-white p-5 text-base font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
              Ingen kommende sperringer.
            </p>
          ) : null}

          {blockedTimes.map((blockedTime) => (
            <article
              className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              key={blockedTime.id}
            >
              <div>
                <p className="text-lg font-bold text-slate-950">
                  {formatDate(blockedTime.start_time)}
                </p>
                <p className="mt-1 text-base font-medium text-slate-600">
                  {formatTime(blockedTime.start_time)}-
                  {formatTime(blockedTime.end_time)}
                </p>
                <p className="mt-2 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                  {blockedTime.reason ?? "Sperret"}
                </p>
              </div>

              <button
                className="h-12 rounded-2xl bg-white px-5 text-base font-bold text-slate-700 ring-1 ring-slate-300 disabled:opacity-60"
                disabled={deletingId === blockedTime.id}
                onClick={() => deleteBlockedTime(blockedTime.id)}
                type="button"
              >
                {deletingId === blockedTime.id
                  ? "Fjerner..."
                  : "Fjern sperring"}
              </button>
            </article>
          ))}
        </section>
      </section>
    </AppShell>
  );
}
