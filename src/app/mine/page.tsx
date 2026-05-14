"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { HomeLandscapeFooter } from "@/components/HomeLandscapeFooter";
import { StatusBadge } from "@/components/ui";
import { getDeviceToken } from "@/lib/device-token";
import { createSupabaseClient } from "@/lib/supabase";

type MyBooking = {
  admin_comment: string | null;
  booking_type_id: string | null;
  cancelled_at: string | null;
  created_at: string | null;
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

const visibleBookingStatuses = [
  "requested",
  "approved",
  "rejected",
  "confirmed",
  "cancelled",
];

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
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const currentTimeTimeoutId = window.setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);

    const deviceToken = getDeviceToken();

    if (!deviceToken) {
      window.setTimeout(() => setIsLoading(false), 0);
      return () => window.clearTimeout(currentTimeTimeoutId);
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
          created_at,
          start_time,
          end_time,
          status,
          admin_comment,
          guest_name,
          guest_phone,
          guest_email,
          purpose,
          cancelled_at,
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
      window.clearTimeout(currentTimeTimeoutId);
    };
  }, []);

  async function cancelBooking(booking: MyBooking) {
    const isRequest = booking.status === "requested";
    const confirmed = window.confirm(
      isRequest
        ? "Er du sikker på at du vil angre forespørselen?"
        : "Er du sikker på at du vil kansellere denne?",
    );

    if (!confirmed) {
      return;
    }

    setCancellingId(booking.id);
    setMessage("");
    setErrorMessage("");

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
      setErrorMessage("Kunne ikke avbestille bookingen.");
    } else {
      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          currentBooking.id === booking.id
            ? {
                ...currentBooking,
                cancelled_at: new Date().toISOString(),
                status: "cancelled",
              }
            : currentBooking,
        ),
      );
      setMessage(
        isRequest ? "Forespørselen er kansellert." : "Bookingen er kansellert.",
      );
    }

    setCancellingId(null);
  }

  const activeBookings = bookings
    .filter(
      (booking) =>
        ["approved", "confirmed"].includes(booking.status) &&
        new Date(booking.end_time).getTime() >= currentTime,
    )
    .sort(
      (firstBooking, secondBooking) =>
        new Date(firstBooking.start_time).getTime() -
        new Date(secondBooking.start_time).getTime(),
    );
  const requestBookings = bookings
    .filter((booking) => ["requested", "rejected"].includes(booking.status))
    .sort((firstBooking, secondBooking) => {
      const firstTime = new Date(
        firstBooking.created_at ?? firstBooking.start_time,
      ).getTime();
      const secondTime = new Date(
        secondBooking.created_at ?? secondBooking.start_time,
      ).getTime();

      return secondTime - firstTime;
    });
  const historyBookings = bookings
    .filter(
      (booking) =>
        booking.status === "cancelled" ||
        (["approved", "confirmed"].includes(booking.status) &&
          new Date(booking.end_time).getTime() < currentTime),
    )
    .sort(
      (firstBooking, secondBooking) => {
        const firstTime = new Date(
          firstBooking.cancelled_at ??
            firstBooking.created_at ??
            firstBooking.end_time,
        ).getTime();
        const secondTime = new Date(
          secondBooking.cancelled_at ??
            secondBooking.created_at ??
            secondBooking.end_time,
        ).getTime();

        return secondTime - firstTime;
      },
    );

  return (
    <AppShell active="mine">
      <section className="flex flex-col gap-5">
        <header>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-blue-700">
            Oversikt
          </p>
          <h1 className="mt-1 text-[32px] font-black tracking-[-0.04em] text-[#07122F]">
            Mine bookinger
          </h1>
        </header>

        {message ? (
          <p className="rounded-[28px] bg-white p-4 text-base font-bold text-[#07122F] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
            {message}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-[28px] bg-white p-4 text-base text-[#53657D] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-base font-medium text-slate-500">
            Laster bookinger...
          </p>
        ) : null}

        {!isLoading && bookings.length === 0 ? (
          <div className="flex flex-col gap-6 rounded-[30px] bg-white p-5 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
            <p className="text-lg font-medium text-slate-700">
              Ingen bookinger på denne enheten.
            </p>

            <div className="grid gap-3">
              <Link
                className="flex h-14 items-center justify-center rounded-[18px] bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25"
                href="/r/tennisbane"
              >
                Book tennisbane
              </Link>
              <Link
                className="flex h-14 items-center justify-center rounded-[18px] bg-white px-5 text-base font-bold text-blue-700 ring-1 ring-blue-200"
                href="/velhuset"
              >
                Lei velhuset
              </Link>
            </div>
          </div>
        ) : null}

        {!isLoading && bookings.length > 0 ? (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-black text-[#07122F]">
                Aktive bookinger
              </h2>
              {activeBookings.length > 0 ? (
                activeBookings.map((booking) => (
                  <BookingCard
                    booking={booking}
                    cancellingId={cancellingId}
                    key={booking.id}
                    onCancel={cancelBooking}
                  />
                ))
              ) : (
                <p className="rounded-[28px] bg-white p-5 text-base font-semibold text-[#53657D] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
                  Du har ingen aktive bookinger.
                </p>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-black text-[#07122F]">
                Forespørsler
              </h2>
              {requestBookings.length > 0 ? (
                requestBookings.map((booking) => (
                  <BookingCard
                    booking={booking}
                    cancellingId={cancellingId}
                    key={booking.id}
                    onCancel={cancelBooking}
                  />
                ))
              ) : (
                <p className="rounded-[28px] bg-white p-5 text-base font-semibold text-[#53657D] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
                  Du har ingen aktive forespørsler.
                </p>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <button
                className="flex h-14 items-center justify-between rounded-[28px] bg-white px-5 text-left text-xl font-black text-[#07122F] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]"
                onClick={() => setIsHistoryOpen((current) => !current)}
                type="button"
              >
                <span>Historikk ({historyBookings.length})</span>
                <span className="text-sm font-bold text-blue-700">
                  {isHistoryOpen ? "Skjul historikk" : "Vis historikk"}
                </span>
              </button>

              {isHistoryOpen ? (
                historyBookings.length > 0 ? (
                  historyBookings.map((booking) => (
                    <BookingCard
                      allowCancel={false}
                      booking={booking}
                      cancellingId={cancellingId}
                      key={booking.id}
                      onCancel={cancelBooking}
                    />
                  ))
                ) : (
                  <p className="rounded-[28px] bg-white p-5 text-base font-semibold text-[#53657D] shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
                    Ingen historikk ennå.
                  </p>
                )
              ) : null}
            </section>
          </>
        ) : null}
        <HomeLandscapeFooter />
      </section>
    </AppShell>
  );
}

function BookingCard({
  allowCancel = true,
  booking,
  cancellingId,
  onCancel,
}: {
  allowCancel?: boolean;
  booking: MyBooking;
  cancellingId: string | null;
  onCancel: (booking: MyBooking) => void;
}) {
  const resourceName = booking.resources?.name ?? "Booking";
  const isRequested = booking.status === "requested";
  const isRejected = booking.status === "rejected";

  return (
    <article className="flex flex-col gap-4 rounded-[28px] bg-white p-4 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
      <div className="flex gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <ResourceIcon slug={booking.resources?.slug} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black leading-tight text-[#07122F]">
              {resourceName}
            </h3>
            {booking.booking_types ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {booking.booking_types.name}
              </span>
            ) : null}
          </div>
          <div className="mt-2 grid gap-1.5 text-sm font-semibold text-[#53657D]">
            <p className="flex items-center gap-2">
              <SmallIcon name="calendar" />
              {formatDate(booking.start_time)}
            </p>
            <p className="flex items-center gap-2">
              <SmallIcon name="clock" />
              {formatTime(booking.start_time)}-{formatTime(booking.end_time)}
            </p>
          </div>
          <div className="mt-3">
            <StatusBadge status={booking.status} />
          </div>
          {isRequested ? (
            <p className="mt-2 text-sm font-semibold text-[#53657D]">
              Venter på godkjenning
            </p>
          ) : null}
        </div>
      </div>

      <div>
        {booking.purpose ? (
          <p className="rounded-[18px] bg-slate-50 p-3 text-sm font-medium text-[#53657D]">
            Formål: {booking.purpose}
          </p>
        ) : null}
        {booking.admin_comment ? (
          <div
            className={`mt-2 rounded-[18px] p-3 text-sm font-medium ring-1 ${
              isRejected
                ? "bg-red-50 text-red-900 ring-red-100"
                : "bg-blue-50 text-blue-900 ring-blue-100"
            }`}
          >
            <p className="font-bold">Melding fra styret</p>
            <p className="mt-1">{booking.admin_comment}</p>
          </div>
        ) : null}
      </div>

      {allowCancel && canCancelBooking(booking.status) ? (
        <button
          className="h-12 rounded-[18px] bg-white px-5 text-base font-bold text-blue-700 ring-1 ring-blue-200 disabled:opacity-60"
          disabled={cancellingId === booking.id}
          onClick={() => onCancel(booking)}
          type="button"
        >
          {cancellingId === booking.id
            ? "Kansellerer..."
            : getCancelButtonLabel(booking.status)}
        </button>
      ) : null}
    </article>
  );
}

function ResourceIcon({ slug }: { slug?: string }) {
  if (slug === "velhuset") {
    return (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M3 11 12 4l9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <ellipse cx="9" cy="8" rx="4" ry="6" transform="rotate(24 9 8)" />
      <path d="m12 13 7 7" />
      <circle cx="17" cy="7" r="3" />
    </svg>
  );
}

function SmallIcon({ name }: { name: "calendar" | "clock" }) {
  const paths = {
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M3 10h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
