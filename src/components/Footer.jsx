import React from 'react';
import { Plane } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Footer() {
  const app = useApp();

  function resetDemoData() {
    const ok = window.confirm('This clears all locally saved SkyLink data (flights, bookings, and your account) and reloads the app with a fresh dataset. Continue?');
    if (!ok) return;
    try { localStorage.clear(); } catch { /* storage unavailable */ }
    window.location.reload();
  }

  return (
    <footer id="footer" className="site-footer">
      <div className="site-footer__top">
        <div>
          <b className="site-footer__brand">
            <Plane size={16} className="icon-ice" /> {app.settings.businessName}
          </b>
          <p className="site-footer__tagline">Fly further. Live closer.</p>
          {(app.settings.supportEmail || app.settings.supportPhone) && (
            <p className="site-footer__tagline">{[app.settings.supportEmail, app.settings.supportPhone].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <a href="#weather">Weather</a>
          <a href="#faq">FAQ</a>
          <a href="#/terms">Terms</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/refunds">Refunds</a>
          <a href="#/contact">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
