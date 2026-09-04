import React from 'react';

export function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card">
          <SkeletonBlock className="skeleton-title" />
          <SkeletonBlock className="skeleton-card" style={{ marginTop: 12 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div className="panel">
      <SkeletonBlock className="skeleton-row" style={{ width: '32%' }} />
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonBlock key={index} className="skeleton-row" />
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div>
      <SkeletonBlock className="skeleton-title" style={{ marginBottom: 16 }} />
      <SkeletonCards count={4} />
      <div style={{ height: 16 }} />
      <SkeletonTable />
    </div>
  );
}
