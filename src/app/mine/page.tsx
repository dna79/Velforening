"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { getBookingStatusLabel } from "@/lib/booking-status";
import { DEVICE_TOKEN_KEY, getDeviceToken } from "@/lib/device-token";
import { createSupabaseClient } from "@/lib/supabase";

type MyBooking = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  resources: {
    name: string;
  } | null;
};

type CancelErrorDetails = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

type SupabaseDebugError = {
  code?: string;
  details?: string;
  message?: string;
};

type MineDebugInfo = {
  bookingCount: number;
  deviceTokenExists: boolean;
  deviceTokenPreview: string;
  error: SupabaseDebugError | null;
  localStorageKey: string;
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

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cancelErrorDetails, setCancelErrorDetails] =
    useState<CancelErrorDetails | null>(null);
  const [debugInfo, setDebugInfo] = useState<MineDebugInfo>({
    bookingCount: 0,
    deviceTokenExists: false,
    deviceTokenPreview: "",
    error: null,
    localStorageKey: DEVICE_TOKEN_KEY,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const deviceToken = getDeviceToken();

    setDebugInfo((currentDebugInfo) => ({
      ...currentDebugInfo,
      bookingCount: 0,
      deviceTokenExists: Boolean(deviceToken),
      deviceTokenPreview: deviceToken?.slice(0, 8) ?? "",
      error: null,
      localStorageKey: DEVICE_TOKEN_KEY,
    }));

    if (!deviceToken) {
      setIsLoading(false);
      return;
    }

    const currentDeviceToken = deviceToken;
    let isActive = true;

    async function loadBookings() {
      setIsLoading(true);
      setErrorMessage("");

      const supabase = createSupabaseClient();
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("bookings")
        .select("id, start_time, end_time, status, resources(name)")
        .eq("device_token", currentDeviceToken)
        .eq("status", "confirmed")
        .gte("start_time", nowIso)
        .order("start_time", { ascending: true });

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Mine bookinger kunne ikke hentes", {
          code: error.code,
          details: error.details,
          message: error.message,
        });

        const fallbackResult = await supabase
          .from("bookings")
          .select("id, start_time, end_time, status")
          .eq("device_token", currentDeviceToken)
          .eq("status", "confirmed")
          .gte("start_time", nowIso)
          .order("start_time", { ascending: true });

        if (!isActive) {
          return;
        }

        if (fallbackResult.error) {
          console.error("Mine bookinger fallback feilet", {
            code: fallbackResult.error.code,
            details: fallbackResult.error.details,
            message: fallbackResult.error.message,
          });
          setErrorMessage("Kunne ikke hente bookingene dine.");
          setBookings([]);
          setDebugInfo((currentDebugInfo) => ({
            ...currentDebugInfo,
            bookingCount: 0,
            error: {
              code: fallbackResult.error?.code,
              details: fallbackResult.error?.details,
              message: fallbackResult.error?.message,
            },
          }));
        } else {
          const fallbackBookings = (fallbackResult.data ?? []).map(
            (booking) => ({
              ...booking,
              resources: { name: "Tennisbane" },
            }),
          ) as MyBooking[];

          setBookings(fallbackBookings);
          setDebugInfo((currentDebugInfo) => ({
            ...currentDebugInfo,
            bookingCount: fallbackBookings.length,
            error: {
              code: error.code,
              details: error.details,
              message: error.message,
            },
          }));
        }
      } else {
        const loadedBookings = (data ?? []) as MyBooking[];

        setBookings(loadedBookings);
        setDebugInfo((currentDebugInfo) => ({
          ...currentDebugInfo,
          bookingCount: loadedBookings.length,
          error: null,
        }));
      }

      setIsLoading(false);
    }

    loadBookings();

    return () => {
      isActive = false;
    };
  }, []);

  async function cancelBooking(booking: MyBooking) {
    const confirmed = window.confirm(
      "Er du sikker på at du vil avbestille denne bookingen?",
    );

    if (!confirmed) {
      return;
    }

    setCancellingId(booking.id);
    setMessage("");
    setErrorMessage("");
    setCancelErrorDetails(null);

    const deviceToken = getDeviceToken();

    if (!deviceToken) {
      setErrorMessage("Kunne ikke avbestille bookingen.");
      setCancellingId(null);
      return;
    }

    const supabase = createSupabaseClient();
    const { error } = await supabase.rpc("cancel_booking", {
      p_booking_id: booking.id,
      p_device_token: deviceToken,
    });

    if (error) {
      console.error(
        "Booking kunne ikke avbestilles",
        "message:",
        error?.message,
        "details:",
        error?.details,
        "hint:",
        error?.hint,
        "code:",
        error?.code,
      );
      setCancelErrorDetails({
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        message: error?.message,
      });
      setErrorMessage("Kunne ikke avbestille bookingen.");
    } else {
      setBookings((currentBookings) =>
        currentBookings.filter(
          (currentBooking) => currentBooking.id !== booking.id,
        ),
      );
      setMessage("Bookingen er avbestilt");
    }

    setCancellingId(null);
  }

  return (
    <AppShell active="mine">
      <section className="flex flex-col gap-6">
        <header>
          <p className="text-sm font-semibold text-blue-700">Oversikt</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Mine bookinger
          </h1>
        </header>

        {message ? (
          <p className="rounded-3xl bg-white p-4 text-base font-bold text-slate-950 shadow-sm ring-1 ring-slate-200">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <div className="rounded-3xl bg-white p-4 text-base text-slate-700 shadow-sm ring-1 ring-slate-200">
            <p>{errorMessage}</p>

            {process.env.NODE_ENV === "development" && cancelErrorDetails ? (
              <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm text-slate-800">
                <p className="font-semibold">Utviklingsdetaljer</p>
                <p>Melding: {cancelErrorDetails.message ?? "(tom)"}</p>
                <p>Detaljer: {cancelErrorDetails.details ?? "(tom)"}</p>
                <p>Hint: {cancelErrorDetails.hint ?? "(tom)"}</p>
                <p>Kode: {cancelErrorDetails.code ?? "(tom)"}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {process.env.NODE_ENV === "development" ? (
          <div className="rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
            <p className="font-bold text-slate-950">Mine bookinger debug</p>
            <p>localStorage-key: {debugInfo.localStorageKey}</p>
            <p>device_token finnes: {debugInfo.deviceTokenExists ? "ja" : "nei"}</p>
            <p>
              device_token første 8 tegn:{" "}
              {debugInfo.deviceTokenPreview || "(tom)"}
            </p>
            <p>Bookinger hentet: {debugInfo.bookingCount}</p>
            {debugInfo.error ? (
              <div className="mt-3 rounded-2xl bg-slate-100 p-3">
                <p>Supabase-feil: {debugInfo.error.message ?? "(tom)"}</p>
                <p>Detaljer: {debugInfo.error.details ?? "(tom)"}</p>
                <p>Kode: {debugInfo.error.code ?? "(tom)"}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-base font-medium text-slate-500">
            Laster bookinger...
          </p>
        ) : null}

        {!isLoading && bookings.length === 0 ? (
          <div className="flex flex-col gap-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-medium text-slate-700">
              Ingen bookinger på denne mobilen.
            </p>

            <Link
              className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25"
              href="/r/tennisbane"
            >
              Book tennisbane
            </Link>
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <article
              className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              key={booking.id}
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-950">
                  {booking.resources?.name ?? "Tennisbane"}
                </h2>
                <p className="text-base font-medium text-slate-600">
                  {formatDate(booking.start_time)}
                </p>
                <p className="text-base font-medium text-slate-600">
                  {formatTime(booking.start_time)}-{formatTime(booking.end_time)}
                </p>
                <p className="mt-2 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                  Status: {getBookingStatusLabel(booking.status)}
                </p>
              </div>

              {booking.status === "confirmed" ? (
                <button
                  className="h-12 rounded-2xl bg-white px-5 text-base font-bold text-slate-700 ring-1 ring-slate-300 disabled:opacity-60"
                  disabled={cancellingId === booking.id}
                  onClick={() => cancelBooking(booking)}
                  type="button"
                >
                  {cancellingId === booking.id ? "Avbestiller..." : "Avbestill"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
