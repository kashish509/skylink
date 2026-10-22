import React, { useMemo } from 'react';
import { Activity, CalendarCheck, Download, IndianRupee, PlaneTakeoff, Settings as SettingsIcon, Ticket, UserPlus, Users, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { can, downloadCSV, dayKey, fullName, pctChange, timeAgo } from '../../lib/admin';
import { BarChart, Card, Donut, EmptyState, LineChart, PageHeader, StatCard } from '../ui';

const DAY = 86400000;

export default function Overview() {
  const app = useApp();
  const { users, bookings, flights, settings, currentUser } = app;

  const m = useMemo(() => {
    const now = Date.now();
    const confirmed = bookings.filter((b) => b.status === 'Confirmed');
    const cancelled = bookings.filter((b) => b.status === 'Cancelled');
    const revenueIn = (from, to) => confirmed.filter((b) => { const t = new Date(b.bookedAt).getTime(); return t >= from && t < to; }).reduce((s, b) => s + b.amount, 0);
    const countIn = (from, to) => bookings.filter((b) => { const t = new Date(b.bookedAt).getTime(); return t >= from && t < to; }).length;

    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      days.push({ key: dayKey(d.toISOString()), label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), bookings: 0, revenue: 0 });
    }
    const idx = Object.fromEntries(days.map((d, i) => [d.key, i]));
    bookings.forEach((b) => {
      const i = idx[dayKey(b.bookedAt)];
      if (i === undefined) return;
      days[i].bookings += 1;
      if (b.status === 'Confirmed') days[i].revenue += b.amount;
    });

    return {
      totalUsers: users.length,
      active: users.filter((u) => u.status !== 'inactive').length,
      inactive: users.filter((u) => u.status === 'inactive').length,
      newUsers7: users.filter((u) => u.createdAt && now - new Date(u.createdAt).getTime() < 7 * DAY).length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      revenue: confirmed.reduce((s, b) => s + b.amount, 0),
      rev30: revenueIn(now - 30 * DAY, now + DAY),
      revPrev30: revenueIn(now - 60 * DAY, now - 30 * DAY),
      book30: countIn(now - 30 * DAY, now + DAY),
      bookPrev30: countIn(now - 60 * DAY, now - 30 * DAY),
      days,
    };
  }, [users, bookings]);

  // Activity feed built from real records; notification settings decide which kinds appear.
  const feed = useMemo(() => {
    const items = [];
    const byId = Object.fromEntries(users.map((u) => [u.id, u]));
    if (settings.notifyNewBooking) {
      bookings.forEach((b) => items.push({ at: b.bookedAt, icon: <Ticket size={14} />, text: `New booking ${b.pnr}`, sub: `${fullName(byId[b.userId]) === 'Deleted user' && !b.userId ? 'Guest' : fullName(byId[b.userId])} · ${formatINR(b.amount)}` }));
    }
    if (settings.notifyCancellation) {
      bookings.filter((b) => b.status === 'Cancelled').forEach((b) => items.push({ at: b.cancelledAt || b.bookedAt, icon: <XCircle size={14} />, text: `Booking ${b.pnr} cancelled`, sub: b.refund ? `Refund ${formatINR(b.refund)}` : 'No refund' }));
    }
    if (settings.notifyNewUser) {
      users.filter((u) => u.createdAt).forEach((u) => items.push({ at: u.createdAt, icon: <UserPlus size={14} />, text: `${fullName(u)} registered`, sub: u.email }));
    }
    return items.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
  }, [users, bookings, settings]);

  const rows = [
    { label: 'Confirmed', value: m.confirmed, color: '#8fd3e8' },
    { label: 'Cancelled', value: m.cancelled, color: '#f08a8a' },
  ];

  function exportBookings() {
    const f = Object.fromEntries(flights.map((x) => [x.id, x]));
    downloadCSV('bookings.csv', ['PNR', 'Status', 'Class', 'Route', 'Flight', 'Date', 'Amount', 'Booked at'],
      bookings.map((b) => [b.pnr, b.status, b.cls, f[b.flightId] ? `${f[b.flightId].from}-${f[b.flightId].to}` : '', f[b.flightId]?.flightNo || '', f[b.flightId]?.departDate || '', b.amount, b.bookedAt]));
  }

  const actions = [
    can(currentUser, 'flights.manage') && { href: '#/admin/flights/new', icon: <PlaneTakeoff size={16} />, label: 'Add flight' },
    can(currentUser, 'users.view') && { href: '#/admin/users', icon: <Users size={16} />, label: 'Manage users' },
    can(currentUser, 'bookings.manage') && { href: '#/admin/bookings', icon: <CalendarCheck size={16} />, label: 'View bookings' },
    can(currentUser, 'settings.basic') && { href: '#/admin/settings', icon: <SettingsIcon size={16} />, label: 'Settings' },
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`Live figures from ${settings.businessName}'s data.`}
        actions={can(currentUser, 'reports.view') && <button className="adm-btn" onClick={exportBookings}><Download size={15} /> Export bookings</button>}
      />

      <div className="adm-stats">
        <StatCard icon={<Users size={18} />} label="Registered users" value={m.totalUsers} hint={`${m.newUsers7} new in 7 days`} />
        <StatCard icon={<Activity size={18} />} label="Active / inactive" value={`${m.active} / ${m.inactive}`} hint="accounts" />
        <StatCard icon={<Ticket size={18} />} label="Bookings" value={bookings.length} trend={pctChange(m.book30, m.bookPrev30)} hint="vs previous 30 days" />
        <StatCard icon={<IndianRupee size={18} />} label="Revenue" value={formatINR(m.revenue)} trend={pctChange(m.rev30, m.revPrev30)} hint="vs previous 30 days" />
      </div>

      <div className="adm-grid-main">
        <Card title="Bookings · last 14 days">
          <BarChart data={m.days.map((d) => ({ label: d.label, value: d.bookings }))} format={(n) => String(Math.round(n))} title="Bookings per day" />
        </Card>
        <Card title="Booking status">
          {bookings.length ? <Donut data={rows} title="Bookings by status" /> : <EmptyState title="No bookings yet" text="Status split appears after the first booking." />}
        </Card>
      </div>

      <div className="adm-grid-main">
        <Card title="Revenue · last 14 days">
          <LineChart data={m.days.map((d) => ({ label: d.label, value: d.revenue }))} format={(n) => formatINR(n).replace('₹', '₹')} title="Revenue per day" />
        </Card>
        <Card title="Quick actions">
          <div className="adm-quick">
            {actions.map((a) => (
              <a key={a.label} href={a.href} className="adm-quick__item">{a.icon} {a.label}</a>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Recent activity">
        {feed.length ? (
          <ul className="adm-feed">
            {feed.map((f, i) => (
              <li key={i}>
                <span className="adm-feed__icon">{f.icon}</span>
                <span className="adm-feed__text"><b>{f.text}</b><small>{f.sub}</small></span>
                <time>{timeAgo(f.at)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No recent activity" text="Bookings, cancellations and sign-ups will show up here (see Settings → Notifications)." />
        )}
      </Card>
    </>
  );
}
