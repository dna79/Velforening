"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { HomeLandscapeFooter } from "@/components/HomeLandscapeFooter";
import {
  MessageBox,
  inputClassName,
  primaryButtonClassName,
} from "@/components/ui";
import { getOrCreateDeviceToken } from "@/lib/device-token";
import { createSupabaseClient } from "@/lib/supabase";
import type { Resource } from "@/lib/types";

type CalendarDay = {
  date: string;
  day: number;
  isCurrentMonth: boolean;
};

type VelhusetBookingType = {
  end_time: string;
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  start_time: string;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function createLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function formatDateFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toDateKey(date: Date | string): string {
  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) {
      throw new Error("Ugyldig valgt dato");
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Ugyldig valgt dato: ${date}`);
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTime(time: string): string {
  const match = time.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    throw new Error(`Ugyldig tidspunkt: ${time}`);
  }

  return `${match[1]}:${match[2]}:00`;
}

function createDateTimeIso(date: Date | string, time: string): string {
  const dateKey = toDateKey(date);
  const normalizedTime = normalizeTime(time);

  const localDate = new Date(`${dateKey}T${normalizedTime}`);

  if (Number.isNaN(localDate.getTime())) {
    throw new Error(`Ugyldig dato/tid: ${dateKey}T${normalizedTime}`);
  }

  return localDate.toISOString();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "long",
    weekday: "long",
  }).format(createLocalDate(value));
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

function isDateAllowed(date: string) {
  return createLocalDate(date) >= createLocalDate(getTodayDate());
}

function isOverlapConstraintError(error: { code?: string; message?: string }) {
  return (
    error.code === "23P01" ||
    error.message?.toLowerCase().includes("overlap") ||
    error.message?.toLowerCase().includes("conflict")
  );
}

function logSupabaseError(label: string, error: unknown) {
  console.warn(label, error);

  if (error && typeof error === "object") {
    const err = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    console.warn(`${label} details`, {
      message: err.message ?? null,
      details: err.details ?? null,
      hint: err.hint ?? null,
      code: err.code ?? null,
      raw: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    });
  } else {
    console.warn(`${label} non-object error`, String(error));
  }
}

function formatSupabaseErrorForUi(
  label: string,
  error: {
    code?: string | null;
    details?: string | null;
    hint?: string | null;
    message?: string | null;
  },
) {
  return [
    label,
    `message: ${error.message ?? "(tom)"}`,
    `details: ${error.details ?? "(tom)"}`,
    `hint: ${error.hint ?? "(tom)"}`,
    `code: ${error.code ?? "(tom)"}`,
  ].join("\n");
}

export default function VelhusetPage() {
  const [resource, setResource] = useState<Resource | null>(null);
  const [bookingTypes, setBookingTypes] = useState<VelhusetBookingType[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [calendarMonth, setCalendarMonth] = useState(() =>
    createLocalDate(getTodayDate()),
  );
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadVelhuset() {
      setIsLoading(true);
      setErrorMessage("");

      const supabase = createSupabaseClient();
      const { data: resourceData, error: resourceError } = await supabase
        .from("resources")
        .select("*")
        .eq("slug", "velhuset")
        .single();

      if (!isActive) {
        return;
      }

      if (resourceError || !resourceData) {
        if (resourceError) {
          logSupabaseError("Kunne ikke hente Velhuset", resourceError);
        } else {
          console.warn("Kunne ikke hente Velhuset", {
            message: "Ingen resource med slug velhuset",
          });
        }
        setErrorMessage("Kunne ikke hente Velhuset.");
        setIsLoading(false);
        return;
      }

      const resourceId = resourceData.id;

      const { data: bookingTypes, error: bookingTypesError } = await supabase
        .from("booking_types")
        .select("id, name, slug, start_time, end_time, sort_order")
        .eq("resource_id", resourceId)
        .order("sort_order", { ascending: true });

      if (!isActive) {
        return;
      }

      if (bookingTypesError) {
        logSupabaseError("Kunne ikke hente bookingtyper", bookingTypesError);
        setErrorMessage(
          formatSupabaseErrorForUi(
            "Kunne ikke hente bookingtyper.",
            bookingTypesError,
          ),
        );
        setIsLoading(false);
        return;
      }

      setResource(resourceData);
      setBookingTypes(bookingTypes ?? []);
      setSelectedTypeId((bookingTypes ?? [])[0]?.id ?? "");
      setIsLoading(false);
    }

    loadVelhuset();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedType = useMemo(
    () => bookingTypes.find((bookingType) => bookingType.id === selectedTypeId) ?? null,
    [bookingTypes, selectedTypeId],
  );

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resource || !selectedType || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    let startTimeIso: string;
    let endTimeIso: string;

    try {
      startTimeIso = createDateTimeIso(selectedDate, selectedType.start_time);
      endTimeIso = createDateTimeIso(selectedDate, selectedType.end_time);
    } catch (error) {
      console.warn("Kunne ikke beregne dato/tid for Velhuset", error);
      setErrorMessage("Kunne ikke lese valgt dato eller tidspunkt.");
      setIsSubmitting(false);
      return;
    }

    if (new Date(endTimeIso).getTime() <= new Date(startTimeIso).getTime()) {
      setErrorMessage("Sluttidspunkt må være etter starttidspunkt.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createSupabaseClient();

    const { data: overlappingBookings, error: overlapError } = await supabase
      .from("bookings")
      .select("id")
      .eq("resource_id", resource.id)
      .in("status", ["requested", "approved", "confirmed"])
      .lt("start_time", endTimeIso)
      .gt("end_time", startTimeIso)
      .limit(1);

    if (overlapError) {
      console.error("Kunne ikke sjekke overlapp", overlapError);
      setErrorMessage("Kunne ikke sjekke om tidspunktet er ledig.");
      setIsSubmitting(false);
      return;
    }

    if ((overlappingBookings?.length ?? 0) > 0) {
      setErrorMessage("Tidspunktet er opptatt. Velg en annen dato eller type.");
      setIsSubmitting(false);
      return;
    }

    const deviceToken = getOrCreateDeviceToken();
    const { error } = await supabase.from("bookings").insert({
      booking_type_id: selectedType.id,
      device_token: deviceToken,
      end_time: endTimeIso,
      guest_email: guestEmail.trim(),
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim(),
      purpose: purpose.trim(),
      resource_id: resource.id,
      start_time: startTimeIso,
      status: "requested",
    });

    if (error) {
      console.error("Kunne ikke sende leieforespørsel", error);
      setErrorMessage(
        isOverlapConstraintError(error)
          ? "Tidspunktet er opptatt. Velg en annen dato eller type."
          : "Kunne ikke sende leieforespørselen.",
      );
    } else {
      setMessage("Forespørselen er sendt");
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setPurpose("");
    }

    setIsSubmitting(false);
  }

  return (
    <AppShell active="home" headerBackHref="/">
      <section className="flex flex-col gap-4">
        <header>
          <p className="text-sm font-black uppercase tracking-[0.12em] text-blue-700">Utleie</p>
          <h1 className="mt-1 text-[32px] font-black tracking-[-0.04em] text-[#07122F]">
            Velhuset
          </h1>
          <p className="mt-2 text-base font-semibold text-[#53657D]">
            Send forespørsel om leie. Styret godkjenner før bookingen er endelig.
          </p>
        </header>

        {message ? (
          <MessageBox tone="success">{message}</MessageBox>
        ) : null}

        {errorMessage ? (
          <MessageBox tone="error">
            <span className="whitespace-pre-wrap">{errorMessage}</span>
          </MessageBox>
        ) : null}

        <form
          className="flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]"
          onSubmit={submitRequest}
        >
          <CalendarCard
            calendarMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setMessage("");
              setErrorMessage("");
            }}
            selectedDate={selectedDate}
          />

          <div>
            <p className="mb-2 text-sm font-bold text-slate-800">
              Velg bookingtype
            </p>
            <div className="grid gap-2">
              {!isLoading && bookingTypes.length === 0 ? (
                <p className="rounded-[18px] bg-slate-50 p-4 text-sm font-bold text-[#53657D]">
                  Ingen bookingtyper er konfigurert for Velhuset.
                </p>
              ) : null}

              {bookingTypes.map((bookingType) => {
                const isSelected = selectedTypeId === bookingType.id;

                return (
                  <button
                    className={`flex min-h-14 items-center justify-between rounded-[18px] px-4 text-left text-sm font-bold ring-1 ${
                      isSelected
                        ? "bg-blue-600 text-white ring-blue-600"
                        : "bg-white text-slate-800 ring-[#DDE8F5]"
                    }`}
                    disabled={isLoading}
                    key={bookingType.id}
                    onClick={() => setSelectedTypeId(bookingType.id)}
                    type="button"
                  >
                    <span>{bookingType.name}</span>
                    <span className={isSelected ? "text-blue-100" : "text-slate-500"}>
                      {bookingType.start_time.slice(0, 5)}-
                      {bookingType.end_time.slice(0, 5)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[18px] bg-blue-50 p-3 text-sm font-bold text-blue-800">
            {selectedType
              ? `${formatDate(selectedDate)} kl. ${selectedType.start_time.slice(0, 5)}-${selectedType.end_time.slice(0, 5)}`
              : "Velg bookingtype"}
          </div>

          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            Navn
            <input
              className={`h-14 ${inputClassName}`}
              onChange={(event) => setGuestName(event.target.value)}
              required
              type="text"
              value={guestName}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            Telefon
            <input
              className={`h-14 ${inputClassName}`}
              inputMode="tel"
              onChange={(event) => setGuestPhone(event.target.value)}
              required
              type="tel"
              value={guestPhone}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            E-post
            <input
              className={`h-14 ${inputClassName}`}
              onChange={(event) => setGuestEmail(event.target.value)}
              required
              type="email"
              value={guestEmail}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-slate-800">
            Formål
            <textarea
              className={`min-h-28 py-3 ${inputClassName}`}
              onChange={(event) => setPurpose(event.target.value)}
              required
              value={purpose}
            />
          </label>

          <button
            className={`h-14 text-base ${primaryButtonClassName}`}
            disabled={isLoading || isSubmitting || !resource || !selectedType}
            type="submit"
          >
            {isSubmitting ? "Sender..." : "Send leieforespørsel"}
          </button>
        </form>
        <HomeLandscapeFooter />
      </section>
    </AppShell>
  );
}

function CalendarCard({
  calendarMonth,
  onMonthChange,
  onSelectDate,
  selectedDate,
}: {
  calendarMonth: Date;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}) {
  const calendarDays = getCalendarDays(calendarMonth);
  const weekdays = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

  return (
    <section className="rounded-[24px] bg-white p-3 ring-1 ring-[#DDE8F5]">
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

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {weekdays.map((weekday) => (
          <div className="text-[11px] font-bold text-slate-400" key={weekday}>
            {weekday}
          </div>
        ))}

        {calendarDays.map((day) => {
          const isSelected = selectedDate === day.date;
          const isAllowed = day.isCurrentMonth && isDateAllowed(day.date);

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
    </section>
  );
}
