import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { uid, genPNR, validatePassword, validateEmail, validatePhone, hoursUntil, fareFor } from '../lib/utils';
import { airports } from '../data/airports';
import { can, fullName } from '../lib/admin';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const LS_USERS = 'skylink_users';
const LS_FLIGHTS = 'skylink_flights';
const LS_FLIGHTS_VERSION = 'skylink_flights_version';
const LS_BOOKINGS = 'skylink_bookings';
const LS_SESSION = 'skylink_session';
const LS_AUDIT = 'skylink_audit';
const LS_SETTINGS = 'skylink_settings';
const LS_MESSAGES = 'skylink_messages';

const AUDIT_LIMIT = 2000;

export const DEFAULT_SETTINGS = {
  businessName: 'SkyLink',
  supportEmail: '',
  supportPhone: '',
  businessAddress: '',
  notifyNewBooking: true,
  notifyCancellation: true,
  notifyNewUser: true,
  cancellationFeePercent: 20,
  cancellationCutoffHours: 3,
};

const BASIC_SETTING_KEYS = ['businessName', 'supportEmail', 'supportPhone', 'businessAddress', 'notifyNewBooking', 'notifyCancellation', 'notifyNewUser'];
const SENSITIVE_SETTING_KEYS = ['cancellationFeePercent', 'cancellationCutoffHours'];

// Bump this whenever seedFlights()'s output shape/coverage changes.
// On load we compare it to what's stored; a mismatch (including nothing
// stored yet, e.g. from before this existed) means the cached flight list
// is from an older dataset, so we throw it away and regenerate — instead
// of silently keeping a stale, narrower flight list forever.
const FLIGHTS_SEED_VERSION = 2;

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

