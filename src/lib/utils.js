import { getLang } from '../i18n';

// Shared helpers: id/PNR generation, validation, pricing, seat maps, dates.

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function genPNR() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'SK';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function formatINR(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

// Password must be 8+ chars, alphanumeric, at least one uppercase and one special char.
export function validatePassword(pwd) {
  const errors = [];
  if (!pwd || pwd.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(pwd || '')) errors.push('one uppercase letter');
  if (!/[0-9]/.test(pwd || '')) errors.push('one number');
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pwd || '')) errors.push('one special character');
  return { valid: errors.length === 0, errors };
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

export function validatePhone(phone) {
  // Indian mobile numbers: 10 digits, first digit 6, 7, 8 or 9.
  return /^[6-9][0-9]{9}$/.test((phone || '').replace(/\D/g, ''));
}


export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateInput(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(getLang() === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function combineDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

export function hoursUntil(dateStr, timeStr) {
  const dep = combineDateTime(dateStr, timeStr);
  return (dep.getTime() - Date.now()) / 36e5;
}

// Builds a fixed seat map: rows 1-2 Business (A-D), rows 3-8 Economy (A-D).
export function buildSeatLayout() {
  const rows = [1, 2, 3, 4, 5, 6, 7, 8];
  const cols = ['A', 'B', 'C', 'D'];
  const seats = [];
  rows.forEach((r) => {
    cols.forEach((c) => {
      seats.push({ id: `${r}${c}`, row: r, col: c, cls: r <= 2 ? 'Business' : 'Economy' });
    });
  });
  return seats;
}

export function seatsForClass(cls) {
  return buildSeatLayout().filter((s) => s.cls === cls);
}

export function fareFor(flight, cls) {
  return cls === 'Business' ? flight.businessPrice : flight.economyPrice;
}

export function totalPassengers(p) {
  return (p.adults || 0) + (p.children || 0) + (p.infants || 0);
}
