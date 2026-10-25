import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { destinations } from '../data/destinations';
import { useReveal } from '../lib/useReveal';
import DestinationModal from './DestinationModal';
import { useT } from '../i18n';

export default function Destinations() {
  const t = useT();
  const [headerRef, headerVisible] = useReveal({ amount: 0.2 });
  const [active, setActive] = useState(null);

  function goToFlights() {
    setActive(null);
    const el = document.getElementById('flights');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="destinations" id="destinations">
      <div
        ref={headerRef}
        className={`destinations__header reveal ${headerVisible ? 'reveal--visible' : ''}`}
      >
        <div>
          <span className="label-eyebrow">{t('02 / Destinations')}</span>
          <h2 className="destinations__title">
            {t('Go somewhere')}<br /><em>{t('unforgettable.')}</em>
          </h2>
        </div>
        <p className="destinations__subtitle">{t('Routes worth taking. Cities worth staying for. Tap a photo to explore the city.')}</p>
      </div>

      <div className="destinations__grid">
        {destinations.map((d, i) => (
          <DestinationCard key={d.city} destination={d} index={i} onOpen={() => setActive(d)} />
        ))}
      </div>

      <DestinationModal destination={active} onClose={() => setActive(null)} onBook={goToFlights} />
    </section>
  );
}

function DestinationCard({ destination: d, index, onOpen }) {
  const t = useT();
  const [ref, visible] = useReveal({ amount: 0.2 });
  return (
    <button
      type="button"
      ref={ref}
      onClick={onOpen}
      style={{ transitionDelay: `${Math.min(index * 0.08, 0.32)}s` }}
      className={`destination-card ${d.span} reveal ${visible ? 'reveal--visible' : ''}`}
    >
      <span className="destination-card__hint"><Eye size={12} /> {t('View spots')}</span>
      <div className="destination-card__bg" style={{ backgroundImage: `url(${d.image})` }} />
      <div className="destination-card__gradient" />
      <div className="destination-card__content">
        <span className="destination-card__code">{d.code}</span>
        <h3 className="destination-card__city">
          {t(d.city)}
        </h3>
        <b className="destination-card__price">{t(d.price)}</b>
      </div>
    </button>
  );
}
