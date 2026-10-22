import React, { useState } from 'react';
import { ArrowRight, Compass, HeartHandshake, Plus, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useReveal } from '../lib/useReveal';

const items = [
  {
    id: '01',
    icon: SlidersHorizontal,
    title: 'Smarter Search',
    summary: 'Compare routes, schedules, and fares in one calm interface.',
    points: ['Live fares across Economy and Business in a single search', 'Round trip, one way, or multi-city in the same flow'],
  },
  {
    id: '02',
    icon: Compass,
    title: 'Flexible Journeys',
    summary: 'Choose the itinerary and cabin experience that fits you.',
    points: ['Swap airports and dates without starting over', 'Pick your own seat from an interactive cabin map', 'Adjust passenger count up to six travellers'],
  },
  {
    id: '03',
    icon: HeartHandshake,
    title: 'Seamless Support',
    summary: 'Help when you need it, from booking to arrival.',
    points: ['Track or cancel any trip with just your PNR', 'Refunds calculated automatically on cancellation', 'A dedicated account for every itinerary you book'],
  },
];

export default function WhySkyLink() {
  const app = useApp();
  const [active, setActive] = useState(0);
  const [headerRef, headerVisible] = useReveal({ amount: 0.2 });
  const [ctaRef, ctaVisible] = useReveal({ amount: 0.3 });

  return (
    <>
      <section className="why" id="experience">
        <div ref={headerRef} className={`reveal ${headerVisible ? 'reveal--visible' : ''}`}>
          <span className="why__eyebrow">04 / The SkyLink Way</span>
          <h2 className="why__title">
            Travel, thoughtfully<br /><em>connected.</em>
          </h2>
        </div>

        <div className="why__grid">
          {items.map((item, i) => {
            const Icon = item.icon;
            const isOpen = active === i;
            return (
              <WhyCard
                key={item.id}
                item={item}
                Icon={Icon}
                index={i}
                isOpen={isOpen}
                onToggle={() => setActive(isOpen ? -1 : i)}
              />
            );
          })}
        </div>
      </section>

      <section className="cta">
        <div className="cta__glow" />
        <div ref={ctaRef} className={`cta__content reveal ${ctaVisible ? 'reveal--visible' : ''}`}>
          <span className="label-eyebrow">Secure Booking &middot; Flexible Options &middot; Global Destinations</span>
          <h2 className="cta__title">
            Less time planning.<br /><em>More time going.</em>
          </h2>
          <p className="cta__subtitle">
            SkyLink brings modern flight discovery and reservation into one seamless experience.
          </p>
          <div className="cta__actions">
            <a href="#flights" className="btn-primary">Search Flights <ArrowRight size={15} /></a>
            <button className="btn-outline" onClick={() => app.setEnquiryOpen(true)}>Track a Booking</button>
          </div>
        </div>
      </section>
    </>
  );
}

function WhyCard({ item, Icon, index, isOpen, onToggle }) {
  const [ref, visible] = useReveal({ amount: 0.2 });
  return (
    <button
      type="button"
      ref={ref}
      onClick={onToggle}
      style={{ transitionDelay: `${index * 0.08}s` }}
      className={`why-card ${isOpen ? 'why-card--open' : ''} reveal ${visible ? 'reveal--visible' : ''}`}
    >
      <div className="why-card__top">
        <span className="why-card__icon">
          <Icon size={19} />
        </span>
        <span className="why-card__id">{item.id}</span>
      </div>
      <h3 className="why-card__title">{item.title}</h3>
      <p className="why-card__summary">{item.summary}</p>

      <div className={`why-card__details ${isOpen ? 'why-card__details--open' : ''}`}>
        <div>
          <ul className="why-card__points">
            {item.points.map((p) => (
              <li key={p} className="why-card__point">
                <ArrowRight size={13} className="icon-ice" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <span className="why-card__toggle">
        <Plus size={14} className={`why-card__toggle-icon ${isOpen ? 'why-card__toggle-icon--open' : ''}`} />
        {isOpen ? 'Show less' : 'Learn more'}
      </span>
    </button>
  );
}
