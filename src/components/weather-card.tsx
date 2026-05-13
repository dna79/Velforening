"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type IconName = "sun" | "wind";

type WeatherData = {
  forecastTime: string | null;
  precipitation: number | null;
  summary: string;
  symbolCode: string | null;
  temperature: number | null;
  updatedAt: string | null;
  windSpeed: number | null;
};

const fallbackWeather: WeatherData = {
  forecastTime: null,
  precipitation: null,
  summary: "Værdata er midlertidig utilgjengelig",
  symbolCode: null,
  temperature: null,
  updatedAt: null,
  windSpeed: null,
};

function formatNumber(value: number | null, suffix: string) {
  if (value === null) {
    return "-";
  }

  return `${Math.round(value * 10) / 10}${suffix}`;
}

function formatClock(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData>(fallbackWeather);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadWeather() {
      try {
        const response = await fetch("/api/weather", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Weather route failed with status ${response.status}`);
        }

        const data = (await response.json()) as WeatherData;

        if (isActive) {
          setWeather(data);
          setIsUnavailable(data.temperature === null && data.windSpeed === null);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Weather card failed", error);
        }

        if (isActive) {
          setWeather(fallbackWeather);
          setIsUnavailable(true);
        }
      }
    }

    loadWeather();
    const intervalId = window.setInterval(loadWeather, 5 * 60 * 1000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const updatedClock = formatClock(weather.updatedAt);
  const forecastClock = formatClock(weather.forecastTime);

  return (
    <section className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconBadge>
            <WeatherIcon name="sun" />
          </IconBadge>
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-950">Vær nå</h2>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
              {isUnavailable
                ? "Værdata er midlertidig utilgjengelig"
                : weather.summary}
            </p>
          </div>
        </div>
        <span className="rounded-2xl bg-blue-50 px-3 py-2 text-lg font-black text-blue-700">
          {formatNumber(weather.temperature, "°C")}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <WeatherIcon name="wind" />
          Vind
        </span>
        <span className="text-sm font-black text-slate-950">
          {formatNumber(weather.windSpeed, " m/s")}
        </span>
      </div>

      <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
        {updatedClock
          ? `Oppdatert kl. ${updatedClock}`
          : "Oppdateres automatisk"}
        {forecastClock ? ` · Varsel for kl. ${forecastClock}` : ""}
      </p>
    </section>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
      {children}
    </div>
  );
}

function WeatherIcon({ name }: { name: IconName }) {
  const icons: Record<IconName, ReactNode> = {
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.9 4.9 1.4 1.4" />
        <path d="m17.7 17.7 1.4 1.4" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m4.9 19.1 1.4-1.4" />
        <path d="m17.7 6.3 1.4-1.4" />
      </>
    ),
    wind: (
      <>
        <path d="M4 9h11a3 3 0 1 0-3-3" />
        <path d="M4 14h14a2 2 0 1 1-2 2" />
        <path d="M4 19h8" />
      </>
    ),
  };

  return (
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
      {icons[name]}
    </svg>
  );
}
