"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { getBookingStatusLabel } from "@/lib/booking-status";
import { getDeviceToken } from "@/lib/device-token";
import { createSupabaseClient } from "@/lib/supabase";

type MyBooking = {
  admin_comment: string | null;
  booking_type_id: string | null;
  guest_email: string | null;
  guest_name: string;
  guest_phone: string;
  id: string;
  purpose: string | null;
  resource_id: string;
  start_time: string;
  end_time: string;
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

type CancelErrorDetails = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

const visibleBookingStatuses = [
  "requested",
  "approved",
  "rejected",
  "confirmed",
  "cancelled",
];

const statusHelpTexts: Record<string, string> = {
  requested: "Venter på godkjenning fra styret.",
  approved: "Bookingen er godkjent.",
  rejected: "Forespørselen ble avslått.",
  confirmed: "Bookingen er bekreftet.",
  cancelled: "Bookingen er kansellert.",
};

function canCancelBooking(status: string) {
  return ["requested", "approved", "confirmed"].includes(status);
}

function getCancelButtonLabel(status: string) {
  return status === "requested" ? "Angre forespørsel" : "Kanseller booking";
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const deviceToken = getDeviceToken();

    if (!deviceToken) {
      window.setTimeout(() => setIsLoading(false), 0);
      return;
    }

    const currentDeviceToken = deviceToken;
    let isActive = true;

    async function loadBookings() {
      setIsLoading(true);
      setErrorMessage("");

      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          status,
          admin_comment,
          guest_name,
          guest_phone,
          guest_email,
          purpose,
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
        .eq("device_token", currentDeviceToken)
        .in("status", visibleBookingStatuses)
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
          .select("*")
          .eq("device_token", currentDeviceToken)
          .in("status", visibleBookingStatuses)
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
        } else {
          const fallbackRows = fallbackResult.data ?? [];
          const resourceIds = [
            ...new Set(fallbackRows.map((booking) => booking.resource_id)),
          ];
          const bookingTypeIds = [
            ...new Set(
              fallbackRows
                .map((booking) => booking.booking_type_id)
                .filter((bookingTypeId): bookingTypeId is string =>
                  Boolean(bookingTypeId),
                ),
            ),
          ];
          const resourcesById = new Map<string, { name: string; slug: string }>();
          const bookingTypesById = new Map<
            string,
            { name: string; slug: string }
          >();

          if (resourceIds.length > 0) {
            const { data: resourcesData } = await supabase
              .from("resources")
              .select("id, name, slug")
              .in("id", resourceIds);

            for (const resource of resourcesData ?? []) {
              resourcesById.set(resource.id, {
                name: resource.name,
                slug: resource.slug,
              });
            }
          }

          if (bookingTypeIds.length > 0) {
            const { data: bookingTypesData } = await supabase
              .from("booking_types")
              .select("id, name, slug")
              .in("id", bookingTypeIds);

            for (const bookingType of bookingTypesData ?? []) {
              bookingTypesById.set(bookingType.id, {
                name: bookingType.name,
                slug: bookingType.slug,
              });
            }
          }

          const fallbackBookings = (fallbackResult.data ?? []).map(
            (booking) => ({
              ...booking,
              booking_types: booking.booking_type_id
                ? (bookingTypesById.get(booking.booking_type_id) ?? null)
                : null,
              resources: resourcesById.get(booking.resource_id) ?? null,
            }),
          ) as MyBooking[];

          setBookings(fallbackBookings);
        }
      } else {
        const loadedBookings = (data ?? []) as unknown as MyBooking[];

        setBookings(loadedBookings);
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
      "Er du sikker på at du vil kansellere denne?",
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
    const { error } = await supabase.rpc("cancel_own_booking", {
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
        currentBookings.map((currentBooking) =>
          currentBooking.id === booking.id
            ? { ...currentBooking, status: "cancelled" }
            : currentBooking,
        ),
      );
      setMessage("Bookingen er kansellert.");
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

        {isLoading ? (
          <p className="text-base font-medium text-slate-500">
            Laster bookinger...
          </p>
        ) : null}

        {!isLoading && bookings.length === 0 ? (
          <div className="flex flex-col gap-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-medium text-slate-700">
              Ingen bookinger på denne enheten.
            </p>

            <div className="grid gap-3">
              <Link
                className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25"
                href="/r/tennisbane"
              >
                Book tennisbane
              </Link>
              <Link
                className="flex h-14 items-center justify-center rounded-2xl bg-white px-5 text-base font-bold text-slate-700 ring-1 ring-slate-300"
                href="/velhuset"
              >
                Lei velhuset
              </Link>
            </div>
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
                  Ressurs: {booking.resources?.name ?? "Booking"}
                </h2>
                {booking.booking_types ? (
                  <p className="text-sm font-bold text-blue-700">
                    Bookingtype: {booking.booking_types.name}
                  </p>
                ) : null}
                <p className="text-base font-medium text-slate-600">
                  Dato: {formatDate(booking.start_time)}
                </p>
                <p className="text-base font-medium text-slate-600">
                  Tid: {formatTime(booking.start_time)}-
                  {formatTime(booking.end_time)}
                </p>
                <p className="mt-2 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                  Status: {getBookingStatusLabel(booking.status)}
                </p>
                {statusHelpTexts[booking.status] ? (
                  <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800 ring-1 ring-amber-100">
                    {statusHelpTexts[booking.status]}
                  </p>
                ) : null}
                {booking.purpose ? (
                  <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
                    Formål: {booking.purpose}
                  </p>
                ) : null}
                {booking.admin_comment ? (
                  <p className="mt-2 rounded-2xl bg-blue-50 p-3 text-sm font-medium text-blue-900 ring-1 ring-blue-100">
                    <span className="font-bold">Melding fra styret:</span>{" "}
                    {booking.admin_comment}
                  </p>
                ) : null}
              </div>

              {canCancelBooking(booking.status) ? (
                <button
                  className="h-12 rounded-2xl bg-white px-5 text-base font-bold text-slate-700 ring-1 ring-slate-300 disabled:opacity-60"
                  disabled={cancellingId === booking.id}
                  onClick={() => cancelBooking(booking)}
                  type="button"
                >
                  {cancellingId === booking.id
                    ? "Kansellerer..."
                    : getCancelButtonLabel(booking.status)}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
