import React from 'react';
import { Plane } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';

export default function Footer() {
  const app = useApp();
  const t = useT();

  function resetDemoData() {
    const ok = window.confirm(t('This clears all locally saved SkyLink data (flights, bookings, and your account) and reloads the app with a fresh dataset. Continue?'));
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
          <p className="site-footer__tagline">{t('Fly further. Live closer.')}</p>
          {(app.settings.supportEmail || app.settings.supportPhone) && (
            <p className="site-footer__tagline">{[app.settings.supportEmail, app.settings.supportPhone].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <nav className="site-footer__nav" aria-label={t('Footer')}>
          <a href="#weather">{t('Weather')}</a>
          <a href="#faq">{t('FAQ')}</a>
          <a href="#/terms">{t('Terms')}</a>
          <a href="#/privacy">{t('Privacy')}</a>
          <a href="#/refunds">{t('Refunds')}</a>
          <a href="#/contact">{t('Contact')}</a>
        </nav>
      </div>
    </footer>
  );
}
