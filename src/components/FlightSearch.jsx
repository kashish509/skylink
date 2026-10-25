import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, CalendarDays, Minus, Plus, Search, Users2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import FlightResults from './FlightResults';
import BookingModal from './BookingModal';
import CityAutocomplete from './CityAutocomplete';
import { resolveCode, airportByCode } from '../data/airports';
import { useLang, tr } from '../i18n';
import { addDays, toDateInput, uid, formatINR } from '../lib/utils';

const todayInput = toDateInput(new Date());
const defaultDepart = toDateInput(addDays(new Date(), 7));
const defaultReturn = toDateInput(addDays(new Date(), 14));
const TABS = ['Round Trip', 'One Way', 'Multi-City'];
const MAX_LEGS = 5;

// Real booking platforms don't price a route the same way across trip
// types: round-trip bundles a per-leg discount (still costs more overall
// since it's two legs), while multi-city itineraries lose the round-trip
// discount and usually carry a fare-construction premium instead, on top
// of having the most legs. This keeps One Way < Round Trip < Multi-City.
const FARE_FACTOR = { oneway: 1, roundtrip: 0.93, multicity: 1.1 };
function roundFare(n) { return Math.round(n / 100) * 100; }
function priceAdjustedFlight(flight, factor) {
  if (factor === 1) return flight;
  return { ...flight, economyPrice: roundFare(flight.economyPrice * factor), businessPrice: roundFare(flight.businessPrice * factor) };
}
function cheapestEconomy(list) {
  return list.length ? Math.min(...list.map((f) => f.economyPrice)) : null;
}

function newLeg(overrides = {}) {
  return {
    id: uid('leg'),
    fromQuery: '',
    fromCode: '',
    toQuery: '',
    toCode: '',
    date: defaultDepart,
    ...overrides,
  };
}

// "Delhi (DEL)" in English, "दिल्ली (DEL)" in Hindi.
function cityLabel(code) {
  const a = airportByCode(code);
  return a ? `${tr(a.city)} (${a.code})` : code;
}

function defaultLegs() {
  return [
    newLeg({ fromQuery: cityLabel('DEL'), fromCode: 'DEL', toQuery: cityLabel('LHR'), toCode: 'LHR', date: defaultDepart }),
    newLeg({ fromQuery: cityLabel('LHR'), fromCode: 'LHR', toQuery: cityLabel('CDG'), toCode: 'CDG', date: toDateInput(addDays(new Date(), 10)) }),
  ];
}

