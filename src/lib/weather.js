// Weather helpers. Data comes from Open-Meteo (free, no API key, CORS-enabled).
// https://open-meteo.com/ — requests are made straight from the browser.
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Moon, CloudMoon,
} from 'lucide-react';

const API = 'https://api.open-meteo.com/v1/forecast';
const TTL = 10 * 60 * 1000; // re-use a city's forecast for 10 minutes
const cache = new Map();

// WMO weather interpretation codes -> label, icon and a visual "mood" used for tinting.
export function describe(code, isDay = true) {
  if (code === 0) return { label: 'Clear sky', icon: isDay ? Sun : Moon, mood: 'clear' };
  if (code === 1) return { label: 'Mostly clear', icon: isDay ? CloudSun : CloudMoon, mood: 'clear' };
  if (code === 2) return { label: 'Partly cloudy', icon: isDay ? CloudSun : CloudMoon, mood: 'cloud' };
  if (code === 3) return { label: 'Overcast', icon: Cloud, mood: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: CloudFog, mood: 'cloud' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: CloudDrizzle, mood: 'rain' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Rain', icon: CloudRain, mood: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: 'Snow', icon: CloudSnow, mood: 'snow' };
  if (code >= 95) return { label: 'Thunderstorm', icon: CloudLightning, mood: 'storm' };
  return { label: 'Unsettled', icon: Cloud, mood: 'cloud' };
}

export const toF = (c) => (c * 9) / 5 + 32;

export function formatTemp(c, unit) {
  if (c === null || c === undefined || Number.isNaN(c)) return '–';
  return `${Math.round(unit === 'F' ? toF(c) : c)}°`;
}

export function formatWind(kmh, unit) {
  if (kmh === null || kmh === undefined) return '–';
  return unit === 'F' ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`;
}

// Short, practical packing advice from the current conditions and the week ahead.
export function travelTip(w) {
  const { current: c, daily: d } = w;
  const rainDays = d.filter((x) => (x.rainChance ?? 0) >= 50 || x.mood === 'rain' || x.mood === 'storm').length;
  const max = Math.max(...d.map((x) => x.max));
  const min = Math.min(...d.map((x) => x.min));
  if (d.some((x) => x.mood === 'storm')) return 'Thunderstorms are possible this week. Check your flight status before heading to the airport.';
  if (d.some((x) => x.mood === 'snow') || min <= 0) return 'Freezing temperatures ahead. Pack a warm coat, gloves and waterproof shoes.';
  if (rainDays >= 3) return 'Plenty of rain expected. A light waterproof jacket and compact umbrella will pay off.';
  if (rainDays >= 1) return 'A shower or two is likely. Keep a compact umbrella in your day bag.';
  if (max >= 32) return 'It\'s hot out there. Pack breathable fabrics, sunscreen and a reusable water bottle.';
  if (c.uv >= 7) return 'Strong UV today. Sunglasses and sunscreen are a must.';
  const avgRange = d.reduce((sum, x) => sum + (x.max - x.min), 0) / d.length;
  if (avgRange >= 12) return 'Big swings between day and night. Layers are your friend.';
  if (max <= 12) return 'Cool and crisp. A warm jacket will keep you comfortable.';
  return 'Comfortable conditions. Pack light and enjoy the trip.';
}

function normalise(json) {
  const c = json.current;
  const d = json.daily;
  return {
    timezone: json.timezone,
    current: {
      temp: c.temperature_2m,
      feels: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      code: c.weather_code,
      isDay: c.is_day === 1,
      uv: d.uv_index_max?.[0] ?? null,
      time: c.time,
    },
    daily: d.time.map((date, i) => ({
      date,
      code: d.weather_code[i],
      max: d.temperature_2m_max[i],
      min: d.temperature_2m_min[i],
      rainChance: d.precipitation_probability_max?.[i] ?? null,
      sunrise: d.sunrise?.[i],
      sunset: d.sunset?.[i],
      mood: describe(d.weather_code[i]).mood,
    })),
  };
}

export async function fetchWeather({ lat, lon }, signal) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
  });
  const res = await fetch(`${API}?${params}`, { signal });
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  const json = await res.json();
  if (!json.current || !json.daily) throw new Error('Unexpected weather response');
  const data = normalise(json);
  cache.set(key, { at: Date.now(), data });
  return data;
}
