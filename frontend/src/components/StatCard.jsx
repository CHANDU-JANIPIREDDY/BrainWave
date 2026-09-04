import React from 'react';

export default function StatCard({ label, value, hint, icon }) {
  return (
    <article className="stat-card glass">
      <div className="stat-card-top">
        <span>{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </article>
  );
}
