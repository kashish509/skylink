import React from 'react';
import { ArrowRight, Plane } from 'lucide-react';
import { formatINR, formatDate } from '../lib/utils';
import { useReveal } from '../lib/useReveal';
import { useT } from '../i18n';

export default function FlightResults({ flights, passengerCount, onSelect, title = 'Available Flights' }) {
  const t = useT();
  if (!flights.length) return null;
  return (
    <div className="flight-results">
      <div className="label-eyebrow flight-results__label">{t(title)} · {t('{0} found', flights.length)}</div>
      <div className="flight-results__list">
        {flights.map((f, i) => (
          <FlightCard key={f.id} flight={f} index={i} passengerCount={passengerCount} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

// "7h 30m" -> "7 घं 30 मि" in Hindi.
function durationLabel(d, t) {
  const m = String(d).match(/^(\d+)h(?: (\d+)m)?$/);
  if (!m) return d;
  return `${m[1]} ${t('h')}${m[2] ? ` ${m[2]} ${t('m')}` : ''}`;
}

function FlightCard({ flight: f, index, passengerCount, onSelect }) {
  const t = useT();
  const [ref, visible] = useReveal({ amount: 0.3 });
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${Math.min(index * 0.06, 0.3)}s` }}
      className={`glass flight-card reveal ${visible ? 'reveal--visible' : ''}`}
    >
      <div>
        <span className="flight-card__flightno">
          <Plane size={13} /> {f.flightNo}
        </span>
        <div className="flight-card__times">
          <b className="flight-card__time">{f.departTime}</b>
          <small className="flight-card__airport">{f.from}</small>
          <span className="flight-card__arrow">
            <ArrowRight size={13} />
            <em className="flight-card__duration">{durationLabel(f.duration, t)}</em>
          </span>
          <b className="flight-card__time">{f.arriveTime}</b>
          <small className="flight-card__airport">{f.to}</small>
        </div>
        <span className="flight-card__meta">{formatDate(f.departDate)} · {t(f.fromCity)} → {t(f.toCity)}</span>
      </div>
      <div className="flight-card__fares">
        <button className="fare-btn" onClick={() => onSelect(f, 'Economy')}>
          <small className="fare-btn__label">{t('Economy')}</small>
          <b className="fare-btn__price">{formatINR(f.economyPrice * passengerCount)}</b>
        </button>
        <button className="fare-btn fare-btn--business" onClick={() => onSelect(f, 'Business')}>
          <small className="fare-btn__label">{t('Business')}</small>
          <b className="fare-btn__price">{formatINR(f.businessPrice * passengerCount)}</b>
        </button>
      </div>
    </div>
  );
}
