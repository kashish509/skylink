import React, { useEffect, useState } from 'react';
import {
  BarChart3, Eye, EyeOff, LayoutDashboard, LogOut, Menu, Plane, ScrollText,
  Mail, Settings as SettingsIcon, ShieldAlert, ShieldCheck, Ticket, Users as UsersIcon, X, ExternalLink, PlaneTakeoff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { can, isAdmin, fullName, goAdmin, ROLE_LABEL } from '../lib/admin';
import { Field } from './ui';
import Overview from './pages/Overview';
import UsersPage from './pages/Users';
import BookingsPage from './pages/Bookings';
import FlightsPage from './pages/Flights';
import ReportsPage from './pages/Reports';
import LogsPage from './pages/Logs';
import SettingsPage from './pages/Settings';
import MessagesPage from './pages/Messages';
import './admin.css';

export const adminNav = [
  { key: '', label: 'Overview', icon: LayoutDashboard, perm: 'dashboard' },
  { key: 'users', label: 'Users', icon: UsersIcon, perm: 'users.view' },
  { key: 'bookings', label: 'Bookings', icon: Ticket, perm: 'bookings.manage' },
  { key: 'flights', label: 'Flights', icon: PlaneTakeoff, perm: 'flights.manage' },
  { key: 'messages', label: 'Messages', icon: Mail, perm: 'messages.manage' },
  { key: 'reports', label: 'Reports & Analytics', icon: BarChart3, perm: 'reports.view' },
  { key: 'logs', label: 'Activity Logs', icon: ScrollText, perm: 'logs.view' },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, perm: 'settings.basic' },
];

export default function AdminApp({ segments }) {
  const app = useApp();
  const user = app.currentUser;

  if (!user) return <AdminGate />;
  if (!isAdmin(user)) return <AccessDenied />;
  return <Shell user={user} segments={segments} />;
}

/* ------------------------------------------------------------ login ---- */
function AdminGate() {
  const app = useApp();
  const setup = !app.hasSuperAdmin();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    setError('');
    const res = setup ? app.setupSuperAdmin(form) : app.login(form.email, form.password);
    if (!res.ok) setError(res.message);
  }

  return (
    <div className="adm-auth">
      <form className="glass adm-auth__card anim-pop-in" onSubmit={submit} noValidate>
        <div className="adm-auth__brand"><Plane size={18} className="icon-ice" /> SkyLink <span>Admin</span></div>
        <h1 className="adm-auth__title">{setup ? 'Create the Super Admin account' : 'Admin sign in'}</h1>
        <p className="adm-auth__sub">
          {setup
            ? 'No administrator exists yet. This one-time setup creates the first Super Admin.'
            : 'Sign in with an administrator account to continue.'}
        </p>

        {setup && (
          <div className="adm-grid-2">
            <Field label="First name"><input className="field-input" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" /></Field>
            <Field label="Last name"><input className="field-input" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" /></Field>
          </div>
        )}
        <Field label="Email">
          <input className="field-input" type="email" value={form.email} onChange={set('email')} autoComplete="username" />
        </Field>
        <Field label="Password" hint={setup ? '8+ characters with an uppercase letter, a number and a special character.' : undefined}>
          <div className="password-field">
            <input className="field-input" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} autoComplete={setup ? 'new-password' : 'current-password'} />
            <button type="button" className="password-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        {setup && (
          <Field label="Confirm password">
            <input className="field-input" type={show ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
          </Field>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn-primary adm-auth__submit" type="submit">{setup ? 'Create Super Admin' : 'Sign in'}</button>
        <a className="btn-link btn-link--plain adm-auth__back" href="#">← Back to SkyLink</a>
      </form>
    </div>
  );
}

