import React, { useEffect } from 'react';
import { MapPin, Sparkles, X } from 'lucide-react';

export default function DestinationModal({ destination, onClose, onBook }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!destination) return null;
  const d = destination;

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass modal modal--xl destination-modal anim-pop-in">
        <button className="modal__close" onClick={onClose} aria-label="Close"><X size={18} /></button>

        <div className="destination-modal__cover" style={{ backgroundImage: `url(${d.image})` }}>
          <div className="destination-modal__cover-gradient" />
          <div className="destination-modal__cover-content">
            <span className="destination-modal__code">{d.code}</span>
            <h3 className="destination-modal__city">{d.city}</h3>
            <p className="destination-modal__tagline">{d.tagline}</p>
          </div>
        </div>

        <div className="destination-modal__body">
          <div>
            <div className="destination-modal__section-title">
              <Sparkles size={15} className="icon-ice" /> Why choose {d.city}
            </div>
            <p className="destination-modal__why">{d.why}</p>
          </div>

          <div className="destination-modal__hotspots">
            <div className="destination-modal__section-title">
              <MapPin size={15} className="icon-ice" /> Famous spots around the city
            </div>
            <div className="destination-modal__hotspot-list">
              {d.hotspots.map((h) => (
                <div className="hotspot-card" key={h.name}>
                  <span className="hotspot-card__pin"><MapPin size={14} /></span>
                  <span>
                    <span className="hotspot-card__name">{h.name}</span>
                    <p className="hotspot-card__note">{h.note}</p>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="destination-modal__footer">
            <span className="destination-modal__price-note">Flights to {d.city} <b>{d.price}</b></span>
            <button className="btn-primary" onClick={onBook}>Search Flights</button>
          </div>
        </div>
      </div>
    </div>
  );
}