// Shared passengers stepper, used both by the Round Trip/One Way grid and
// the Multi-City footer so the two layouts don't duplicate the dropdown logic.
function PassengerField({ adults, setAdults, children, setChildren, passengersOpen, setPassengersOpen }) {
  const { t } = useLang();
  return (
    <div className="passenger-field">
      <Users2 size={16} className="search-field__icon" />
      <button type="button" className="passenger-trigger" onClick={() => setPassengersOpen((v) => !v)}>
        <span className="field-label field-label--tight">{t('Passengers')}</span>
        <b className="passenger-summary">
          {adults} {t(adults > 1 ? 'Adults' : 'Adult')}
          {children > 0 ? `, ${children} ${t(children > 1 ? 'Children' : 'Child')}` : ''}
        </b>
      </button>

      {passengersOpen && (
        <>
          <div className="passenger-overlay" onClick={() => setPassengersOpen(false)} />
          <div className="passenger-dropdown anim-drop-in">
            <div className="passenger-row">
              <span className="passenger-row__labels">
                <b className="passenger-row__title">{t('Adults')}</b>
                <span className="passenger-row__hint">{t('12 yrs & above')}</span>
              </span>
              <div className="passenger-row__controls">
                <button type="button" className="stepper-btn" disabled={adults <= 1} onClick={() => setAdults(Math.max(1, adults - 1))}>
                  <Minus size={12} />
                </button>
                <b className="stepper-value">{adults}</b>
                <button type="button" className="stepper-btn" disabled={adults + children >= 9} onClick={() => setAdults(Math.min(9, adults + 1))}>
                  <Plus size={12} />
                </button>
              </div>
            </div>
            <div className="passenger-row passenger-row--bordered">
              <span className="passenger-row__labels">
                <b className="passenger-row__title">{t('Children')}</b>
                <span className="passenger-row__hint">{t('2–11 yrs')}</span>
              </span>
              <div className="passenger-row__controls">
                <button type="button" className="stepper-btn" disabled={children <= 0} onClick={() => setChildren(Math.max(0, children - 1))}>
                  <Minus size={12} />
                </button>
                <b className="stepper-value">{children}</b>
                <button type="button" className="stepper-btn" disabled={adults + children >= 9} onClick={() => setChildren(Math.min(8, children + 1))}>
                  <Plus size={12} />
                </button>
              </div>
            </div>
            <button type="button" className="btn-primary passenger-done-btn" onClick={() => setPassengersOpen(false)}>
              {t('Done')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function FlightSearch() {
  const app = useApp();
  const { t, lang } = useLang();
  const [tab, setTab] = useState('Round Trip');

  // Round Trip / One Way fields
  const [fromQuery, setFromQuery] = useState(() => cityLabel('DEL'));
  const [fromCode, setFromCode] = useState('DEL');
  const [toQuery, setToQuery] = useState(() => cityLabel('LHR'));
  const [toCode, setToCode] = useState('LHR');
  const [departDate, setDepartDate] = useState(defaultDepart);
  const [returnDate, setReturnDate] = useState(defaultReturn);

  // Multi-City fields
  const [legs, setLegs] = useState(defaultLegs);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const passengers = adults + children;
  const [results, setResults] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null); // { flight, cls }

  // When the language changes, re-label every field that holds a chosen airport.
  useEffect(() => {
    if (fromCode) setFromQuery(cityLabel(fromCode));
    if (toCode) setToQuery(cityLabel(toCode));
    setLegs((prev) => prev.map((l) => ({
      ...l,
      fromQuery: l.fromCode ? cityLabel(l.fromCode) : l.fromQuery,
      toQuery: l.toCode ? cityLabel(l.toCode) : l.toQuery,
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function switchTab(name) {
    setTab(name);
    setResults(null);
  }

  function swap() {
    setFromQuery(toQuery); setFromCode(toCode);
    setToQuery(fromQuery); setToCode(fromCode);
  }

  function updateLeg(id, patch) {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLeg() {
    setLegs((prev) => {
      if (prev.length >= MAX_LEGS) return prev;
      const last = prev[prev.length - 1];
      const nextDate = toDateInput(addDays(new Date(last.date || defaultDepart), 3));
      return [...prev, newLeg({ fromQuery: last.toQuery, fromCode: last.toCode, date: nextDate })];
    });
  }

  function removeLeg(id) {
    setLegs((prev) => (prev.length > 2 ? prev.filter((l) => l.id !== id) : prev));
  }

  function handleSearch() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setPassengersOpen(false);

    if (tab === 'Multi-City') {
      const legResults = legs.map((leg) => {
        const from = resolveCode(leg.fromQuery, leg.fromCode);
        const to = resolveCode(leg.toQuery, leg.toCode);
        const found = app.searchFlights({ from, to }).map((f) => priceAdjustedFlight(f, FARE_FACTOR.multicity));
        return { from, to, date: leg.date, found };
      });
      setResults({ kind: 'multicity', legs: legResults });
      return;
    }

    const from = resolveCode(fromQuery, fromCode);
    const to = resolveCode(toQuery, toCode);

    if (tab === 'Round Trip') {
      const outbound = app.searchFlights({ from, to }).map((f) => priceAdjustedFlight(f, FARE_FACTOR.roundtrip));
      const inbound = app.searchFlights({ from: to, to: from }).map((f) => priceAdjustedFlight(f, FARE_FACTOR.roundtrip));
      setResults({ kind: 'roundtrip', from, to, outbound, inbound });
    } else {
      const outbound = app.searchFlights({ from, to }).map((f) => priceAdjustedFlight(f, FARE_FACTOR.oneway));
      setResults({ kind: 'oneway', from, to, outbound });
    }
  }

  function handleClear() {
    setFromQuery(''); setFromCode(''); setToQuery(''); setToCode('');
    setLegs(defaultLegs());
    setResults(null);
  }

  function handleSelect(flight, cls) {
    const doBook = () => setActiveBooking({ flight, cls });
    if (!app.currentUser) {
      app.setPendingBooking({ resume: doBook });
      app.setAuthModal('signin');
      app.notify('Please sign in to continue your booking.', 'info');
      return;
    }
    doBook();
  }

  const isMultiCity = tab === 'Multi-City';

  return (
    <section className="flight-search" id="flights">
      <div className="anim-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="glass search-card">
          <div className="search-tabs-row">
            <div className="search-tabs">
              {TABS.map((name) => (
                <button
                  key={name}
                  className={`search-tab ${tab === name ? 'search-tab--active' : ''}`}
                  onClick={() => switchTab(name)}
                >
                  {t(name)}
                </button>
              ))}
            </div>
            <span className="live-search">
              <span className="live-search__dot" /> {t('LIVE SEARCH')}
            </span>
          </div>

          {!isMultiCity && (
            <div className="search-grid">
              <div className="search-field">
                <CityAutocomplete label={t('From')} value={fromQuery} onChange={(v) => { setFromQuery(v); setFromCode(''); }} onSelect={(a) => { setFromQuery(`${t(a.city)} (${a.code})`); setFromCode(a.code); }} placeholder={cityLabel('DEL')} />
                <button type="button" onClick={swap} aria-label={t('Swap airports')} className="swap-btn">
                  <ArrowLeftRight size={15} />
                </button>
              </div>
              <div className="search-field">
                <CityAutocomplete label={t('To')} value={toQuery} onChange={(v) => { setToQuery(v); setToCode(''); }} onSelect={(a) => { setToQuery(`${t(a.city)} (${a.code})`); setToCode(a.code); }} placeholder={cityLabel('LHR')} />
                <button type="button" onClick={swap} aria-label={t('Swap airports')} className="swap-btn swap-btn--mobile">
                  <ArrowLeftRight size={14} />
                </button>
              </div>

              <label className="date-field">
                <CalendarDays size={16} className="search-field__icon" />
                <span className="date-field__stack">
                  <span className="field-label field-label--tight">{t('Departure')}</span>
                  <input type="date" min={todayInput} value={departDate} onChange={(e) => setDepartDate(e.target.value)} className="date-field__input" />
                </span>
              </label>
              <label className="date-field">
                <CalendarDays size={16} className="search-field__icon" />
                <span className="date-field__stack">
                  <span className="field-label field-label--tight">{t('Return')}</span>
                  <input
                    type="date"
                    min={departDate}
                    value={tab === 'One Way' ? '' : returnDate}
                    disabled={tab === 'One Way'}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="date-field__input"
                  />
                </span>
              </label>

              <PassengerField adults={adults} setAdults={setAdults} children={children} setChildren={setChildren} passengersOpen={passengersOpen} setPassengersOpen={setPassengersOpen} />

              <button className="btn-primary search-submit" onClick={handleSearch}>
                <Search size={16} />{t('Search Flights')}
              </button>
            </div>
          )}

          {isMultiCity && (
            <div className="multicity-form">
              {legs.map((leg, i) => (
                <div className="leg-grid" key={leg.id}>
                  <div className="search-field">
                    <CityAutocomplete
                      label={t('Flight {0} · From', i + 1)}
                      value={leg.fromQuery}
                      onChange={(v) => updateLeg(leg.id, { fromQuery: v, fromCode: '' })}
                      onSelect={(a) => updateLeg(leg.id, { fromQuery: `${t(a.city)} (${a.code})`, fromCode: a.code })}
                      placeholder={cityLabel('DEL')}
                    />
                  </div>
                  <div className="search-field">
                    <CityAutocomplete
                      label={t('To')}
                      value={leg.toQuery}
                      onChange={(v) => updateLeg(leg.id, { toQuery: v, toCode: '' })}
                      onSelect={(a) => updateLeg(leg.id, { toQuery: `${t(a.city)} (${a.code})`, toCode: a.code })}
                      placeholder={cityLabel('LHR')}
                    />
                  </div>
                  <label className="date-field">
                    <CalendarDays size={16} className="search-field__icon" />
                    <span className="date-field__stack">
                      <span className="field-label field-label--tight">{t('Departure')}</span>
                      <input
                        type="date"
                        min={i === 0 ? todayInput : legs[i - 1].date}
                        value={leg.date}
                        onChange={(e) => updateLeg(leg.id, { date: e.target.value })}
                        className="date-field__input"
                      />
                    </span>
                  </label>
                  {legs.length > 2 ? (
                    <button type="button" className="leg-remove-btn" aria-label={t('Remove flight {0}', i + 1)} onClick={() => removeLeg(leg.id)}>
                      <X size={16} />
                    </button>
                  ) : (
                    <span className="leg-remove-btn leg-remove-btn--spacer" aria-hidden="true" />
                  )}
                </div>
              ))}

              <button type="button" className="add-leg-row" disabled={legs.length >= MAX_LEGS} onClick={addLeg}>
                <Plus size={14} /> {t('Add another flight')}
              </button>

              <div className="multicity-footer-grid">
                <PassengerField adults={adults} setAdults={setAdults} children={children} setChildren={setChildren} passengersOpen={passengersOpen} setPassengersOpen={setPassengersOpen} />
                <button className="btn-primary search-submit" onClick={handleSearch}>
                  <Search size={16} />{t('Search Flights')}
                </button>
              </div>
            </div>
          )}
        </div>

        {results && results.kind === 'oneway' && (
          results.outbound.length ? (
            <FlightResults flights={results.outbound} passengerCount={passengers} onSelect={handleSelect} />
          ) : (
            <p className="no-results">
              {t('No flights found for that route yet. Try clearing the search.')} <button className="btn-link" onClick={handleClear}>{t('Clear')}</button>
            </p>
          )
        )}

        {results && results.kind === 'roundtrip' && (
          <>
            
            {results.outbound.length ? (
              <FlightResults title={t('Onward · {0} → {1}', results.from, results.to)} flights={results.outbound} passengerCount={passengers} onSelect={handleSelect} />
            ) : (
              <p className="no-results">{t('No onward flights found for {0} → {1}.', results.from, results.to)}</p>
            )}
            {results.inbound.length ? (
              <FlightResults title={t('Return · {0} → {1}', results.to, results.from)} flights={results.inbound} passengerCount={passengers} onSelect={handleSelect} />
            ) : (
              <p className="no-results">{t('No return flights found for {0} → {1}.', results.to, results.from)}</p>
            )}
          </>
        )}

        {results && results.kind === 'multicity' && (
          <>
            {results.legs.map((leg, i) => (
              leg.found.length ? (
                <FlightResults key={i} title={t('Flight {0} · {1} → {2}', i + 1, leg.from, leg.to)} flights={leg.found} passengerCount={passengers} onSelect={handleSelect} />
              ) : (
                <p className="no-results" key={i}>{t('No flights found for Flight {0}: {1} → {2}.', i + 1, leg.from, leg.to)}</p>
              )
            ))}
          </>
        )}
      </div>

      {activeBooking && (
        <BookingModal
          flight={activeBooking.flight}
          cls={activeBooking.cls}
          passengerCount={passengers}
          onClose={() => setActiveBooking(null)}
        />
      )}
    </section>
  );
}
