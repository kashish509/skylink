import React from 'react';
import { ShieldCheck, Sparkles, Star } from 'lucide-react';
import heroImage from '../assets/skylink-hero.png';

const stats = [
  { icon: Star, label: '4.8/5 traveller rating' },
  { icon: ShieldCheck, label: 'Secure, instant booking' },
  { icon: Sparkles, label: '120+ routes worldwide' },
];

export default function CinematicHero() {
  return (
    <section className="hero">
      <div className="hero__bg" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="hero__overlay-radial" />
      <div className="hero__overlay-linear" />

      <div className="hero__inner">
        <div className="hero__content anim-fade-in-up">
          <span className="label-eyebrow">SkyLink</span>
          <h1 className="hero__title text-balance">
            Where will you go next?
          </h1>
          <p className="hero__subtitle">
            Search, compare and book flights in seconds &mdash; a calmer, faster way to find your next departure.
          </p>

          <div className="hero__stats anim-fade-in-up" style={{ animationDelay: '0.25s' }}>
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <span key={s.label} className="hero__stat">
                  <Icon size={14} className="icon-ice" /> {s.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
