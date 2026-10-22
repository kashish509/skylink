import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { downloadCSV, fmtDateTime, fullName, monthKey } from '../../lib/admin';
import { BarChart, Card, DataTable, Donut, EmptyState, PageHeader, Select, StatCard } from '../ui';

const DAY = 86400000;

export default function ReportsPage() {
  const app = useApp();
  const { bookings, flights, users, audit, currentUser } = app;
  const [range, setRange] = useState('30');

  const r = useMemo(() => {
    const since = range === 'all' ? 0 : Date.now() - Number(range) * DAY;
    const inRange = bookings.filter((b) => new Date(b.bookedAt).getTime() >= since);
    const confirmed = inRange.filter((b) => b.status === 'Confirmed');
    const cancelled = inRange.filter((b) => b.status === 'Cancelled');
    const revenue = confirmed.reduce((s, b) => s + b.amount, 0);
    const refunds = cancelled.reduce((s, b) => s + (b.refund || 0), 0);
    const flightById = Object.fromEntries(flights.map((f) => [f.id, f]));

    // Last 6 calendar months (revenue and sign-ups) — independent of the range filter.
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      months.push({ key: monthKey(d.toISOString()), label: d.toLocaleDateString('en-GB', { month: 'short' }), revenue: 0, signups: 0 });
    }
    const mi = Object.fromEntries(months.map((m, i) => [m.key, i]));
    bookings.filter((b) => b.status === 'Confirmed').forEach((b) => { const i = mi[monthKey(b.bookedAt)]; if (i !== undefined) months[i].revenue += b.amount; });
    users.forEach((u) => { if (!u.createdAt) return; const i = mi[monthKey(u.createdAt)]; if (i !== undefined) months[i].signups += 1; });

    const routes = {};
    confirmed.forEach((b) => {
      const f = flightById[b.flightId]; if (!f) return;
      const k = `${f.from}-${f.to}`;
      routes[k] = routes[k] || { id: k, route: `${f.from} → ${f.to}`, bookings: 0, revenue: 0 };
      routes[k].bookings += 1; routes[k].revenue += b.amount;
    });

    return {
      total: inRange.length, revenue, refunds,
      avg: confirmed.length ? revenue / confirmed.length : 0,
      cancelRate: inRange.length ? (cancelled.length / inRange.length) * 100 : 0,
      economy: confirmed.filter((b) => b.cls === 'Economy').length,
      business: confirmed.filter((b) => b.cls === 'Business').length,
      months, topRoutes: Object.values(routes),
    };
  }, [bookings, flights, users, range]);

  const f = Object.fromEntries(flights.map((x) => [x.id, x]));

  function exportBookings() {
    downloadCSV('bookings-report.csv', ['PNR', 'Status', 'Class', 'Route', 'Amount', 'Refund', 'Booked at'],
      bookings.map((b) => [b.pnr, b.status, b.cls, f[b.flightId] ? `${f[b.flightId].from}-${f[b.flightId].to}` : '', b.amount, b.refund || 0, b.bookedAt]));
  }
  // Passwords are never exported.
  function exportUsers() {
    downloadCSV('users.csv', ['Name', 'Email', 'Phone', 'Role', 'Status', 'Registered', 'Last login'],
      users.map((u) => [fullName(u), u.email, u.phone || '', u.role, u.status, u.createdAt || '', u.lastLoginAt || '']));
  }

  const routeCols = [
    { key: 'route', label: 'Route', sortable: true },
    { key: 'bookings', label: 'Bookings', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true, render: (x) => formatINR(x.revenue) },
  ];

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Calculated from your bookings and accounts."
        actions={(
          <>
            <Select label="Report period" value={range} onChange={setRange} options={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: 'all', label: 'All time' }]} />
            <button className="adm-btn" onClick={exportBookings}><Download size={15} /> Bookings CSV</button>
            <button className="adm-btn" onClick={exportUsers}><Download size={15} /> Users CSV</button>
          </>
        )}
      />
      <div className="adm-stats">
        <StatCard label="Bookings" value={r.total} icon={null} />
        <StatCard label="Revenue" value={formatINR(r.revenue)} icon={null} />
        <StatCard label="Avg. booking value" value={formatINR(r.avg)} icon={null} />
        <StatCard label="Cancellation rate" value={`${r.cancelRate.toFixed(1)}%`} hint={`${formatINR(r.refunds)} refunded`} icon={null} />
      </div>

      <div className="adm-grid-main">
        <Card title="Revenue by month">
          <BarChart data={r.months.map((m) => ({ label: m.label, value: m.revenue }))} title="Revenue by month" />
        </Card>
        <Card title="Class split (confirmed)">
          {r.economy + r.business ? <Donut title="Bookings by class" data={[{ label: 'Economy', value: r.economy, color: '#8fd3e8' }, { label: 'Business', value: r.business, color: '#c9b8ff' }]} /> : <EmptyState title="No confirmed bookings in this period" />}
        </Card>
      </div>

      <div className="adm-grid-main">
        <Card title="Sign-ups by month">
          <BarChart data={r.months.map((m) => ({ label: m.label, value: m.signups }))} format={(n) => String(Math.round(n))} title="New users by month" />
        </Card>
        <Card title="Top routes">
          <DataTable columns={routeCols} rows={r.topRoutes} pageSize={5} defaultSort={{ key: 'revenue', dir: 'desc' }} emptyTitle="No route data" emptyText="Confirmed bookings in this period will rank routes here." />
        </Card>
      </div>
      {currentUser && <p className="adm-muted adm-foot">Report generated {fmtDateTime(new Date().toISOString())} · {audit.length} audit entries on record.</p>}
    </>
  );
}
