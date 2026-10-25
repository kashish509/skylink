import React, { useState } from 'react';
import { X, Search, Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../lib/utils';
import { useT } from '../i18n';

export default function EnquiryModal() {
  const app = useApp();
  const t = useT();
  const [pnr, setPnr] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  if (!app.enquiryOpen) return null;

  function close() {
    app.setEnquiryOpen(false);
    setResult(null); setError(''); setMsg(''); setPnr('');
  }

  function find(e) {
    e.preventDefault();
    setError(''); setMsg('');
    const res = app.getBookingByPNR(pnr);
    if (!res.ok) { setResult(null); return setError(t(res.message)); }
    setResult(res);
  }

  function cancel() {
    const res = app.cancelBooking(result.booking.id);
    if (!res.ok) return setError(t(res.message));
    setMsg(t('Booking cancelled. Refund of {0} will be processed to your original payment method.', formatINR(res.refund)));
    setResult((r) => ({ ...r, booking: { ...r.booking, status: 'Cancelled', refund: res.refund } }));
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="glass modal modal--sm anim-pop-in">
        <button className="modal__close" onClick={close} aria-label={t('Close')}><X size={18} /></button>
        <form className="auth-form modal__body" onSubmit={find}>
          <h3 className="modal__title"><Ticket size={17} className="icon-ice" />{t('Track Booking')}</h3>
          <p className="auth-form__subtitle">{t('Enter your PNR to view or cancel a booking.')}</p>
          <label><span className="field-label">{t('PNR / Booking Reference')}</span><input required value={pnr} onChange={(e) => setPnr(e.target.value.toUpperCase())} placeholder={t('e.g. SKAB12CD')} className="field-input" /></label>
          {error && <div className="form-error">{error}</div>}
          <div><button type="submit" className="btn-primary"><Search size={14} /> {t('Find Booking')}</button></div>
        </form>

        {result && (
          <div className="enquiry-result">
            <div><small className="enquiry-result__label">{t('Status')}</small><b className="enquiry-result__value">{t(result.booking.status)}</b></div>
            <div><small className="enquiry-result__label">{t('Flight')}</small><b className="enquiry-result__value">{result.flight?.flightNo}</b></div>
            <div><small className="enquiry-result__label">{t('Route')}</small><b className="enquiry-result__value">{result.flight?.from} → {result.flight?.to}</b></div>
            <div><small className="enquiry-result__label">{t('Departs')}</small><b className="enquiry-result__value">{formatDate(result.flight?.departDate)} · {result.flight?.departTime}</b></div>
            <div><small className="enquiry-result__label">{t('Class')}</small><b className="enquiry-result__value">{t(result.booking.cls)}</b></div>
            <div><small className="enquiry-result__label">{t('Seats')}</small><b className="enquiry-result__value">{result.booking.seats.join(', ')}</b></div>
            <div><small className="enquiry-result__label">{t('Amount Paid')}</small><b className="enquiry-result__value">{formatINR(result.booking.amount)}</b></div>
            {msg && <div className="info-banner enquiry-result__full">{msg}</div>}
            {result.booking.status === 'Confirmed' && (
              <button className="btn-link enquiry-result__cancel" onClick={cancel}>{t('Cancel this booking')}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
