import React, { useMemo, useState } from 'react';
import { X, ArmchairIcon, CreditCard, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildSeatLayout, fareFor, formatINR, formatDate } from '../lib/utils';
import { useT } from '../i18n';

const STEPS = ['Seats', 'Passengers', 'Payment', 'Confirmation'];

export default function BookingModal({ flight, cls, passengerCount, onClose }) {
  const app = useApp();
  const t = useT();
  const [stepIdx, setStepIdx] = useState(0);
  const [seats, setSeats] = useState([]);
  const [passengers, setPassengers] = useState(
    Array.from({ length: passengerCount }, () => ({ name: '', age: '' }))
  );
  const [contact, setContact] = useState({ email: app.currentUser?.email || '', phone: app.currentUser?.phone || '' });
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  const fare = fareFor(flight, cls);
  const total = fare * passengerCount;
  const bookedSeats = flight.seatsBooked;

  function toggleSeat(seat) {
    if (bookedSeats.includes(seat.id)) return;
    if (seat.cls !== cls) return; // seats from the other cabin class aren't selectable for this booking
    setSeats((prev) => {
      if (prev.includes(seat.id)) return prev.filter((s) => s !== seat.id);
      if (prev.length >= passengerCount) return prev; // limit to number of passengers
      return [...prev, seat.id];
    });
  }

  function goNext() {
    setError('');
    if (stepIdx === 0) {
      if (seats.length !== passengerCount) return setError(t('Please select {0} seat(s) — {1} chosen.', passengerCount, seats.length));
    }
    if (stepIdx === 1) {
      if (passengers.some((p) => !p.name.trim() || !p.age)) return setError(t('Please enter name and age for every passenger.'));
      if (!contact.email || !contact.phone) return setError(t('Please provide a contact email and phone number.'));
    }
    if (stepIdx === 2) {
      if (!card.name || card.number.replace(/\s/g, '').length < 12 || !card.expiry || card.cvv.length < 3) {
        return setError(t('Please enter valid card details to continue.'));
      }
      const res = app.createBooking({
        flightId: flight.id,
        cls,
        seats,
        passengers,
        contact,
        amount: total,
      });
      if (!res.ok) return setError(t(res.message));
      setBooking(res.booking);
      app.notify(t('Booking confirmed — PNR {0}', res.booking.pnr));
    }
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setError('');
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && stepIdx < 3 && onClose()}>
      <div className="glass modal modal--lg anim-pop-in">
        <button className="modal__close" onClick={onClose} aria-label={t('Close')}><X size={18} /></button>
        <div className="booking-header">
          <div className="label-eyebrow">{t('Book')} · {flight.flightNo} · {flight.from} → {flight.to}</div>
          <div className="booking-steps">
            {STEPS.map((s, i) => (
              <span key={s} className={`booking-step ${i === stepIdx ? 'booking-step--active' : i < stepIdx ? 'booking-step--done' : ''}`}>
                {i + 1}. {t(s)}
              </span>
            ))}
          </div>
        </div>

        {stepIdx === 0 && (
          <SeatStep flight={flight} seats={seats} toggleSeat={toggleSeat} passengerCount={passengerCount} cls={cls} />
        )}
        {stepIdx === 1 && (
          <PassengerStep passengers={passengers} setPassengers={setPassengers} contact={contact} setContact={setContact} seats={seats} />
        )}
        {stepIdx === 2 && (
          <PaymentStep card={card} setCard={setCard} total={total} fare={fare} passengerCount={passengerCount} cls={cls} />
        )}
        {stepIdx === 3 && booking && (
          <ConfirmStep booking={booking} flight={flight} onClose={onClose} />
        )}

        {error && <div className="form-error" style={{ margin: '16px 28px 0' }}>{error}</div>}

        {stepIdx < 3 && (
          <div className="modal-footer">
            <button className="btn-link btn-link--plain" onClick={stepIdx === 0 ? onClose : goBack}>
              <ArrowLeft size={13} className="modal-footer__back-icon" />{stepIdx === 0 ? t('Cancel') : t('Back')}
            </button>
            <div className="modal-footer__total">{t('Total')} <b>{formatINR(total)}</b></div>
            <button className="btn-primary" onClick={goNext}>
              {stepIdx === 2 ? t('Pay & Confirm') : t('Continue')} <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SeatStep({ flight, seats, toggleSeat, passengerCount, cls }) {
  const t = useT();
  const layout = useMemo(() => buildSeatLayout(), []);
  const rows = useMemo(() => [...new Set(layout.map((s) => s.row))], [layout]);
  return (
    <div className="booking-step-body">
      <p className="seat-step__intro"><ArmchairIcon size={14} className="icon-ice" />{t('Select {0} seat(s) for your {1} journey.', passengerCount, t(cls))}</p>
      <div className="seat-map">
        {rows.map((r) => (
          <div className="seat-row" key={r}>
            <span className="seat-row__label">{r}</span>
            {layout.filter((s) => s.row === r).map((s) => {
              const taken = flight.seatsBooked.includes(s.id);
              const selected = seats.includes(s.id);
              const wrongClass = s.cls !== cls;
              return (
                <button
                  type="button"
                  key={s.id}
                  disabled={taken || wrongClass}
                  onClick={() => toggleSeat(s)}
                  title={`${s.id} · ${t(s.cls)}${taken ? ` · ${t('booked')}` : wrongClass ? ` · ${t('not available for {0} booking', t(cls))}` : ''}`}
                  className={`seat-btn ${
                    taken
                      ? 'seat-btn--taken'
                      : wrongClass
                      ? 'seat-btn--wrong-class'
                      : selected
                      ? 'seat-btn--selected'
                      : s.cls === 'Business'
                      ? 'seat-btn--business'
                      : ''
                  }`}
                >{s.id}</button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="seat-legend">
        <span className="seat-legend__item"><i className="seat-legend__swatch" />{t('Economy')}</span>
        <span className="seat-legend__item"><i className="seat-legend__swatch seat-legend__swatch--business" />{t('Business')}</span>
        <span className="seat-legend__item"><i className="seat-legend__swatch seat-legend__swatch--selected" />{t('Selected')}</span>
        <span className="seat-legend__item"><i className="seat-legend__swatch seat-legend__swatch--booked" />{t('Booked')}</span>
        <span className="seat-legend__item"><i className="seat-legend__swatch seat-legend__swatch--wrong-class" />{t('Not in your fare')}</span>
      </div>
    </div>
  );
}

function PassengerStep({ passengers, setPassengers, contact, setContact, seats }) {
  const t = useT();
  function update(i, key, val) {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));
  }
  return (
    <div className="booking-step-body">
      <p className="passenger-step__intro">{t('Enter passenger details as they appear on ID. Seats:')} {seats.join(', ')}</p>
      <div className="passenger-form-list">
        {passengers.map((p, i) => (
          <div key={i}>
            <b className="passenger-form-item__title">{t('Passenger')} {i + 1} · {t('Seat')} {seats[i]}</b>
            <div className="form-grid-2">
              <label><span className="field-label">{t('Full Name')}</span><input value={p.name} onChange={(e) => update(i, 'name', e.target.value)} className="field-input" /></label>
              <label><span className="field-label">{t('Age')}</span><input type="number" min="0" max="120" value={p.age} onChange={(e) => update(i, 'age', e.target.value)} className="field-input" /></label>
            </div>
          </div>
        ))}
      </div>
      <div className="form-grid-2 form-grid-2--spaced">
        <label><span className="field-label">{t('Contact Email')}</span><input type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} className="field-input" /></label>
        <label><span className="field-label">{t('Contact Phone')}</span><input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className="field-input" /></label>
      </div>
    </div>
  );
}

function PaymentStep({ card, setCard, total, fare, passengerCount, cls }) {
  const t = useT();
  return (
    <div className="payment-grid">
      <div className="fare-summary">
        <div className="label-eyebrow">{t('Fare Summary')}</div>
        <div className="fare-summary__row"><span>{t('{0} fare', t(cls))} × {passengerCount}</span><b>{formatINR(fare)} × {passengerCount}</b></div>
        <div className="fare-summary__row"><span>{t('Taxes & fees')}</span><b>{t('Included')}</b></div>
        <div className="fare-summary__total"><span>{t('Total payable')}</span><b>{formatINR(total)}</b></div>
      </div>
      <div>
        <div className="label-eyebrow card-form__label"><CreditCard size={13} />{t('Card Details')}</div>
        <div className="card-form-fields">
          <label><span className="field-label">{t('Name on Card')}</span><input value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} className="field-input" /></label>
          <label><span className="field-label">{t('Card Number')}</span><input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))} className="field-input" /></label>
          <div className="form-grid-2">
            <label><span className="field-label">{t('Expiry (MM/YY)')}</span><input placeholder="09/29" value={card.expiry} onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))} className="field-input" /></label>
            <label><span className="field-label">{t('CVV')}</span><input inputMode="numeric" maxLength={4} placeholder="123" value={card.cvv} onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))} className="field-input" /></label>
          </div>
        </div>
        <p className="card-form__note">{t('This is a demo payment form — no real transaction is made.')}</p>
      </div>
    </div>
  );
}

