import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { IconArrow, ServiceGlyph } from './icons.jsx';

export default function ServiceCard({ service, label, description, status, summary, onOpen }) {
  return (
    <article className="service-card glass" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen?.()}>
      <div className="service-card-top">
        <div className="service-mark">
          <ServiceGlyph service={service} />
        </div>
        {status && <StatusBadge value={status} />}
      </div>
      <div>
        <h3>{label}</h3>
        <p>{description}</p>
        {summary && <p>{summary}</p>}
      </div>
      <div className="service-card-foot">
        <span className="muted" style={{ fontSize: 13 }}>Open service</span>
        <span className="service-arrow">
          <IconArrow />
        </span>
      </div>
    </article>
  );
}
