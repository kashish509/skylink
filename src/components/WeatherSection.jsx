import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Droplets, RefreshCw, Sunrise, Sunset, Thermometer, Wind, Sun as UvIcon, WifiOff, Lightbulb } from 'lucide-react';
import { airports } from '../data/airports';
import { useReveal } from '../lib/useReveal';
import { describe, fetchWeather, formatTemp, formatWind, travelTip } from '../lib/weather';

// Featured cities match the Destinations section; coordinates are city centres.
const featured = [
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'London', country: 'United Kingdom', lat: 51.5072, lon: -0.1276 },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.006 },
];

// Every other city we fly to, de-duplicated from the airport list.
const moreCities = (() => {
  const seen = new Set(featured.map((f) => f.name));
  const out = [];
  airports.forEach((a) => {
    if (a.lat === undefined || seen.has(a.city)) return;
    seen.add(a.city);
    out.push({ name: a.city, country: a.country, lat: a.lat, lon: a.lon });
  });
  return out.sort((a, b) => a.name.localeCompare(b.name));
})();

const fmtDay = (iso, i) => (i === 0 ? 'Today' : new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short' }));
const fmtClock = (iso) => (iso ? iso.slice(11, 16) : '–');

export default function WeatherSection() {
  const [headerRef, headerVisible] = useReveal({ amount: 0.2 });
  const [gridRef, gridVisible] = useReveal({ amount: 0.1 });
  const [city, setCity] = useState(featured[0]);
  const [unit, setUnit] = useState('C');
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ status: 'loading', data: s.data, error: '' }));
    fetchWeather(city, ctrl.signal)
      .then((data) => setState({ status: 'ready', data, error: '' }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ status: 'error', data: null, error: navigator.onLine === false ? 'You appear to be offline.' : 'We couldn\'t reach the weather service.' });
      });
    return () => ctrl.abort();
  }, [city, attempt]);

  const { status, data } = state;
  const now = data ? describe(data.current.code, data.current.isDay) : null;
  const week = useMemo(() => {
    if (!data) return null;
    return { lo: Math.min(...data.daily.map((d) => d.min)), hi: Math.max(...data.daily.map((d) => d.max)) };
  }, [data]);

  return (
    <section className={`weather weather--${now ? now.mood : 'clear'}`} id="weather" aria-labelledby="weather-title">
      <div className="weather__glow" aria-hidden="true" />

      <div ref={headerRef} className={`weather__header reveal ${headerVisible ? 'reveal--visible' : ''}`}>
        <div>
          <span className="label-eyebrow">03 / Weather</span>
          <h2 className="weather__title" id="weather-title">
            Know before<br /><em>you go.</em>
          </h2>
        </div>
        <p className="weather__subtitle">Live conditions and a 7-day outlook for the cities we fly to, so you can pack with confidence.</p>
      </div>

      <div ref={gridRef} className={`reveal ${gridVisible ? 'reveal--visible' : ''}`}>
        <div className="weather__toolbar">
          <div className="weather__chips" role="group" aria-label="Choose a city">
            {featured.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`weather-chip ${city.name === c.name ? 'weather-chip--active' : ''}`}
                aria-pressed={city.name === c.name}
                onClick={() => setCity(c)}
              >
                {c.name}
              </button>
            ))}
            <label className="weather-select">
              <span className="sr-only">More cities</span>
              <select
                value={featured.some((f) => f.name === city.name) ? '' : city.name}
                onChange={(e) => { const c = moreCities.find((m) => m.name === e.target.value); if (c) setCity(c); }}
              >
                <option value="">More cities…</option>
                {moreCities.map((c) => (<option key={c.name} value={c.name}>{c.name}, {c.country}</option>))}
              </select>
            </label>
          </div>
          <div className="weather-unit" role="group" aria-label="Temperature unit">
            {['C', 'F'].map((u) => (
              <button key={u} type="button" className={unit === u ? 'weather-unit__btn weather-unit__btn--active' : 'weather-unit__btn'} aria-pressed={unit === u} onClick={() => setUnit(u)}>°{u}</button>
            ))}
          </div>
        </div>

        {status === 'error' && (
          <div className="glass weather-card weather-error" role="alert">
            <WifiOff size={26} className="icon-ice" />
            <div>
              <b>Weather unavailable</b>
              <p>{state.error} Please check your connection and try again.</p>
            </div>
            <button type="button" className="btn-outline" onClick={load}><RefreshCw size={14} /> Retry</button>
          </div>
        )}

        {status === 'loading' && !data && <WeatherSkeleton />}

        {data && status !== 'error' && (
          <div className={`weather__grid ${status === 'loading' ? 'weather__grid--refreshing' : ''}`} aria-busy={status === 'loading'}>
            <article className="glass weather-card weather-now" aria-live="polite">
              <div className="weather-now__top">
                <div>
                  <span className="label-eyebrow">Right now</span>
                  <h3 className="weather-now__city">{city.name}<small>{city.country}</small></h3>
                </div>
                <now.icon size={56} strokeWidth={1.4} className="weather-now__icon" aria-hidden="true" />
              </div>
              <div className="weather-now__temp">
                {formatTemp(data.current.temp, unit)}
                <span>{now.label}</span>
              </div>
              <dl className="weather-stats">
                <div><Thermometer size={14} /><dt>Feels like</dt><dd>{formatTemp(data.current.feels, unit)}</dd></div>
                <div><Droplets size={14} /><dt>Humidity</dt><dd>{data.current.humidity}%</dd></div>
                <div><Wind size={14} /><dt>Wind</dt><dd>{formatWind(data.current.wind, unit)}</dd></div>
                <div><UvIcon size={14} /><dt>UV index</dt><dd>{data.current.uv !== null ? Math.round(data.current.uv) : '–'}</dd></div>
                <div><Sunrise size={14} /><dt>Sunrise</dt><dd>{fmtClock(data.daily[0].sunrise)}</dd></div>
                <div><Sunset size={14} /><dt>Sunset</dt><dd>{fmtClock(data.daily[0].sunset)}</dd></div>
              </dl>
              <p className="weather-tip"><Lightbulb size={15} /> {travelTip(data)}</p>
            </article>

            <article className="glass weather-card weather-week">
              <span className="label-eyebrow">7-day outlook</span>
              <ul className="weather-week__list">
                {data.daily.map((d, i) => {
                  const info = describe(d.code);
                  const span = Math.max(week.hi - week.lo, 1);
                  const left = ((d.min - week.lo) / span) * 100;
                  const width = Math.max(((d.max - d.min) / span) * 100, 8);
                  return (
                    <li key={d.date} className="weather-day">
                      <span className="weather-day__name">{fmtDay(d.date, i)}</span>
                      <info.icon size={20} strokeWidth={1.6} className="weather-day__icon" aria-label={info.label} />
                      <span className="weather-day__rain" title="Chance of precipitation"><Droplets size={11} />{d.rainChance ?? 0}%</span>
                      <span className="weather-day__lo">{formatTemp(d.min, unit)}</span>
                      <span className="weather-day__bar" aria-hidden="true"><i style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }} /></span>
                      <span className="weather-day__hi">{formatTemp(d.max, unit)}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          </div>
        )}

        <p className="weather__credit">Forecast data by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>. Conditions are indicative; always check official sources before travel.</p>
      </div>
    </section>
  );
}

function WeatherSkeleton() {
  return (
    <div className="weather__grid" aria-busy="true" aria-label="Loading weather">
      <div className="glass weather-card skeleton-card">
        <i className="skeleton skeleton--sm" />
        <i className="skeleton skeleton--lg" />
        <i className="skeleton skeleton--xl" />
        <div className="skeleton-row"><i className="skeleton" /><i className="skeleton" /><i className="skeleton" /></div>
      </div>
      <div className="glass weather-card skeleton-card">
        <i className="skeleton skeleton--sm" />
        {Array.from({ length: 7 }).map((_, i) => (<i key={i} className="skeleton skeleton--row" />))}
      </div>
    </div>
  );
}
