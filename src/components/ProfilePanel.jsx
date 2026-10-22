import React, { useState } from 'react';
import { X, Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../lib/utils';

export default function ProfilePanel() {
  const app = useApp();
  const [msg, setMsg] = useState('');
  if (!app.profileOpen || !app.currentUser) return null;

  const bookings = app.myBookings();

  function handleCancel(bookingId) {
    const res = app.cancelBooking(bookingId);
    if (!res.ok) return setMsg(res.message);
    setMsg(`Cancelled. Refund of ${formatINR(res.refund)} will be processed.`);
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && app.setProfileOpen(false)}>
      <div className="glass modal modal--md anim-pop-in">
        <div className="modal__body">
          <button className="modal__close" onClick={() => app.setProfileOpen(false)} aria-label="Close"><X size={18} /></button>
          <h3 className="modal__title"><Ticket size={16} className="icon-ice" />{app.currentUser.firstName}'s Bookings</h3>
          {msg && <div className="info-banner" style={{ marginTop: 16 }}>{msg}</div>}
          {bookings.length === 0 ? (
            <p className="profile-empty">No bookings yet &mdash; search for a flight to get started.</p>
          ) : (
            <div className="booking-list">
              {bookings.map((b) => {
                const flight = app.flights.find((f) => f.id === b.flightId);
                return (
                  <div className="booking-card" key={b.id}>
                    <div className="booking-card__top">
                      <b className="booking-card__pnr">{b.pnr}</b>
                      <span className={`booking-status ${b.status === 'Cancelled' ? 'booking-status--cancelled' : ''}`}>{b.status}</span>
                    </div>
                    {flight ? (
                      <p className="booking-card__line">{flight.flightNo} &middot; {flight.from} &rarr; {flight.to} &middot; {formatDate(flight.departDate)} {flight.departTime}</p>
                    ) : <p className="booking-card__line">Flight details unavailable.</p>}
                    <p className="booking-card__sub">{b.cls} &middot; Seats {b.seats.join(', ')} &middot; Paid {formatINR(b.amount)}{b.refund ? ` \u00b7 Refunded ${formatINR(b.refund)}` : ''}</p>
                    {b.status === 'Confirmed' && (
                      <button className="btn-link booking-card__cancel" onClick={() => handleCancel(b.id)}>Cancel Booking</button>
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
