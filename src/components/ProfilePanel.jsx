import React, { useState } from 'react';
import { X, Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../lib/utils';
import { useT } from '../i18n';

export default function ProfilePanel() {
  const app = useApp();
  const t = useT();
  const [msg, setMsg] = useState('');
  if (!app.profileOpen || !app.currentUser) return null;

  const bookings = app.myBookings();

  function handleCancel(bookingId) {
    const res = app.cancelBooking(bookingId);
    if (!res.ok) return setMsg(t(res.message));
    setMsg(t('Cancelled. Refund of {0} will be processed.', formatINR(res.refund)));
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && app.setProfileOpen(false)}>
      <div className="glass modal modal--md anim-pop-in">
        <div className="modal__body">
          <button className="modal__close" onClick={() => app.setProfileOpen(false)} aria-label={t('Close')}><X size={18} /></button>
          <h3 className="modal__title"><Ticket size={16} className="icon-ice" />{t("{0}'s Bookings", app.currentUser.firstName)}</h3>
          {msg && <div className="info-banner" style={{ marginTop: 16 }}>{msg}</div>}
          {bookings.length === 0 ? (
            <p className="profile-empty">{t('No bookings yet — search for a flight to get started.')}</p>
          ) : (
            <div className="booking-list">
              {bookings.map((b) => {
                const flight = app.flights.find((f) => f.id === b.flightId);
                return (
                  <div className="booking-card" key={b.id}>
                    <div className="booking-card__top">
                      <b className="booking-card__pnr">{b.pnr}</b>
                      <span className={`booking-status ${b.status === 'Cancelled' ? 'booking-status--cancelled' : ''}`}>{t(b.status)}</span>
                    </div>
                    {flight ? (
                      <p className="booking-card__line">{flight.flightNo} · {flight.from} → {flight.to} · {formatDate(flight.departDate)} {flight.departTime}</p>
                    ) : <p className="booking-card__line">{t('Flight details unavailable.')}</p>}
                    <p className="booking-card__sub">{t(b.cls)} · {t('Seats')} {b.seats.join(', ')} · {t('Paid')} {formatINR(b.amount)}{b.refund ? ` · ${t('Refunded')} ${formatINR(b.refund)}` : ''}</p>
                    {b.status === 'Confirmed' && (
                      <button className="btn-link booking-card__cancel" onClick={() => handleCancel(b.id)}>{t('Cancel Booking')}</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
