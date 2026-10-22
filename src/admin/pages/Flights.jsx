import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatDate, toDateInput, addDays } from '../../lib/utils';
import { goAdmin } from '../../lib/admin';
import { Card, ConfirmDialog, DataTable, Field, Modal, PageHeader, Pill, SearchBox } from '../ui';

const blank = () => ({ flightNo: '', from: '', to: '', departDate: toDateInput(addDays(new Date(), 7)), departTime: '09:00', arriveTime: '12:00', duration: '', economyPrice: '', businessPrice: '' });

export default function FlightsPage({ mode }) {
  const app = useApp();
  const { flights, bookings } = app;
  const [q, setQ] = useState('');
  const [date, setDate] = useState('');
  const [form, setForm] = useState(null); // { id?, data }
  const [del, setDel] = useState(null);

  // /admin/flights/new (used by the Overview quick action) opens the create form.
  useEffect(() => {
    if (mode === 'new') { setForm({ data: blank() }); goAdmin('flights'); }
  }, [mode]);

  const live = useMemo(() => {
    const c = {};
    bookings.forEach((b) => { if (b.status === 'Confirmed') c[b.flightId] = (c[b.flightId] || 0) + 1; });
    return c;
  }, [bookings]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return flights.filter((f) => {
      if (date && f.departDate !== date) return false;
      if (!n) return true;
      return `${f.flightNo} ${f.from} ${f.to} ${f.fromCity} ${f.toCity}`.toLowerCase().includes(n);
    });
  }, [flights, q, date]);

  const columns = [
    { key: 'flightNo', label: 'Flight', sortable: true, render: (f) => <b>{f.flightNo}</b> },
    { key: 'route', label: 'Route', sortable: true, sortValue: (f) => `${f.from}${f.to}`, render: (f) => (<div className="adm-cell-user"><b>{f.from} → {f.to}</b><small>{f.fromCity} to {f.toCity}</small></div>) },
    { key: 'departDate', label: 'Departs', sortable: true, render: (f) => `${formatDate(f.departDate)} · ${f.departTime}` },
    { key: 'economyPrice', label: 'Economy', sortable: true, render: (f) => formatINR(f.economyPrice) },
    { key: 'businessPrice', label: 'Business', sortable: true, render: (f) => formatINR(f.businessPrice) },
    { key: 'seats', label: 'Seats sold', sortable: true, sortValue: (f) => f.seatsBooked.length, render: (f) => <Pill tone={live[f.id] ? 'info' : 'neutral'}>{f.seatsBooked.length}</Pill> },
    {
      key: 'actions', label: 'Actions', render: (f) => (
        <div className="adm-actions">
          <button className="adm-icon-btn" onClick={() => setForm({ id: f.id, data: { ...f } })} aria-label={`Edit ${f.flightNo}`} title="Edit"><Pencil size={15} /></button>
          <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setDel(f)} aria-label={`Delete ${f.flightNo}`} title="Delete"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Flights"
        subtitle={`${flights.length.toLocaleString('en-IN')} scheduled flights`}
        actions={<button className="adm-btn adm-btn--primary" onClick={() => setForm({ data: blank() })}><Plus size={15} /> Add flight</button>}
      />
      <Card>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Search flight no., airport or city" />
          <label className="adm-date"><span>Date</span><input type="date" className="adm-select" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          {(q || date) && <button className="adm-btn" onClick={() => { setQ(''); setDate(''); }}>Clear</button>}
        </div>
        <DataTable columns={columns} rows={rows} defaultSort={{ key: 'departDate', dir: 'asc' }} emptyTitle="No flights found" emptyText={flights.length ? 'Try a different search or date.' : 'Add your first flight to start taking bookings.'} />
      </Card>

      {form && <FlightForm initial={form} onClose={() => setForm(null)} />}
      {del && (
        <ConfirmDialog
          danger
          title="Delete flight?"
          message={`${del.flightNo} (${del.from} → ${del.to}, ${formatDate(del.departDate)}) will be removed. Flights with confirmed bookings can't be deleted.`}
          confirmLabel="Delete"
          onCancel={() => setDel(null)}
          onConfirm={() => { const r = app.adminDeleteFlight(del.id); app.notify(r.ok ? 'Flight deleted.' : r.message, r.ok ? 'ok' : 'error'); setDel(null); }}
        />
      )}
    </>
  );
}

function FlightForm({ initial, onClose }) {
  const app = useApp();
  const [d, setD] = useState(initial.data);
  const [error, setError] = useState('');
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }));

  function save(e) {
    e.preventDefault();
    const r = app.adminSaveFlight(d, initial.id);
    if (!r.ok) return setError(r.message);
    app.notify(initial.id ? 'Flight updated.' : 'Flight created.');
    onClose();
  }

  return (
    <Modal
      title={initial.id ? `Edit ${initial.data.flightNo}` : 'Add flight'}
      size="lg"
      onClose={onClose}
      footer={(<><button className="adm-btn" onClick={onClose}>Cancel</button><button className="adm-btn adm-btn--primary" onClick={save}>{initial.id ? 'Save changes' : 'Create flight'}</button></>)}
    >
      <form onSubmit={save} noValidate>
        <div className="adm-grid-3">
          <Field label="Flight no."><input className="field-input" value={d.flightNo} onChange={set('flightNo')} placeholder="SL 101" /></Field>
          <Field label="From (code)"><input className="field-input" value={d.from} onChange={set('from')} placeholder="DEL" maxLength={3} /></Field>
          <Field label="To (code)"><input className="field-input" value={d.to} onChange={set('to')} placeholder="BOM" maxLength={3} /></Field>
          <Field label="Date"><input className="field-input" type="date" value={d.departDate} onChange={set('departDate')} /></Field>
          <Field label="Departs"><input className="field-input" type="time" value={d.departTime} onChange={set('departTime')} /></Field>
          <Field label="Arrives"><input className="field-input" type="time" value={d.arriveTime} onChange={set('arriveTime')} /></Field>
          <Field label="Duration"><input className="field-input" value={d.duration} onChange={set('duration')} placeholder="2h 10m" /></Field>
          <Field label="Economy (₹)"><input className="field-input" type="number" min="1" value={d.economyPrice} onChange={set('economyPrice')} /></Field>
          <Field label="Business (₹)"><input className="field-input" type="number" min="1" value={d.businessPrice} onChange={set('businessPrice')} /></Field>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
