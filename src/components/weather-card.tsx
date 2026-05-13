"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type IconName = "rain" | "wind";

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
    <section className="rounded-[22px] bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.07)] ring-1 ring-blue-100/80">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-400">
          <WeatherIcon name="rain" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold leading-tight text-slate-950">Vær nå</h2>
          <div className="mt-0.5 flex items-end gap-2">
            <span className="text-[26px] font-black leading-none tracking-[-0.04em] text-slate-950">
              {formatNumber(weather.temperature, "°")}
            </span>
            <span className="truncate pb-0.5 text-xs font-medium text-slate-500">
              {isUnavailable
                ? "Værdata er midlertidig utilgjengelig"
                : weather.summary}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-blue-500">
          <span className="hidden text-xs font-medium text-slate-500 min-[350px]:inline">
            Vind {formatNumber(weather.windSpeed, " m/s")}
          </span>
          <WeatherIcon name="wind" />
        </div>
      </div>
      <p className="mt-0.5 text-center text-[9px] font-semibold text-slate-400">
        {updatedClock
          ? `Oppdatert kl. ${updatedClock}`
          : "Oppdateres automatisk"}
        {forecastClock ? ` · Varsel for kl. ${forecastClock}` : ""}
      </p>
    </section>
  );
}

function WeatherIcon({ name }: { name: IconName }) {
  const icons: Record<IconName, ReactNode> = {
    rain: (
      <>
        <path d="M7 17a5 5 0 0 1 .7-9.9A6.5 6.5 0 0 1 20 10.5 4.5 4.5 0 0 1 18 19H8" />
        <path d="M8 22v.01" />
        <path d="M12 21v.01" />
        <path d="M16 22v.01" />
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
      className="h-5 w-5"
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
