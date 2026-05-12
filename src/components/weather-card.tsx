"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type IconName = "drop" | "sun" | "thermometer" | "wind";

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

  const weatherItems: Array<{ icon: IconName; label: string; value: string }> = [
    {
      icon: "thermometer",
      label: "Temp",
      value: formatNumber(weather.temperature, "°C"),
    },
    {
      icon: "wind",
      label: "Vind",
      value: formatNumber(weather.windSpeed, " m/s"),
    },
    {
      icon: "drop",
      label: "Nedbør",
      value: formatNumber(weather.precipitation, " mm"),
    },
  ];
  const updatedClock = formatClock(weather.updatedAt);
  const forecastClock = formatClock(weather.forecastTime);

  return (
    <section className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <IconBadge>
            <WeatherIcon name="sun" />
          </IconBadge>
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Vær ved tennisbanen
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {isUnavailable ? "Værdata er midlertidig utilgjengelig" : weather.summary}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
          {formatNumber(weather.temperature, "°C")}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
        {weatherItems.map((item) => (
          <div className="rounded-2xl bg-slate-50 px-2 py-2" key={item.label}>
            <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
              <WeatherIcon name={item.icon} />
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
              {item.label}
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">
        {updatedClock ? `Oppdatert kl. ${updatedClock}` : "Oppdateres automatisk"}
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
    drop: (
      <path d="M12 21a6 6 0 0 0 6-6c0-4-6-11-6-11S6 11 6 15a6 6 0 0 0 6 6Z" />
    ),
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
    thermometer: (
      <>
        <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
        <path d="M12 9v7" />
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