function ConfirmStep({ booking, flight, onClose }) {
  const t = useT();
  return (
    <div className="confirm-step">
      <CheckCircle2 size={40} className="icon-ice" />
      <h3 className="confirm-step__title">{t('Booking confirmed')}</h3>
      <p className="confirm-step__subtitle">{t('A confirmation has been sent to {0}.', booking.contact.email)}</p>
      <div className="confirm-step__pnr-box">
        <span className="confirm-step__pnr-label">{t('PNR / Booking Reference')}</span>
        <b className="confirm-step__pnr">{booking.pnr}</b>
      </div>
      <div className="confirm-details">
        <div><small className="detail-item__label">{t('Flight')}</small><b className="detail-item__value">{flight.flightNo}</b></div>
        <div><small className="detail-item__label">{t('Route')}</small><b className="detail-item__value">{flight.from} → {flight.to}</b></div>
        <div><small className="detail-item__label">{t('Departs')}</small><b className="detail-item__value">{formatDate(flight.departDate)} · {flight.departTime}</b></div>
        <div><small className="detail-item__label">{t('Class')}</small><b className="detail-item__value">{t(booking.cls)}</b></div>
        <div><small className="detail-item__label">{t('Seats')}</small><b className="detail-item__value">{booking.seats.join(', ')}</b></div>
        <div><small className="detail-item__label">{t('Amount Paid')}</small><b className="detail-item__value">{formatINR(booking.amount)}</b></div>
      </div>
      <button className="btn-primary confirm-step__done" onClick={onClose}>{t('Done')}</button>
    </div>
  );
}
