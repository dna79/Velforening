"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { HomeLandscapeFooter } from "@/components/HomeLandscapeFooter";
import {
  Card,
  MessageBox,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui";
import { getOrCreateDeviceToken } from "@/lib/device-token";
import { createSupabaseClient } from "@/lib/supabase";
import type { Booking, BlockedTime, Resource } from "@/lib/types";

const fallbackTimeSlots = [
  { endTime: "09:00", label: "08:00-09:00", startTime: "08:00" },
  { endTime: "10:00", label: "09:00-10:00", startTime: "09:00" },
  { endTime: "11:00", label: "10:00-11:00", startTime: "10:00" },
  { endTime: "12:00", label: "11:00-12:00", startTime: "11:00" },
];

type TimeSlot = {
  endTime: string;
  label: string;
  startTime: string;
};

type CalendarDay = {
  date: string;
  day: number;
  isCurrentMonth: boolean;
};

function formatDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

function formatDateFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "long",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function formatCalendarMonth(date: Date) {
  return new Intl.DateTimeFormat("nb-NO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12);
  const firstGridDay = new Date(firstDay);
  const mondayBasedDay = (firstDay.getDay() + 6) % 7;
  firstGridDay.setDate(firstDay.getDate() - mondayBasedDay);

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);

    return {
      date: formatDateFromDate(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function shiftMonth(date: Date, direction: -1 | 1) {
  return new Date(date.getFullYear(), date.getMonth() + direction, 1, 12);
}

function getMaxDaysAhead(resource: Resource | null) {
  if (resource && "max_days_ahead" in resource) {
    const value = (resource as Resource & { max_days_ahead?: unknown }).max_days_ahead;

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return 30;
}

function isDateAllowed(date: string, maxDaysAhead: number) {
  const today = createLocalDate(formatDate(0));
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxDaysAhead);
  const targetDate = createLocalDate(date);

  return targetDate >= today && targetDate <= maxDate;
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
      label: `${startTime}-${endTime}`,
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
  const [calendarMonth, setCalendarMonth] = useState(() =>
    createLocalDate(formatDate(0)),
  );
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
  const selectedSlot = useMemo(
    () => visibleTimeSlots.find((slot) => slot.label === selectedTime) ?? null,
    [selectedTime, visibleTimeSlots],
  );
  const maxDaysAhead = useMemo(() => getMaxDaysAhead(resource), [resource]);
  const timeSlotRows = useMemo(() => {
    const rows: TimeSlot[][] = [];

    for (let index = 0; index < visibleTimeSlots.length; index += 2) {
      rows.push(visibleTimeSlots.slice(index, index + 2));
    }

    return rows;
  }, [visibleTimeSlots]);

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
    <AppShell active="home" headerBackHref="/">
      <section className="flex flex-col gap-4">
        <header>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-blue-700">
            Booking
          </p>
          <h1 className="mt-1 text-[32px] font-black tracking-[-0.04em] text-[#07122F]">
            {resource?.name ?? "Tennisbane"}
          </h1>
        </header>

        <StepIndicator hasSelectedTime={Boolean(selectedSlot)} />

        <CalendarCard
          calendarMonth={calendarMonth}
          maxDaysAhead={maxDaysAhead}
          onMonthChange={setCalendarMonth}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setSelectedTime(null);
            setSubmissionError("");
            setConfirmationMessage("");
          }}
          selectedDate={selectedDate}
        />

        {errorMessage ? (
          <Card className="p-4 text-base text-[#53657D]">
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
          </Card>
        ) : null}

        {confirmationMessage ? (
          <Card className="p-4 text-base text-[#53657D]">
            <p className="font-bold text-slate-950">{confirmationMessage}</p>
            <Link
              className={`mt-4 flex h-12 items-center justify-center text-base ${primaryButtonClassName}`}
              href="/mine"
            >
              Mine bookinger
            </Link>
          </Card>
        ) : null}

        <Card className="p-4">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-950">
                Velg tilgjengelig tid
              </h2>
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
            <p className="rounded-[18px] bg-slate-50 p-4 text-sm font-semibold text-[#53657D]">
              Ingen flere ledige tider i dag. Velg i morgen.
            </p>
          ) : null}

          <div className="grid gap-2">
            {timeSlotRows.map((row) => {
              const rowSelectedSlot =
                row.find((slot) => selectedTime === slot.label) ?? null;

              return (
                <div className="grid gap-2" key={row[0]?.startTime}>
                  <div className="grid grid-cols-2 gap-2">
                    {row.map((slot) => {
                      const isBooked = unavailableTimes.has(slot.startTime);
                      const isBlocked = blockedSlotTimes.has(slot.startTime);
                      const isUnavailable = isBooked || isBlocked;
                      const isSelected = selectedTime === slot.label;

                      return (
                        <button
                          className={`flex min-h-[72px] flex-col justify-between rounded-[18px] p-3 text-left shadow-sm ring-1 transition-colors ${
                            isUnavailable
                              ? "bg-slate-100 text-slate-400 ring-slate-200"
                              : isSelected
                                ? "bg-blue-600 text-white ring-blue-600"
                                : "bg-white text-slate-950 ring-slate-200"
                          }`}
                          disabled={
                            isUnavailable || isLoading || Boolean(errorMessage)
                          }
                          key={slot.startTime}
                          onClick={() => {
                            setSelectedTime(isSelected ? null : slot.label);
                            setSubmissionError("");
                            setConfirmationMessage("");
                          }}
                          type="button"
                        >
                          <span className="text-base font-bold">{slot.label}</span>
                          <span
                            className={`text-xs font-bold ${
                              isUnavailable
                                ? "text-slate-400"
                                : isSelected
                                  ? "text-blue-100"
                                  : "text-emerald-600"
                            }`}
                          >
                            {isBlocked
                              ? "Sperret"
                              : isBooked
                                ? "Opptatt"
                                : "Ledig"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    aria-hidden={!rowSelectedSlot}
                    className={`grid transition-all duration-300 ease-out ${
                      rowSelectedSlot
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {rowSelectedSlot ? (
                        <BookingConfirmation
                          durationMinutes={
                            timeToMinutes(rowSelectedSlot.endTime) -
                            timeToMinutes(rowSelectedSlot.startTime)
                          }
                          guestName={guestName}
                          guestPhone={guestPhone}
                          isBooking={isBooking}
                          onCancel={() => {
                            setSelectedTime(null);
                            setSubmissionError("");
                          }}
                          onGuestNameChange={setGuestName}
                          onGuestPhoneChange={setGuestPhone}
                          onSubmit={() => bookTime(rowSelectedSlot)}
                          resourceName={resource?.name ?? "Tennisbane"}
                          selectedDate={selectedDate}
                          slotLabel={rowSelectedSlot.label}
                          submissionError={submissionError}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <HomeLandscapeFooter />
      </section>
    </AppShell>
  );
}

function StepIndicator({ hasSelectedTime }: { hasSelectedTime: boolean }) {
  const activeStep = hasSelectedTime ? 3 : 2;
  const steps = ["1. Velg dato", "2. Velg tid", "3. Bekreft"];

  return (
    <div className="h-11 rounded-[22px] bg-white px-2 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]">
      <div className="grid h-full grid-cols-3 gap-1">
        {steps.map((step, index) => {
          const number = index + 1;
          const isActive = number === activeStep;

          return (
            <div
              className="relative flex items-center justify-center px-1 text-center"
              key={step}
            >
              <span
                className={`text-[11px] font-bold leading-tight ${
                  isActive ? "text-blue-700" : "text-slate-500"
                }`}
              >
                {step}
              </span>
              <span
                className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${
                  isActive ? "bg-blue-600" : "bg-transparent"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarCard({
  calendarMonth,
  maxDaysAhead,
  onMonthChange,
  onSelectDate,
  selectedDate,
}: {
  calendarMonth: Date;
  maxDaysAhead: number;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}) {
  const calendarDays = getCalendarDays(calendarMonth);
  const weekdays = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          aria-label="Forrige måned"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700"
          onClick={() => onMonthChange(shiftMonth(calendarMonth, -1))}
          type="button"
        >
          ‹
        </button>
        <h2 className="text-base font-bold capitalize text-slate-950">
          {formatCalendarMonth(calendarMonth)}
        </h2>
        <button
          aria-label="Neste måned"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700"
          onClick={() => onMonthChange(shiftMonth(calendarMonth, 1))}
          type="button"
        >
          ›
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-7 gap-1 text-center">
        {weekdays.map((weekday) => (
          <div className="text-[11px] font-bold text-slate-400" key={weekday}>
            {weekday}
          </div>
        ))}

        {calendarDays.map((day) => {
          const isSelected = selectedDate === day.date;
          const isAllowed = day.isCurrentMonth && isDateAllowed(day.date, maxDaysAhead);

          return (
            <button
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : isAllowed
                    ? "text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    : "text-slate-300"
              }`}
              disabled={!isAllowed}
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              type="button"
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function BookingConfirmation({
  durationMinutes,
  guestName,
  guestPhone,
  isBooking,
  onCancel,
  onGuestNameChange,
  onGuestPhoneChange,
  onSubmit,
  resourceName,
  selectedDate,
  slotLabel,
  submissionError,
}: {
  durationMinutes: number;
  guestName: string;
  guestPhone: string;
  isBooking: boolean;
  onCancel: () => void;
  onGuestNameChange: (value: string) => void;
  onGuestPhoneChange: (value: string) => void;
  onSubmit: () => void;
  resourceName: string;
  selectedDate: string;
  slotLabel: string;
  submissionError: string;
}) {
  return (
    <form
      className="flex flex-col gap-4 rounded-[28px] bg-white p-4 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <h2 className="text-xl font-bold text-slate-950">Bekreft booking</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Sjekk detaljene før du reserverer.
        </p>
      </div>

      <div className="grid gap-2 rounded-2xl bg-slate-50 p-3">
        <DetailRow icon="court" label="Fasilitet" value={resourceName} />
        <DetailRow icon="date" label="Dato" value={formatDisplayDate(selectedDate)} />
        <DetailRow icon="time" label="Tidspunkt" value={slotLabel} />
        <DetailRow icon="duration" label="Varighet" value={`${durationMinutes} minutter`} />
      </div>

      <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
        Navn
        <input
          className={`h-14 ${inputClassName}`}
          name="name"
          onChange={(event) => onGuestNameChange(event.target.value)}
          required
          type="text"
          value={guestName}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
        Mobilnummer
        <input
          className={`h-14 ${inputClassName}`}
          inputMode="tel"
          name="phone"
          onChange={(event) => onGuestPhoneChange(event.target.value)}
          required
          type="tel"
          value={guestPhone}
        />
      </label>

      {submissionError ? (
        <MessageBox tone="error">
          {submissionError}
        </MessageBox>
      ) : null}

      <button
        className={`h-14 text-base ${primaryButtonClassName}`}
        disabled={isBooking}
        type="submit"
      >
        {isBooking ? "Reserverer..." : "Reserver"}
      </button>

      <button
        className={`h-12 text-base ${secondaryButtonClassName}`}
        onClick={onCancel}
        type="button"
      >
        Avbryt
      </button>
    </form>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: "court" | "date" | "time" | "duration";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <DetailIcon name={icon} />
        <span className="text-sm font-semibold text-slate-500">{label}</span>
      </div>
      <span className="text-right text-sm font-bold capitalize text-slate-900">
        {value}
      </span>
    </div>
  );
}

function DetailIcon({ name }: { name: "court" | "date" | "time" | "duration" }) {
  const paths = {
    court: (
      <>
        <rect height="14" rx="2" width="16" x="4" y="5" />
        <path d="M12 5v14" />
        <path d="M4 12h16" />
      </>
    ),
    date: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M3 10h18" />
      </>
    ),
    time: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </>
    ),
    duration: (
      <>
        <path d="M12 6v6l4 2" />
        <path d="M5 3 3 5" />
        <path d="m19 3 2 2" />
        <circle cx="12" cy="13" r="8" />
      </>
    ),
  };

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
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
        {paths[name]}
      </svg>
    </span>
  );
}