function AccessDenied() {
  const app = useApp();
  return (
    <div className="adm-auth">
      <div className="glass adm-auth__card anim-pop-in">
        <ShieldAlert size={34} className="adm-denied-icon" />
        <h1 className="adm-auth__title">Access denied</h1>
        <p className="adm-auth__sub">
          {app.currentUser?.status === 'inactive'
            ? 'This account has been deactivated.'
            : 'Your account does not have permission to open the admin area.'}
        </p>
        <a className="btn-primary adm-auth__submit" href="#">Back to SkyLink</a>
        <button className="btn-link adm-auth__back" onClick={() => app.logout()}>Sign out</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- shell ---- */
function Shell({ user, segments }) {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const section = segments[0] || '';
  const items = adminNav.filter((n) => can(user, n.perm));
  const current = adminNav.find((n) => n.key === section);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [section]);
  useEffect(() => { document.title = `${current?.label || 'Admin'} · ${app.settings.businessName} Admin`; }, [current, app.settings.businessName]);

  function logout() {
    app.logout();
    goAdmin();
  }

  let page;
  if (!current) page = <NotFound />;
  else if (!can(user, current.perm)) page = <NoPermission />;
  else if (section === '') page = <Overview />;
  else if (section === 'users') page = <UsersPage />;
  else if (section === 'bookings') page = <BookingsPage />;
  else if (section === 'flights') page = <FlightsPage mode={segments[1]} />;
  else if (section === 'messages') page = <MessagesPage />;
  else if (section === 'reports') page = <ReportsPage />;
  else if (section === 'logs') page = <LogsPage />;
  else page = <SettingsPage />;

  return (
    <div className="adm-shell">
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}
      <aside className={`adm-sidebar ${open ? 'adm-sidebar--open' : ''}`} aria-label="Admin navigation">
        <div className="adm-sidebar__top">
          <a className="adm-brand" href="#/admin"><Plane size={17} className="icon-ice" /> {app.settings.businessName}<span>Admin</span></a>
          <button className="adm-icon-btn adm-only-mobile" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="adm-nav">
          {items.map((n) => {
            const Icon = n.icon;
            return (
              <a key={n.key} href={n.key ? `#/admin/${n.key}` : '#/admin'} className={`adm-nav__link ${section === n.key ? 'adm-nav__link--active' : ''}`} aria-current={section === n.key ? 'page' : undefined}>
                <Icon size={16} /> {n.label}
              </a>
            );
          })}
        </nav>
        <div className="adm-sidebar__bottom">
          <a className="adm-nav__link" href="#"><ExternalLink size={16} /> View website</a>
          <button className="adm-nav__link" onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-icon-btn adm-only-mobile" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <span className="adm-topbar__title">{current?.label || 'Not found'}</span>
          <div className="adm-profile">
            <span className="adm-avatar" aria-hidden="true">{(user.firstName || '?')[0]}</span>
            <span className="adm-profile__text">
              <b>{fullName(user)}</b>
              <small><ShieldCheck size={11} /> {ROLE_LABEL[user.role]}</small>
            </span>
            <button className="adm-icon-btn" onClick={logout} aria-label="Logout" title="Logout"><LogOut size={16} /></button>
          </div>
        </header>
        <main className="adm-content" key={section}>{page}</main>
      </div>

      {app.toast && <div key={app.toast.key} className={`glass toast adm-toast anim-toast-in ${app.toast.tone === 'error' ? 'adm-toast--error' : ''}`} role="status">{app.toast.message}</div>}
    </div>
  );
}

function NoPermission() {
  return (
    <div className="glass adm-card adm-center">
      <ShieldAlert size={30} className="adm-denied-icon" />
      <h1 className="adm-page-title">No permission</h1>
      <p className="adm-page-sub">Your role can't open this section.</p>
      <a className="adm-btn adm-btn--primary" href="#/admin">Back to overview</a>
    </div>
  );
}

function NotFound() {
  return (
    <div className="glass adm-card adm-center">
      <h1 className="adm-page-title">Page not found</h1>
      <a className="adm-btn adm-btn--primary" href="#/admin">Back to overview</a>
    </div>
  );
}
