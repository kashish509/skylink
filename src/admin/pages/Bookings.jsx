import React, { useMemo, useState } from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate } from '../../lib/utils';
import { downloadCSV, fmtDateTime, fullName } from '../../lib/admin';
import { Card, ConfirmDialog, DataTable, Field, Modal, PageHeader, Pill, SearchBox, Select } from '../ui';

export default function BookingsPage() {
  const app = useApp();
  const { bookings, flights, users } = app;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [cls, setCls] = useState('all');
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);

  const flightById = useMemo(() => Object.fromEntries(flights.map((f) => [f.id, f])), [flights]);
  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== 'all' && b.status !== status) return false;
      if (cls !== 'all' && b.cls !== cls) return false;
      if (!n) return true;
      const f = flightById[b.flightId];
      const hay = `${b.pnr} ${b.contact?.email || ''} ${(b.passengers || []).map((p) => p.name).join(' ')} ${f ? `${f.flightNo} ${f.from} ${f.to}` : ''}`.toLowerCase();
      return hay.includes(n);
    });
  }, [bookings, q, status, cls, flightById]);

  const columns = [
    { key: 'pnr', label: 'PNR', sortable: true, render: (b) => <b>{b.pnr}</b> },
    { key: 'route', label: 'Flight', sortable: true, sortValue: (b) => (flightById[b.flightId] ? `${flightById[b.flightId].from}${flightById[b.flightId].to}` : ''), render: (b) => { const f = flightById[b.flightId]; return f ? (<div className="adm-cell-user"><b>{f.from} → {f.to}</b><small>{f.flightNo} · {formatDate(f.departDate)}</small></div>) : <span className="adm-muted">Flight removed</span>; } },
    { key: 'customer', label: 'Customer', sortable: true, sortValue: (b) => fullName(userById[b.userId]), render: (b) => (b.userId ? fullName(userById[b.userId]) : 'Guest') },
    { key: 'cls', label: 'Class', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, render: (b) => formatINR(b.amount) },
    { key: 'status', label: 'Status', sortable: true, render: (b) => <Pill tone={b.status === 'Confirmed' ? 'ok' : 'danger'}>{b.status}</Pill> },
    { key: 'bookedAt', label: 'Booked', sortable: true, render: (b) => fmtDateTime(b.bookedAt) },
    {
      key: 'actions', label: 'Actions', render: (b) => (
        <div className="adm-actions">
          <button className="adm-icon-btn" onClick={() => setEdit(b.id)} aria-label={`Open booking ${b.pnr}`} title="View / edit"><Eye size={15} /></button>
          <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setDel(b)} aria-label={`Delete booking ${b.pnr}`} title="Delete"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  function exportCsv() {
    downloadCSV('bookings.csv', ['PNR', 'Status', 'Class', 'Flight', 'Route', 'Departure', 'Customer', 'Contact email', 'Seats', 'Amount', 'Refund', 'Booked at'],
      rows.map((b) => { const f = flightById[b.flightId]; return [b.pnr, b.status, b.cls, f?.flightNo || '', f ? `${f.from}-${f.to}` : '', f?.departDate || '', b.userId ? fullName(userById[b.userId]) : 'Guest', b.contact?.email || '', (b.seats || []).join(' '), b.amount, b.refund || 0, b.bookedAt]; }));
  }

  const editing = edit ? bookings.find((b) => b.id === edit) : null;

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Bookings are created by customers at checkout; admins can correct contact details, change status or remove records."
        actions={<button className="adm-btn" onClick={exportCsv} disabled={!rows.length}><Download size={15} /> Export CSV</button>}
      />
      <Card>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Search PNR, passenger, email, flight" />
          <Select label="Filter by status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, { value: 'Confirmed', label: 'Confirmed' }, { value: 'Cancelled', label: 'Cancelled' }]} />
          <Select label="Filter by class" value={cls} onChange={setCls} options={[{ value: 'all', label: 'All classes' }, { value: 'Economy', label: 'Economy' }, { value: 'Business', label: 'Business' }]} />
        </div>
        <DataTable columns={columns} rows={rows} defaultSort={{ key: 'bookedAt', dir: 'desc' }} emptyTitle={bookings.length ? 'No bookings match your filters' : 'No bookings yet'} emptyText={bookings.length ? 'Try clearing a filter.' : 'Bookings made on the site will appear here.'} />
      </Card>

      {editing && <EditModal booking={editing} flight={flightById[editing.flightId]} onClose={() => setEdit(null)} />}
      {del && (
        <ConfirmDialog
          danger
          title="Delete booking?"
          message={`Booking ${del.pnr} will be removed${del.status === 'Confirmed' ? ' and its seats released' : ''}. This can't be undone.`}
          confirmLabel="Delete"
          onCancel={() => setDel(null)}
          onConfirm={() => { const r = app.adminDeleteBooking(del.id); app.notify(r.ok ? 'Booking deleted.' : r.message, r.ok ? 'ok' : 'error'); setDel(null); }}
        />
      )}
    </>
  );
}

function EditModal({ booking, flight, onClose }) {
  const app = useApp();
  const [email, setEmail] = useState(booking.contact?.email || '');
  const [phone, setPhone] = useState(booking.contact?.phone || '');
  const [status, setStatus] = useState(booking.status);
  const [error, setError] = useState('');

  function save() {
    const r = app.adminUpdateBooking(booking.id, { status, contact: { email, phone } });
    if (!r.ok) return setError(r.message);
    app.notify('Booking updated.');
    onClose();
  }

  return (
    <Modal
      title={`Booking ${booking.pnr}`}
      onClose={onClose}
      footer={(<><button className="adm-btn" onClick={onClose}>Close</button><button className="adm-btn adm-btn--primary" onClick={save}>Save changes</button></>)}
    >
      <dl className="adm-dl">
        <div><dt>Flight</dt><dd>{flight ? `${flight.flightNo} · ${flight.from} → ${flight.to}` : 'Removed'}</dd></div>
        <div><dt>Departure</dt><dd>{flight ? `${formatDate(flight.departDate)} ${flight.departTime}` : '—'}</dd></div>
        <div><dt>Class / seats</dt><dd>{booking.cls} · {(booking.seats || []).join(', ')}</dd></div>
        <div><dt>Amount</dt><dd>{formatINR(booking.amount)}{booking.refund ? ` (refunded ${formatINR(booking.refund)})` : ''}</dd></div>
        <div><dt>Passengers</dt><dd>{(booking.passengers || []).map((p) => p.name).join(', ') || '—'}</dd></div>
        <div><dt>Booked</dt><dd>{fmtDateTime(booking.bookedAt)}</dd></div>
      </dl>
      <div className="adm-grid-2">
        <Field label="Contact email"><input className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Contact phone"><input className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" /></Field>
      </div>
      <Field label="Status"><Select label="Booking status" value={status} onChange={setStatus} options={[{ value: 'Confirmed', label: 'Confirmed' }, { value: 'Cancelled', label: 'Cancelled' }]} /></Field>
      {error && <div className="form-error" role="alert">{error}</div>}
    </Modal>
  );
}
