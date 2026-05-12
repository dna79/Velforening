"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { getOrCreateDeviceToken } from "@/lib/device-token";
import { createSupabaseClient } from "@/lib/supabase";
import type { Booking, BlockedTime, Resource } from "@/lib/types";

const fallbackTimeSlots = [
  { endTime: "09:00", label: "08:00–09:00", startTime: "08:00" },
  { endTime: "10:00", label: "09:00–10:00", startTime: "09:00" },
  { endTime: "11:00", label: "10:00–11:00", startTime: "10:00" },
  { endTime: "12:00", label: "11:00–12:00", startTime: "11:00" },
];

type TimeSlot = {
  endTime: string;
  label: string;
  startTime: string;
};

function formatDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "long",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function normalizeTime(time: string) {
  if (time.includes("T")) {
    const date = new Date(time);

    return minutesToTime(date.getHours() * 60 + date.getMinutes());
  }

  return time.slice(0, 5);
}

function getDayRange(date: string) {
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return {
    endOfDayIso: endOfDay.toISOString(),
    startOfDayIso: startOfDay.toISOString(),
  };
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function generateTimeSlots(resource: Resource | null) {
  if (!resource) {
    return fallbackTimeSlots;
  }

  const interval = resource.booking_interval_minutes;
  const opensAt = timeToMinutes(resource.opens_at);
  const closesAt = timeToMinutes(resource.closes_at);
  const slots = [];

  for (let start = opensAt; start + interval <= closesAt; start += interval) {
    const end = start + interval;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    slots.push({
      endTime,
      label: `${startTime}–${endTime}`,
      startTime,
    });
  }

  return slots;
}

function createSlotDateTimeIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function isSlotPassed(date: string, slot: TimeSlot) {
  if (date !== formatDate(0)) {
    return false;
  }

  return new Date(`${date}T${slot.endTime}:00`).getTime() <= Date.now();
}

function doesSlotOverlapBlockedTime(date: string, slot: TimeSlot, blockedTime: BlockedTime) {
  const slotStart = new Date(`${date}T${slot.startTime}:00`).getTime();
  const slotEnd = new Date(`${date}T${slot.endTime}:00`).getTime();
  const blockedStart = new Date(blockedTime.start_time).getTime();
  const blockedEnd = new Date(blockedTime.end_time).getTime();

  return slotStart < blockedEnd && slotEnd > blockedStart;
}

type SupabaseQueryName = "resources" | "bookings" | "blocked_times";

type DevelopmentError = {
  details?: string | null;
  message: string;
  query: SupabaseQueryName;
};

type BookingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default function BookingPage({ params }: BookingPageProps) {
  const [slug, setSlug] = useState("");
  const [selectedDate, setSelectedDate] = useState(formatDate(0));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [resource, setResource] = useState<Resource | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [developmentError, setDevelopmentError] =
    useState<DevelopmentError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    params.then((resolvedParams) => setSlug(resolvedParams.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    let isActive = true;

    async function loadBookingData() {
      setIsLoading(true);
      setErrorMessage("");
      setDevelopmentError(null);

      try {
        const supabase = createSupabaseClient();
        const { data: resourceData, error: resourceError } = await supabase
          .from("resources")
          .select("*")
          .eq("slug", slug)
          .single();

        if (resourceError) {
          throw {
            details: resourceError.details,
            message: resourceError.message,
            query: "resources" satisfies SupabaseQueryName,
          };
        }

        if (!resourceData) {
          throw new Error("Fant ikke tennisbanen.");
        }

        const { endOfDayIso, startOfDayIso } = getDayRange(selectedDate);

        const [bookingsResult, blockedTimesResult] = await Promise.all([
          supabase
            .from("bookings")
            .select("*")
            .eq("resource_id", resourceData.id)
            .gte("start_time", startOfDayIso)
            .lt("start_time", endOfDayIso)
            .eq("status", "confirmed"),
          supabase
            .from("blocked_times")
            .select("*")
            .eq("resource_id", resourceData.id)
            .gte("start_time", startOfDayIso)
            .lt("start_time", endOfDayIso),
        ]);

        if (bookingsResult.error) {
          throw {
            details: bookingsResult.error.details,
            message: bookingsResult.error.message,
            query: "bookings" satisfies SupabaseQueryName,
          };
        }

        if (blockedTimesResult.error) {
          throw {
            details: blockedTimesResult.error.details,
            message: blockedTimesResult.error.message,
            query: "blocked_times" satisfies SupabaseQueryName,
          };
        }

        if (isActive) {
          setResource(resourceData);
          setBookings(bookingsResult.data ?? []);
          setBlockedTimes(blockedTimesResult.data ?? []);
        }
      } catch (error) {
        if (isActive) {
          setResource(null);
          setBookings([]);
          setBlockedTimes([]);
          setErrorMessage("Kunne ikke hente bookingdata.");

          if (
            typeof error === "object" &&
            error !== null &&
            "message" in error &&
            "query" in error
          ) {
            const safeError = error as DevelopmentError;

            console.error("Supabase booking read failed", safeError);
            setDevelopmentError(safeError);
          } else {
            console.error("Booking data read failed", error);
          }
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadBookingData();

    return () => {
      isActive = false;
    };
  }, [selectedDate, slug]);

  const unavailableTimes = useMemo(() => {
    return new Set([
      ...bookings.map((booking) => normalizeTime(booking.start_time)),
    ]);
  }, [bookings]);
  const timeSlots = useMemo(() => generateTimeSlots(resource), [resource]);
  const visibleTimeSlots = useMemo(
    () => timeSlots.filter((slot) => !isSlotPassed(selectedDate, slot)),
    [selectedDate, timeSlots],
  );
  const blockedSlotTimes = useMemo(() => {
    return new Set(
      timeSlots
        .filter((slot) =>
          blockedTimes.some((blockedTime) =>
            doesSlotOverlapBlockedTime(selectedDate, slot, blockedTime),
          ),
        )
        .map((slot) => slot.startTime),
    );
  }, [blockedTimes, selectedDate, timeSlots]);

  async function bookTime(slot: TimeSlot) {
    if (!resource || isBooking) {
      return;
    }

    setIsBooking(true);
    setSubmissionError("");
    setConfirmationMessage("");

    const startTimeIso = createSlotDateTimeIso(selectedDate, slot.startTime);
    const endTimeIso = createSlotDateTimeIso(selectedDate, slot.endTime);

    try {
      const supabase = createSupabaseClient();
      const [existingBookingsResult, blockedTimesResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("id")
          .eq("resource_id", resource.id)
          .eq("start_time", startTimeIso)
          .eq("status", "confirmed")
          .limit(1),
        supabase
          .from("blocked_times")
          .select("id")
          .eq("resource_id", resource.id)
          .eq("start_time", startTimeIso)
          .limit(1),
      ]);

      if (existingBookingsResult.error) {
        throw existingBookingsResult.error;
      }

      if (blockedTimesResult.error) {
        throw blockedTimesResult.error;
      }

      if ((existingBookingsResult.data?.length ?? 0) > 0) {
        setSubmissionError("Denne tiden er allerede booket.");
        return;
      }

      if ((blockedTimesResult.data?.length ?? 0) > 0) {
        setSubmissionError("Denne tiden er sperret.");
        return;
      }

      const deviceToken = getOrCreateDeviceToken();
      const { data: createdBooking, error: insertError } = await supabase
        .from("bookings")
        .insert({
          device_token: deviceToken,
          end_time: endTimeIso,
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim(),
          resource_id: resource.id,
          start_time: startTimeIso,
          status: "confirmed",
        })
        .select("*")
        .single();

      if (insertError) {
        throw insertError;
      }

      if (createdBooking) {
        setBookings((currentBookings) => [...currentBookings, createdBooking]);
      }

      setConfirmationMessage(`Du har booket ${slot.label}.`);
      setGuestName("");
      setGuestPhone("");
      setSelectedTime(null);
    } catch (error) {
      console.error("Booking insert failed", error);
      setSubmissionError("Kunne ikke booke tiden. Prøv igjen.");
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <AppShell active="home">
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            aria-label="Tilbake til hjem"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-700 shadow-sm ring-1 ring-slate-200"
            href="/"
          >
            ‹
          </Link>
          <div>
            <p className="text-sm font-semibold text-blue-700">Booking</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {resource?.name ?? "Tennisbane"}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {["Velg dato", "Velg tid", "Bekreft"].map((step, index) => (
            <div
              className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-2 py-3 text-center"
              key={step}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <span className="text-xs font-bold text-slate-700">{step}</span>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-base font-bold text-slate-950">Velg dato</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`h-14 rounded-2xl px-4 text-base font-bold shadow-sm ring-1 ring-slate-200 ${
                selectedDate === formatDate(0)
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-slate-50 text-slate-800"
              }`}
              onClick={() => {
                setSelectedDate(formatDate(0));
                setSelectedTime(null);
                setSubmissionError("");
                setConfirmationMessage("");
              }}
              type="button"
            >
              I dag
            </button>
            <button
              className={`h-14 rounded-2xl px-4 text-base font-bold shadow-sm ring-1 ring-slate-200 ${
                selectedDate === formatDate(1)
                  ? "bg-blue-600 text-white ring-blue-600"
                  : "bg-slate-50 text-slate-800"
              }`}
              onClick={() => {
                setSelectedDate(formatDate(1));
                setSelectedTime(null);
                setSubmissionError("");
                setConfirmationMessage("");
              }}
              type="button"
            >
              I morgen
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-3xl bg-white p-4 text-base text-slate-700 shadow-sm ring-1 ring-slate-200">
            <p>{errorMessage}</p>

            {process.env.NODE_ENV === "development" && developmentError ? (
              <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm text-slate-800">
                <p className="font-semibold">Utviklingsdetaljer</p>
                <p>Spørring: {developmentError.query}</p>
                <p>Melding: {developmentError.message}</p>
                {developmentError.details ? (
                  <p>Detaljer: {developmentError.details}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {confirmationMessage ? (
          <div className="rounded-3xl bg-white p-5 text-base text-slate-700 shadow-sm ring-1 ring-slate-200">
            <p className="font-bold text-slate-950">{confirmationMessage}</p>
            <Link
              className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 text-base font-bold text-white"
              href="/mine"
            >
              Mine bookinger
            </Link>
          </div>
        ) : null}

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Velg tid</h2>
              <p className="text-sm font-medium capitalize text-slate-500">
                {formatDisplayDate(selectedDate)}
              </p>
            </div>
            {isLoading ? (
              <span className="text-sm font-semibold text-blue-700">
                Laster...
              </span>
            ) : null}
          </div>

          {visibleTimeSlots.length === 0 && selectedDate === formatDate(0) ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-base font-medium text-slate-600">
              Ingen flere ledige tider i dag. Velg i morgen.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {visibleTimeSlots.map((slot) => {
              const isBooked = unavailableTimes.has(slot.startTime);
              const isBlocked = blockedSlotTimes.has(slot.startTime);
              const isUnavailable = isBooked || isBlocked;
              const isSelected = selectedTime === slot.label;
              const durationMinutes =
                timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);

              return (
                <div className="contents" key={slot.startTime}>
                  <button
                    className={`flex min-h-20 flex-col items-start justify-between rounded-2xl p-4 text-left shadow-sm ring-1 ${
                      isUnavailable
                        ? "bg-slate-100 text-slate-400 ring-slate-200"
                        : isSelected
                          ? "bg-blue-600 text-white ring-blue-600"
                          : "bg-white text-slate-950 ring-slate-200"
                    }`}
                    disabled={
                      isUnavailable ||
                      isLoading ||
                      Boolean(errorMessage)
                    }
                    onClick={() => {
                      setSelectedTime(isSelected ? null : slot.label);
                      setSubmissionError("");
                      setConfirmationMessage("");
                    }}
                    type="button"
                  >
                    <span className="text-lg font-bold">{slot.label}</span>
                    <span className="text-sm font-semibold">
                      {isBlocked ? "Sperret" : isBooked ? "Opptatt" : "Ledig"}
                    </span>
                  </button>

                  <div
                    aria-hidden={!isSelected}
                    className={`col-span-2 grid transition-all duration-300 ease-out ${
                      isSelected
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {isSelected ? (
                        <form
                          className="mt-1 flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-lg shadow-blue-950/10 ring-1 ring-blue-100"
                          onSubmit={(event) => {
                            event.preventDefault();
                            bookTime(slot);
                          }}
                        >
                          <div>
                            <h3 className="text-xl font-bold text-slate-950">
                              Bekreft booking
                            </h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                              Sjekk detaljene før du reserverer.
                            </p>
                          </div>

                          <div className="grid gap-2 rounded-2xl bg-slate-50 p-4">
                            <DetailRow
                              label="Fasilitet"
                              value={resource?.name ?? "Tennisbane"}
                            />
                            <DetailRow
                              label="Dato"
                              value={formatDisplayDate(selectedDate)}
                            />
                            <DetailRow label="Tidspunkt" value={slot.label} />
                            <DetailRow
                              label="Varighet"
                              value={`${durationMinutes} minutter`}
                            />
                          </div>

                          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
                            Navn
                            <input
                              className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                              name="name"
                              onChange={(event) =>
                                setGuestName(event.target.value)
                              }
                              required
                              type="text"
                              value={guestName}
                            />
                          </label>

                          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
                            Mobilnummer
                            <input
                              className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                              inputMode="tel"
                              name="phone"
                              onChange={(event) =>
                                setGuestPhone(event.target.value)
                              }
                              required
                              type="tel"
                              value={guestPhone}
                            />
                          </label>

                          {submissionError ? (
                            <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
                              {submissionError}
                            </p>
                          ) : null}

                          <button
                            className="h-14 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-60"
                            disabled={isBooking}
                            type="submit"
                          >
                            {isBooking ? "Reserverer..." : "Reserver"}
                          </button>

                          <button
                            className="h-12 rounded-2xl bg-white px-5 text-base font-bold text-slate-700 ring-1 ring-slate-300"
                            onClick={() => {
                              setSelectedTime(null);
                              setSubmissionError("");
                            }}
                            type="button"
                          >
                            Avbryt
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold capitalize text-slate-900">
        {value}
      </span>
    </div>
  );
}
