import { NextResponse } from "next/server";

export const revalidate = 300;

const MET_LOCATIONFORECAST_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const USER_AGENT = "ReistadliaVelBooking/1.0 contact: styret@reistadlia.no";
const DEFAULT_LATITUDE = 59.77497;
const DEFAULT_LONGITUDE = 10.28896;

type MetTimeseries = {
  data: {
    instant: {
      details: {
        air_temperature?: number;
        wind_speed?: number;
      };
    };
    next_1_hours?: {
      details?: {
        precipitation_amount?: number;
      };
      summary?: {
        symbol_code?: string;
      };
    };
  };
  time: string;
};

type MetLocationForecast = {
  properties: {
    timeseries: MetTimeseries[];
  };
};

function getCoordinate(envName: string, fallback: number) {
  const value = process.env[envName];
  const parsedValue = value ? Number(value) : NaN;

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function getForecastForNow(timeseries: MetTimeseries[]) {
  const now = Date.now();
  const upcomingForecast = timeseries.find(
    (forecast) => new Date(forecast.time).getTime() >= now,
  );

  if (upcomingForecast) {
    return upcomingForecast;
  }

  return timeseries.reduce<MetTimeseries | null>((closestForecast, forecast) => {
    if (!closestForecast) {
      return forecast;
    }

    const currentDistance = Math.abs(new Date(forecast.time).getTime() - now);
    const closestDistance = Math.abs(
      new Date(closestForecast.time).getTime() - now,
    );

    return currentDistance < closestDistance ? forecast : closestForecast;
  }, null);
}

function getWeatherSummary(symbolCode: string | null) {
  if (!symbolCode) {
    return "Værdata tilgjengelig";
  }

  if (symbolCode.includes("rain")) {
    return "Regn i området";
  }

  if (symbolCode.includes("snow")) {
    return "Snø i området";
  }

  if (symbolCode.includes("cloud")) {
    return "Skyet";
  }

  if (symbolCode.includes("fair") || symbolCode.includes("clearsky")) {
    return "Fine forhold";
  }

  return "Oppdatert værvarsel";
}

export async function GET() {
  const updatedAt = new Date().toISOString();
  const latitude = getCoordinate("WEATHER_LATITUDE", DEFAULT_LATITUDE);
  const longitude = getCoordinate("WEATHER_LONGITUDE", DEFAULT_LONGITUDE);
  const url = new URL(MET_LOCATIONFORECAST_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`MET weather request failed with status ${response.status}`);
    }

    const data = (await response.json()) as MetLocationForecast;
    const forecast = getForecastForNow(data.properties.timeseries);

    if (!forecast) {
      throw new Error("MET weather response did not include timeseries data.");
    }

    const instantDetails = forecast.data.instant.details;
    const nextHour = forecast.data.next_1_hours;
    const symbolCode = nextHour?.summary?.symbol_code ?? null;

    return NextResponse.json({
      forecastTime: forecast.time,
      precipitation: nextHour?.details?.precipitation_amount ?? null,
      summary: getWeatherSummary(symbolCode),
      symbolCode,
      temperature: instantDetails.air_temperature ?? null,
      updatedAt,
      windSpeed: instantDetails.wind_speed ?? null,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Weather API failed", error);
    }

    return NextResponse.json(
      {
        forecastTime: null,
        precipitation: null,
        summary: "Værdata er midlertidig utilgjengelig",
        symbolCode: null,
        temperature: null,
        updatedAt,
        windSpeed: null,
      },
      { status: 200 },
    );
  }
}
