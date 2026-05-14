"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { HomeLandscapeFooter } from "@/components/HomeLandscapeFooter";
import { StatusBadge } from "@/components/ui";
import { createSupabaseClient } from "@/lib/supabase";

type AdminRequest = {
  admin_comment: string | null;
  booking_type_id: string | null;
  created_at: string | null;
  end_time: string;
  guest_email: string | null;
  guest_name: string;
  guest_phone: string;
  id: string;
  purpose: string | null;
  resource_id: string;
  start_time: string;
  status: string;
  booking_types: {
    name: string;
    slug: string;
  } | null;
  resources: {
    name: string;
    slug: string;
  } | null;
};

const ADMIN_ACCESS_KEY = "admin_unlocked";
const visibleProcessedStatuses = ["approved", "rejected"];

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

function logSupabaseError(label: string, error: {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
}) {
  console.warn(label, {
    code: error.code,
    details: error.details,
    hint: error.hint,
    message: error.message,
  });
}

export default function AdminPage() {
  const [adminCode, setAdminCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [hasCheckedAdminAccess, setHasCheckedAdminAccess] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<AdminRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<AdminRequest[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isProcessedOpen, setIsProcessedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setHasAdminAccess(
        window.sessionStorage.getItem(ADMIN_ACCESS_KEY) === "true",
      );
      setHasCheckedAdminAccess(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function loadRequests(statuses: string[]) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        start_time,
        end_time,
        created_at,
        status,
        guest_name,
        guest_phone,
        guest_email,
        purpose,
        admin_comment,
        resource_id,
        booking_type_id,
        resources (
          name,
          slug
        ),
        booking_types (
          name,
          slug
        )
      `)
      .in("status", statuses)
      .order("created_at", { ascending: false });

    if (!error) {
      return ((data ?? []) as unknown as AdminRequest[]).filter(
        (booking) => booking.resources?.slug === "velhuset",
      );
    }

    logSupabaseError("Kunne ikke hente adminforespørsler med relasjoner", error);

    const fallbackResult = await supabase
      .from("bookings")
      .select("*")
      .in("status", statuses)
      .order("created_at", { ascending: false });

    if (fallbackResult.error) {
      logSupabaseError(
        "Kunne ikke hente adminforespørsler",
        fallbackResult.error,
      );
      setErrorMessage("Kunne ikke hente forespørsler.");
      return [];
    }

    return (fallbackResult.data ?? [])
      .map((booking) => ({
        ...booking,
        booking_types: null,
        resources: {
          name: "Velhuset",
          slug: "velhuset",
        },
      }))
      .filter((booking) => booking.resources.slug === "velhuset") as AdminRequest[];
  }

  useEffect(() => {
    if (!hasAdminAccess) {
      return;
    }

    let isActive = true;

    async function loadAdminRequests() {
      setIsLoading(true);
      setErrorMessage("");

      const [pendingResult, processedResult] = await Promise.all([
        loadRequests(["requested"]),
        loadRequests(visibleProcessedStatuses),
      ]);

      if (!isActive) {
        return;
      }

      setPendingRequests(pendingResult);
      setProcessedRequests(processedResult);
      setIsLoading(false);
    }

    loadAdminRequests();

    return () => {
      isActive = false;
    };
  }, [hasAdminAccess]);

  function logInAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN?.trim();
    const enteredPin = adminCode.trim();

    if (!expectedPin || enteredPin !== expectedPin) {
      setLoginError("Feil kode");
      return;
    }

    window.sessionStorage.setItem(ADMIN_ACCESS_KEY, "true");
    setHasAdminAccess(true);
    setLoginError("");
    setAdminCode("");
  }

  function logOutAdmin() {
    window.sessionStorage.removeItem(ADMIN_ACCESS_KEY);
    setHasAdminAccess(false);
    setPendingRequests([]);
    setProcessedRequests([]);
    setComments({});
    setMessage("");
    setErrorMessage("");
  }

  async function updateRequest(booking: AdminRequest, status: "approved" | "rejected") {
    setUpdatingRequestId(booking.id);
    setMessage("");
    setErrorMessage("");

    const comment = comments[booking.id]?.trim() ?? "";
    const supabase = createSupabaseClient();
    const { error } = await supabase.rpc("update_booking_request", {
      p_admin_comment: comment || null,
      p_booking_id: booking.id,
      p_status: status,
    });

    if (error) {
      logSupabaseError("Kunne ikke oppdatere forespørsel", error);
      setErrorMessage("Kunne ikke oppdatere forespørselen.");
      setUpdatingRequestId(null);
      return;
    }

    const processedRequest: AdminRequest = {
      ...booking,
      admin_comment: comment || null,
      status,
    };

    setPendingRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== booking.id),
    );
    setProcessedRequests((currentRequests) => [
      processedRequest,
      ...currentRequests.filter((request) => request.id !== booking.id),
    ]);
    setComments((currentComments) => {
      const nextComments = { ...currentComments };
      delete nextComments[booking.id];
      return nextComments;
    });
    setMessage(
      status === "approved"
        ? "Forespørselen er godkjent."
        : "Forespørselen er avslått.",
    );
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
        <section className="flex min-h-[calc(100vh-9rem)] flex-col justify-center">
          <form
            className="flex flex-col gap-5 rounded-[30px] bg-white p-6 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]"
            onSubmit={logInAdmin}
          >
            <div>
              <h1 className="text-[32px] font-black tracking-[-0.04em] text-[#07122F]">
                Admin
              </h1>
              <p className="mt-3 text-base font-semibold text-[#53657D]">
                Skriv inn adminkode for å fortsette
              </p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
              Kode
              <input
                className="h-14 rounded-[18px] border border-[#DDE8F5] px-4 text-base font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
                className="h-14 rounded-[18px] bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25"
              type="submit"
            >
              Logg inn
            </button>
          </form>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell active="more">
      <section className="flex flex-col gap-5">
        <header className="rounded-[30px] bg-white p-5 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
          <p className="text-sm font-semibold text-blue-700">Styret</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Admin
          </h1>
          <p className="mt-3 text-base font-medium text-slate-600">
            Behandle forespørsler om leie av velhuset.
          </p>
        </header>

        <button
          className="h-12 rounded-[18px] bg-white px-5 text-base font-bold text-blue-700 ring-1 ring-blue-200"
          onClick={logOutAdmin}
          type="button"
        >
          Logg ut
        </button>

        {message ? (
          <p className="rounded-[28px] bg-white p-4 text-base font-bold text-[#07122F] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-3xl bg-red-50 p-4 text-base font-bold text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </p>
        ) : null}

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-slate-950">Nye forespørsler</h2>

          {isLoading ? (
            <p className="text-base font-medium text-slate-500">
              Laster forespørsler...
            </p>
          ) : null}

          {!isLoading && pendingRequests.length === 0 ? (
            <div className="rounded-[28px] bg-white p-5 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
              <h3 className="text-lg font-bold text-slate-950">
                Ingen nye forespørsler
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Nye leieforespørsler for velhuset vil vises her.
              </p>
            </div>
          ) : null}

          {pendingRequests.map((request) => (
            <AdminRequestCard
              comments={comments}
              isUpdating={updatingRequestId === request.id}
              key={request.id}
              onCommentChange={(value) =>
                setComments((currentComments) => ({
                  ...currentComments,
                  [request.id]: value,
                }))
              }
              onUpdate={updateRequest}
              request={request}
              showActions
            />
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <button
            className="flex h-14 items-center justify-between rounded-[28px] bg-white px-5 text-left text-xl font-black text-[#07122F] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]"
            onClick={() => setIsProcessedOpen((current) => !current)}
            type="button"
          >
            <span>Behandlet ({processedRequests.length})</span>
            <span className="text-sm font-bold text-blue-700">
              {isProcessedOpen ? "Skjul" : "Vis"}
            </span>
          </button>

          {isProcessedOpen ? (
            processedRequests.length > 0 ? (
              processedRequests.map((request) => (
                <AdminRequestCard
                  comments={comments}
                  isUpdating={false}
                  key={request.id}
                  onCommentChange={() => undefined}
                  onUpdate={updateRequest}
                  request={request}
                  showActions={false}
                />
              ))
            ) : (
              <p className="rounded-[28px] bg-white p-5 text-base font-semibold text-[#53657D] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
                Ingen behandlede forespørsler ennå.
              </p>
            )
          ) : null}
        </section>
        <HomeLandscapeFooter />
      </section>
    </AppShell>
  );
}

function AdminRequestCard({
  comments,
  isUpdating,
  onCommentChange,
  onUpdate,
  request,
  showActions,
}: {
  comments: Record<string, string>;
  isUpdating: boolean;
  onCommentChange: (value: string) => void;
  onUpdate: (request: AdminRequest, status: "approved" | "rejected") => void;
  request: AdminRequest;
  showActions: boolean;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold leading-tight text-slate-950">
              {request.resources?.name ?? "Velhuset"}
            </h3>
            {request.booking_types ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {request.booking_types.name}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {formatDate(request.start_time)} kl. {formatTime(request.start_time)}
            -{formatTime(request.end_time)}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-2 rounded-[18px] bg-slate-50 p-3 text-sm font-medium text-[#53657D]">
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
        {request.purpose ? (
          <p>
            <span className="font-bold text-slate-950">Formål:</span>{" "}
            {request.purpose}
          </p>
        ) : null}
      </div>

      {showActions ? (
        <>
          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            Kommentar til bruker
            <textarea
              className="min-h-28 rounded-[18px] border border-[#DDE8F5] px-4 py-3 text-base font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              disabled={isUpdating}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder="F.eks. Godkjent. Husk vask etter bruk."
              value={comments[request.id] ?? ""}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="h-12 rounded-[18px] bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-60"
              disabled={isUpdating}
              onClick={() => onUpdate(request, "approved")}
              type="button"
            >
              {isUpdating ? "Behandler..." : "Godkjenn"}
            </button>
            <button
              className="h-12 rounded-[18px] bg-red-50 px-5 text-base font-bold text-red-700 ring-1 ring-red-100 disabled:opacity-60"
              disabled={isUpdating}
              onClick={() => onUpdate(request, "rejected")}
              type="button"
            >
              {isUpdating ? "Behandler..." : "Avslå"}
            </button>
          </div>
        </>
      ) : request.admin_comment ? (
        <div className="rounded-[18px] bg-blue-50 p-3 text-sm font-medium text-blue-900 ring-1 ring-blue-100">
          <p className="font-bold">Melding til bruker</p>
          <p className="mt-1">{request.admin_comment}</p>
        </div>
      ) : null}
    </article>
  );
}