// Great-circle distance between two airports, in kilometers.
function distanceKm(a, b) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pad2(n) { return String(n).padStart(2, '0'); }
function fmtTime(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}
function fmtDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${pad2(m)}m` : `${h}h`;
}

// Builds a full route network: every ordered pair of airports gets 4-5
// flights, with distance-based duration/pricing and timezone-aware arrival
// times. This is generated rather than hand-written since it covers all
// 40 airports x 39 destinations (~1,500 routes, ~7,000 flights).
function seedFlights() {
  const today = new Date();
  const d = (offset) => {
    const t = new Date(today); t.setDate(t.getDate() + offset);
    return t.toISOString().slice(0, 10);
  };

  const flights = [];
  let counter = 100;
  const dateOffsets = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 25, 28];
  const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (const from of airports) {
    for (const to of airports) {
      if (from.code === to.code) continue;

      const km = distanceKm(from, to);
      const avgSpeedKmh = 830;
      const durationMins = Math.round((km / avgSpeedKmh) * 60 + 35); // + taxi/climb/descent buffer
      const tzDiffMins = Math.round((to.tz - from.tz) * 60);

      // Base fare: linear per-km cost plus a long-haul surcharge so
      // international routes price up realistically while domestic
      // hops stay cheap.
      const surcharge = km > 3000 ? 8000 + (km - 3000) * 1.0 : 0;
      const baseFare = 3200 + km * 3.6 + surcharge;
      const routeJitter = 0.9 + ((from.code.charCodeAt(0) + to.code.charCodeAt(1)) % 5) * 0.05;

      const flightCount = (from.code.charCodeAt(2) + to.code.charCodeAt(0)) % 2 === 0 ? 5 : 4;

      for (let i = 0; i < flightCount; i++) {
        counter += 1;
        const departHour = (5 + i * 4 + (from.code.charCodeAt(0) % 4)) % 24;
        const departMinute = [0, 15, 30, 45][(i + to.code.charCodeAt(1)) % 4];
        const departMins = departHour * 60 + departMinute;
        const arriveMins = departMins + durationMins + tzDiffMins;

        const economyPrice = Math.round((baseFare * routeJitter * (0.94 + i * 0.03)) / 100) * 100;
        const businessMultiplier = 2.3 + ((i + from.code.charCodeAt(1)) % 6) * 0.1;
        const businessPrice = Math.round((economyPrice * businessMultiplier) / 100) * 100;

        const seatsBooked = [];
        const bookedCount = (i + from.code.charCodeAt(0) + to.code.charCodeAt(2)) % 4 === 0 ? 2 : ((i + to.code.charCodeAt(0)) % 3 === 0 ? 1 : 0);
        for (let s = 0; s < bookedCount; s++) {
          const row = 1 + ((counter + s * 3) % 9);
          const letter = seatLetters[(counter + s * 2) % seatLetters.length];
          seatsBooked.push(`${row}${letter}`);
        }

        flights.push({
          id: uid('fl'),
          flightNo: `SL ${counter}`,
          from: from.code,
          to: to.code,
          fromCity: from.city,
          toCity: to.city,
          departDate: d(dateOffsets[counter % dateOffsets.length]),
          departTime: fmtTime(departMins),
          arriveTime: fmtTime(arriveMins),
          duration: fmtDuration(durationMins),
          economyPrice,
          businessPrice,
          seatsBooked,
        });
      }
    }
  }

  return flights;
}

export function AppProvider({ children }) {
  // Older accounts (created before the admin area existed) get safe defaults.
  const [users, setUsers] = useState(() =>
    load(LS_USERS, []).map((u) => ({ role: 'user', status: 'active', createdAt: null, lastLoginAt: null, ...u }))
  );
  const [audit, setAudit] = useState(() => load(LS_AUDIT, []));
  const [messages, setMessages] = useState(() => load(LS_MESSAGES, []));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load(LS_SETTINGS, {}) }));
  const [flights, setFlights] = useState(() => {
    const cachedVersion = load(LS_FLIGHTS_VERSION, null);
    const cached = cachedVersion === FLIGHTS_SEED_VERSION ? load(LS_FLIGHTS, null) : null;
    return cached || seedFlights();
  });
  const [bookings, setBookings] = useState(() => load(LS_BOOKINGS, []));
  const [session, setSession] = useState(() => load(LS_SESSION, null));

  // pending booking intent stored while the auth modal interrupts a booking attempt
  const [pendingBooking, setPendingBooking] = useState(null);
  const [authModal, setAuthModal] = useState(null); // 'signin' | 'signup' | null
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => save(LS_USERS, users), [users]);
  useEffect(() => save(LS_FLIGHTS, flights), [flights]);
  useEffect(() => save(LS_FLIGHTS_VERSION, FLIGHTS_SEED_VERSION), []);
  useEffect(() => save(LS_BOOKINGS, bookings), [bookings]);
  useEffect(() => save(LS_SESSION, session), [session]);
  useEffect(() => save(LS_AUDIT, audit), [audit]);
  useEffect(() => save(LS_SETTINGS, settings), [settings]);
  useEffect(() => save(LS_MESSAGES, messages), [messages]);

  function notify(message, tone = 'ok') {
    setToast({ message, tone, key: uid('t') });
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 3800);
  }

  function register({ title, firstName, lastName, email, password, confirmPassword, dob, phone }) {
    if (!firstName || !lastName) return { ok: false, message: 'Please enter your full name.' };
    if (!validateEmail(email)) return { ok: false, message: 'Please enter a valid email address.' };
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, message: 'An account with this email already exists.' };
    }
    if (!validatePhone(phone)) return { ok: false, message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.' };
    if (!dob) return { ok: false, message: 'Please enter your date of birth.' };
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return { ok: false, message: `Password needs ${pwCheck.errors.join(', ')}.` };
    if (password !== confirmPassword) return { ok: false, message: 'Passwords do not match.' };

    const user = {
      id: uid('usr'), title, firstName, lastName, email, password, dob, phone,
      role: 'user', status: 'active', createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, user]);
    setSession({ type: 'user', userId: user.id }); // auto-login right after registering
    return { ok: true, user };
  }

  function login(email, password) {
    const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) return { ok: false, message: 'No account found with that email.' };
    if (user.password !== password) return { ok: false, message: 'Incorrect password.' };
    if (user.status === 'inactive') return { ok: false, message: 'This account has been deactivated. Please contact support.' };
    setSession({ type: 'user', userId: user.id });
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u)));
    if (user.role !== 'user') logAudit('admin.login', { actor: user, target: fullName(user) });
    return { ok: true, user };
  }

  function logout() {
    if (currentUser && currentUser.role !== 'user') logAudit('admin.logout', { target: fullName(currentUser) });
    setSession(null);
    setProfileOpen(false);
  }

  function resetPassword(email, newPassword, confirmPassword) {
    const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) return { ok: false, message: 'No account found with that email.' };
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) return { ok: false, message: `Password needs ${pwCheck.errors.join(', ')}.` };
    if (newPassword !== confirmPassword) return { ok: false, message: 'Passwords do not match.' };
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u)));
    return { ok: true };
  }

  const currentUser = useMemo(() => {
    if (session?.type === 'user') return users.find((u) => u.id === session.userId) || null;
    return null;
  }, [session, users]);

  function searchFlights({ from, to }) {
    const f = (from || '').trim().toUpperCase();
    const t = (to || '').trim().toUpperCase();
    const results = flights.filter((fl) => (!f || fl.from === f) && (!t || fl.to === t));
    return results;
  }

  function seatsTaken(flightId) {
    const fl = flights.find((f) => f.id === flightId);
    return fl ? fl.seatsBooked : [];
  }

  function createBooking({ flightId, cls, seats, passengers, contact, amount }) {
    const flight = flights.find((f) => f.id === flightId);
    if (!flight) return { ok: false, message: 'Flight not found.' };
    const clash = seats.filter((s) => flight.seatsBooked.includes(s));
    if (clash.length) return { ok: false, message: `Seat(s) ${clash.join(', ')} were just taken. Please pick another seat.` };

    const pnr = genPNR();
    const booking = {
      pnr,
      id: uid('bk'),
      userId: currentUser?.id || null,
      flightId,
      cls,
      seats,
      passengers,
      contact,
      amount,
      status: 'Confirmed',
      bookedAt: new Date().toISOString(),
    };
    setFlights((prev) => prev.map((f) => (f.id === flightId ? { ...f, seatsBooked: [...f.seatsBooked, ...seats] } : f)));
    setBookings((prev) => [...prev, booking]);
    return { ok: true, booking };
  }

  function getBookingByPNR(pnr) {
    const found = bookings.find((b) => b.pnr.toUpperCase() === (pnr || '').trim().toUpperCase());
    if (!found) return { ok: false, message: 'No booking found for that PNR.' };
    const flight = flights.find((f) => f.id === found.flightId);
    return { ok: true, booking: found, flight };
  }

  function cancelBooking(bookingId) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (booking.status === 'Cancelled') return { ok: false, message: 'This booking is already cancelled.' };
    const flight = flights.find((f) => f.id === booking.flightId);
    const hrs = flight ? hoursUntil(flight.departDate, flight.departTime) : 999;
    const cutoff = Number(settings.cancellationCutoffHours);
    if (hrs < cutoff) {
      return { ok: false, message: `Cancellation is only allowed up to ${cutoff} hour${cutoff === 1 ? '' : 's'} before departure.` };
    }
    const deductionRate = Number(settings.cancellationFeePercent) / 100;
    const refund = Math.round(booking.amount * (1 - deductionRate));
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled', refund, cancelledAt: new Date().toISOString() } : b)));
    setFlights((prev) => prev.map((f) => (f.id === booking.flightId ? { ...f, seatsBooked: f.seatsBooked.filter((s) => !booking.seats.includes(s)) } : f)));
    return { ok: true, refund };
  }

  function myBookings() {
    if (!currentUser) return [];
    return bookings.filter((b) => b.userId === currentUser.id).sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
  }

  // ------------------------------------------------------------------
  // Admin API. Every function re-checks the caller's permission against the
  // CURRENT stored account, so a stale or hidden UI control cannot bypass it.
  // ------------------------------------------------------------------
  function logAudit(action, { actor, target = '', details = '' } = {}) {
    const a = actor || currentUser;
    const entry = {
      id: uid('log'),
      at: new Date().toISOString(),
      actorId: a?.id || null,
      actorName: a ? fullName(a) : 'System',
      actorRole: a?.role || null,
      action,
      target,
      details,
    };
    setAudit((prev) => [entry, ...prev].slice(0, AUDIT_LIMIT));
  }

  const denied = { ok: false, message: 'You do not have permission to do that.' };
  const activeSupers = (list) => list.filter((u) => u.role === 'superadmin' && u.status !== 'inactive');

  function hasSuperAdmin() {
    return users.some((u) => u.role === 'superadmin');
  }

  // First-run only: creates the initial Super Admin when none exists.
  function setupSuperAdmin({ firstName, lastName, email, password, confirmPassword, phone }) {
    if (hasSuperAdmin()) return { ok: false, message: 'A Super Admin already exists.' };
    if (!firstName?.trim() || !lastName?.trim()) return { ok: false, message: 'Please enter your full name.' };
    if (!validateEmail(email)) return { ok: false, message: 'Please enter a valid email address.' };
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, message: 'An account with this email already exists.' };
    const pw = validatePassword(password);
    if (!pw.valid) return { ok: false, message: `Password needs ${pw.errors.join(', ')}.` };
    if (password !== confirmPassword) return { ok: false, message: 'Passwords do not match.' };
    const user = {
      id: uid('usr'), title: '', firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password,
      dob: '', phone: phone || '', role: 'superadmin', status: 'active',
      createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, user]);
    setSession({ type: 'user', userId: user.id });
    logAudit('admin.setup', { actor: user, target: fullName(user), details: 'Initial Super Admin created' });
    return { ok: true, user };
  }

  function adminSetUserStatus(userId, status) {
    if (!can(currentUser, 'users.status')) return denied;
    if (!['active', 'inactive'].includes(status)) return { ok: false, message: 'Invalid status.' };
    const target = users.find((u) => u.id === userId);
    if (!target) return { ok: false, message: 'User not found.' };
    if (target.id === currentUser.id) return { ok: false, message: 'You cannot change your own account status.' };
    if (target.role !== 'user' && currentUser.role !== 'superadmin') return { ok: false, message: 'Only a Super Admin can change an admin account.' };
    if (status === 'inactive' && target.role === 'superadmin' && activeSupers(users).length <= 1) return { ok: false, message: 'At least one active Super Admin must remain.' };
    if (target.status === status) return { ok: true };
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    logAudit(status === 'active' ? 'user.activate' : 'user.deactivate', { target: `${fullName(target)} <${target.email}>` });
    return { ok: true };
  }

  function adminSetUserRole(userId, role) {
    if (!can(currentUser, 'users.role')) return denied;
    if (!['user', 'admin', 'superadmin'].includes(role)) return { ok: false, message: 'Invalid role.' };
    const target = users.find((u) => u.id === userId);
    if (!target) return { ok: false, message: 'User not found.' };
    if (target.id === currentUser.id) return { ok: false, message: 'You cannot change your own role.' };
    if (target.role === role) return { ok: true };
    if (target.role === 'superadmin' && activeSupers(users).length <= 1) return { ok: false, message: 'At least one active Super Admin must remain.' };
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    logAudit('user.role_change', { target: `${fullName(target)} <${target.email}>`, details: `${target.role} → ${role}` });
    return { ok: true };
  }

  function adminDeleteUser(userId) {
    if (!can(currentUser, 'users.delete')) return denied;
    const target = users.find((u) => u.id === userId);
    if (!target) return { ok: false, message: 'User not found.' };
    if (target.id === currentUser.id) return { ok: false, message: 'You cannot delete your own account.' };
    if (target.role === 'superadmin' && activeSupers(users).length <= 1) return { ok: false, message: 'At least one active Super Admin must remain.' };
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    logAudit('user.delete', { target: `${fullName(target)} <${target.email}>`, details: 'Bookings were kept for record-keeping' });
    return { ok: true };
  }

  function adminUpdateBooking(bookingId, { status, contact }) {
    if (!can(currentUser, 'bookings.manage')) return denied;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    const nextContact = { ...booking.contact };
    if (contact) {
      if (contact.email !== undefined) {
        if (!validateEmail(contact.email)) return { ok: false, message: 'Please enter a valid contact email.' };
        nextContact.email = contact.email.trim();
      }
      if (contact.phone !== undefined) {
        if (!validatePhone(contact.phone)) return { ok: false, message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.' };
        nextContact.phone = contact.phone.replace(/\D/g, '');
      }
    }
    const nextStatus = status || booking.status;
    if (!['Confirmed', 'Cancelled'].includes(nextStatus)) return { ok: false, message: 'Invalid status.' };
    const flight = flights.find((f) => f.id === booking.flightId);
    if (nextStatus !== booking.status) {
      if (nextStatus === 'Confirmed') {
        const clash = flight ? booking.seats.filter((s) => flight.seatsBooked.includes(s)) : [];
        if (!flight) return { ok: false, message: 'The flight for this booking no longer exists.' };
        if (clash.length) return { ok: false, message: `Seat(s) ${clash.join(', ')} are now held by another booking.` };
        setFlights((prev) => prev.map((f) => (f.id === flight.id ? { ...f, seatsBooked: [...f.seatsBooked, ...booking.seats] } : f)));
      } else if (flight) {
        setFlights((prev) => prev.map((f) => (f.id === flight.id ? { ...f, seatsBooked: f.seatsBooked.filter((s) => !booking.seats.includes(s)) } : f)));
      }
    }
    setBookings((prev) => prev.map((b) => {
      if (b.id !== bookingId) return b;
      const next = { ...b, status: nextStatus, contact: nextContact };
      if (nextStatus === 'Cancelled' && b.status !== 'Cancelled') { next.cancelledAt = new Date().toISOString(); next.refund = next.refund ?? 0; }
      if (nextStatus === 'Confirmed') { delete next.cancelledAt; delete next.refund; }
      return next;
    }));
    const changes = [];
    if (nextStatus !== booking.status) changes.push(`status ${booking.status} → ${nextStatus}`);
    if (nextContact.email !== booking.contact?.email || nextContact.phone !== booking.contact?.phone) changes.push('contact details');
    logAudit('booking.update', { target: booking.pnr, details: changes.join(', ') || 'no changes' });
    return { ok: true };
  }

  function adminDeleteBooking(bookingId) {
    if (!can(currentUser, 'bookings.manage')) return denied;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { ok: false, message: 'Booking not found.' };
    if (booking.status === 'Confirmed') {
      setFlights((prev) => prev.map((f) => (f.id === booking.flightId ? { ...f, seatsBooked: f.seatsBooked.filter((s) => !booking.seats.includes(s)) } : f)));
    }
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    logAudit('booking.delete', { target: booking.pnr, details: `${booking.status}, ₹${booking.amount}` });
    return { ok: true };
  }

  function validateFlightInput(data, ignoreId) {
    const flightNo = (data.flightNo || '').trim().toUpperCase();
    const from = (data.from || '').trim().toUpperCase();
    const to = (data.to || '').trim().toUpperCase();
    const fromAp = airports.find((a) => a.code === from);
    const toAp = airports.find((a) => a.code === to);
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!/^[A-Z]{2}\s?\d{1,4}$/.test(flightNo)) return { ok: false, message: 'Flight number should look like "SL 101".' };
    if (flights.some((f) => f.id !== ignoreId && f.flightNo.replace(/\s/g, '') === flightNo.replace(/\s/g, '') && f.departDate === data.departDate)) {
      return { ok: false, message: 'That flight number already exists on this date.' };
    }
    if (!fromAp) return { ok: false, message: 'Pick a valid origin airport code.' };
    if (!toAp) return { ok: false, message: 'Pick a valid destination airport code.' };
    if (from === to) return { ok: false, message: 'Origin and destination must be different.' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.departDate || '') || isNaN(new Date(data.departDate))) return { ok: false, message: 'Enter a valid departure date.' };
    if (!timeRe.test(data.departTime || '') || !timeRe.test(data.arriveTime || '')) return { ok: false, message: 'Times must be in 24-hour HH:MM format.' };
    if (!(data.duration || '').trim()) return { ok: false, message: 'Enter the duration, e.g. "7h 30m".' };
    const eco = Number(data.economyPrice);
    const biz = Number(data.businessPrice);
    if (!Number.isFinite(eco) || eco <= 0) return { ok: false, message: 'Economy price must be greater than 0.' };
    if (!Number.isFinite(biz) || biz <= 0) return { ok: false, message: 'Business price must be greater than 0.' };
    if (biz < eco) return { ok: false, message: 'Business price should not be lower than economy.' };
    const normalizedNo = flightNo.replace(/^([A-Z]{2})\s?/, '$1 ');
    return {
      ok: true,
      clean: {
        flightNo: normalizedNo, from, to, fromCity: fromAp.city, toCity: toAp.city,
        departDate: data.departDate, departTime: data.departTime, arriveTime: data.arriveTime,
        duration: data.duration.trim(), economyPrice: Math.round(eco), businessPrice: Math.round(biz),
      },
    };
  }

  function adminSaveFlight(data, flightId) {
    if (!can(currentUser, 'flights.manage')) return denied;
    const v = validateFlightInput(data, flightId);
    if (!v.ok) return v;
    if (flightId) {
      const existing = flights.find((f) => f.id === flightId);
      if (!existing) return { ok: false, message: 'Flight not found.' };
      const routeChanged = existing.from !== v.clean.from || existing.to !== v.clean.to || existing.departDate !== v.clean.departDate;
      const live = bookings.filter((b) => b.flightId === flightId && b.status === 'Confirmed').length;
      if (routeChanged && live) return { ok: false, message: `${live} confirmed booking(s) exist — route and date can't change. Edit times/prices only.` };
      setFlights((prev) => prev.map((f) => (f.id === flightId ? { ...f, ...v.clean } : f)));
      logAudit('flight.update', { target: v.clean.flightNo, details: `${v.clean.from} → ${v.clean.to}, ${v.clean.departDate}` });
    } else {
      setFlights((prev) => [{ id: uid('fl'), ...v.clean, seatsBooked: [] }, ...prev]);
      logAudit('flight.create', { target: v.clean.flightNo, details: `${v.clean.from} → ${v.clean.to}, ${v.clean.departDate}` });
    }
    return { ok: true };
  }

  function adminDeleteFlight(flightId) {
    if (!can(currentUser, 'flights.manage')) return denied;
    const flight = flights.find((f) => f.id === flightId);
    if (!flight) return { ok: false, message: 'Flight not found.' };
    const live = bookings.filter((b) => b.flightId === flightId && b.status === 'Confirmed').length;
    if (live) return { ok: false, message: `${live} confirmed booking(s) exist for this flight. Cancel them first.` };
    setFlights((prev) => prev.filter((f) => f.id !== flightId));
    logAudit('flight.delete', { target: flight.flightNo, details: `${flight.from} → ${flight.to}, ${flight.departDate}` });
    return { ok: true };
  }

  function adminSaveSettings(patch) {
    if (!can(currentUser, 'settings.basic')) return denied;
    const next = { ...settings };
    const changed = [];
    for (const [k, raw] of Object.entries(patch)) {
      const isBasic = BASIC_SETTING_KEYS.includes(k);
      const isSensitive = SENSITIVE_SETTING_KEYS.includes(k);
      if (!isBasic && !isSensitive) continue;
      if (isSensitive && !can(currentUser, 'settings.sensitive')) {
        if (String(raw) !== String(settings[k])) return { ok: false, message: 'Only a Super Admin can change the cancellation policy.' };
        continue;
      }
      let val = raw;
      if (k === 'businessName') {
        val = String(raw).trim();
        if (val.length < 2 || val.length > 60) return { ok: false, message: 'Business name must be 2–60 characters.' };
      } else if (k === 'supportEmail') {
        val = String(raw).trim();
        if (val && !validateEmail(val)) return { ok: false, message: 'Enter a valid support email.' };
      } else if (k === 'supportPhone') {
        val = String(raw).trim();
        if (val && !/^[0-9+()\-\s]{7,20}$/.test(val)) return { ok: false, message: 'Enter a valid support phone number.' };
      } else if (k === 'businessAddress') {
        val = String(raw).trim().slice(0, 200);
      } else if (k.startsWith('notify')) {
        val = !!raw;
      } else if (k === 'cancellationFeePercent') {
        val = Number(raw);
        if (!Number.isFinite(val) || val < 0 || val > 100) return { ok: false, message: 'Cancellation fee must be between 0 and 100%.' };
      } else if (k === 'cancellationCutoffHours') {
        val = Number(raw);
        if (!Number.isFinite(val) || val < 0 || val > 720) return { ok: false, message: 'Cancellation cutoff must be between 0 and 720 hours.' };
      }
      if (val !== settings[k]) { next[k] = val; changed.push(k); }
    }
    if (!changed.length) return { ok: true, unchanged: true };
    setSettings(next);
    logAudit('settings.update', { target: 'Application settings', details: changed.map((k) => `${k}: ${JSON.stringify(settings[k])} → ${JSON.stringify(next[k])}`).join('; ') });
    return { ok: true };
  }

  // Public contact form. Messages are stored locally and shown in Admin → Messages.
  const TOPICS = ['Booking help', 'Cancellations & refunds', 'Feedback', 'Other'];
  function sendContactMessage({ name, email, topic, message, website }) {
    if (website) return { ok: true, ref: 'SL-0000' }; // honeypot: bots fill the hidden field, so drop silently
    if (!name?.trim() || name.trim().length < 2) return { ok: false, message: 'Please enter your name.' };
    if (!validateEmail(email)) return { ok: false, message: 'Please enter a valid email address.' };
    if (!TOPICS.includes(topic)) return { ok: false, message: 'Please choose a topic.' };
    const text = (message || '').trim();
    if (text.length < 10) return { ok: false, message: 'Please write at least 10 characters.' };
    if (text.length > 1500) return { ok: false, message: 'Messages are limited to 1,500 characters.' };
    const recent = messages.filter((m) => m.email.toLowerCase() === email.trim().toLowerCase() && Date.now() - new Date(m.at).getTime() < 3600000);
    if (recent.length >= 3) return { ok: false, message: 'You have sent several messages recently. Please wait a while before sending another.' };
    const ref = `SL-${Math.floor(1000 + Math.random() * 9000)}`;
    setMessages((prev) => [{ id: uid('msg'), ref, at: new Date().toISOString(), name: name.trim(), email: email.trim(), topic, message: text, status: 'new', userId: currentUser?.id || null }, ...prev].slice(0, 500));
    return { ok: true, ref };
  }

  function adminSetMessageStatus(id, status) {
    if (!can(currentUser, 'messages.manage')) return denied;
    if (!['new', 'resolved'].includes(status)) return { ok: false, message: 'Invalid status.' };
    const m = messages.find((x) => x.id === id);
    if (!m) return { ok: false, message: 'Message not found.' };
    setMessages((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    logAudit('message.update', { target: m.ref, details: `status → ${status}` });
    return { ok: true };
  }

  function adminDeleteMessage(id) {
    if (!can(currentUser, 'messages.manage')) return denied;
    const m = messages.find((x) => x.id === id);
    if (!m) return { ok: false, message: 'Message not found.' };
    setMessages((prev) => prev.filter((x) => x.id !== id));
    logAudit('message.delete', { target: m.ref, details: m.topic });
    return { ok: true };
  }

  const value = {
    messages, contactTopics: TOPICS, sendContactMessage, adminSetMessageStatus, adminDeleteMessage,
    audit, settings, hasSuperAdmin, setupSuperAdmin,
    adminSetUserStatus, adminSetUserRole, adminDeleteUser,
    adminUpdateBooking, adminDeleteBooking, adminSaveFlight, adminDeleteFlight, adminSaveSettings,
    users, flights, bookings, session, currentUser,
    pendingBooking, setPendingBooking,
    authModal, setAuthModal,
    enquiryOpen, setEnquiryOpen,
    profileOpen, setProfileOpen,
    toast, notify,
    register, login, logout, resetPassword,
    searchFlights, seatsTaken, createBooking, getBookingByPNR, cancelBooking,
    myBookings,
    fareFor,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
