import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReveal } from '../lib/useReveal';
import { useT } from '../i18n';

export default function FaqSection() {
  const app = useApp();
  const t = useT();
  const [open, setOpen] = useState(0);
  const [ref, visible] = useReveal({ amount: 0.1 });
  const fee = app.settings.cancellationFeePercent;
  const cutoff = app.settings.cancellationCutoffHours;

  // Cancellation answers read the live settings, so they always match the real policy.
  const items = [
    { q: 'How do I book a flight?', a: 'Use the search panel at the top of the page to pick your route, date and travellers, then choose a flight, select your seats, add passenger details and pay. You\'ll get a PNR (booking reference) straight away.' },
    { q: 'How can I find or manage my booking?', a: 'Choose Track Booking in the menu and enter your PNR to view or cancel a booking. If you\'re signed in, My Bookings in your account menu lists every trip you\'ve made.' },
    { q: 'Can I cancel my booking?', a: t('Yes. You can cancel up to {0} {1} before departure. A {2}% cancellation fee is deducted and the rest is refunded. See the full Refund & Cancellation policy for details.', cutoff, t(Number(cutoff) === 1 ? 'hour' : 'hours'), fee) },
    { q: 'What is the difference between Economy and Business?', a: 'Business offers premium seating in a dedicated section of the cabin at a higher fare. You can compare both fares on every flight result and choose your class before selecting seats.' },
    { q: 'Who counts as a child or infant?', a: 'Search lets you add adults, children and infants separately. Each traveller needs a name and age on the passenger details step so your ticket matches their ID.' },
    { q: 'I made a mistake in my contact details. What now?', a: 'Send us a message from the Contact page with your PNR and the correction, and our team will update your booking.' },
    { q: 'Is my data safe?', a: 'We only store what\'s needed to run your bookings and never sell it. Read the Privacy notice for exactly what is stored and how to remove it.' },
  ];

  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div ref={ref} className={`faq__inner reveal ${visible ? 'reveal--visible' : ''}`}>
        <div className="faq__intro">
          <span className="label-eyebrow">{t('05 / Help')}</span>
          <h2 className="faq__title" id="faq-title">{t('Questions,')}<br /><em>{t('answered.')}</em></h2>
          <p className="faq__lead">{t("Can't find what you need? Our team is happy to help.")}</p>
          <a className="btn-outline faq__cta" href="#/contact"><MessageCircle size={14} /> {t('Contact support')}</a>
        </div>
        <ul className="faq__list">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <li key={it.q} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
                <h3>
                  <button type="button" className="faq-item__q" aria-expanded={isOpen} aria-controls={`faq-a-${i}`} id={`faq-q-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                    {t(it.q)}
                    <ChevronDown size={18} className="faq-item__chev" aria-hidden="true" />
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq-item__a"><div><p>{t(it.a)}</p></div></div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
