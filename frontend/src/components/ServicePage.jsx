import React from 'react';
import ErrorState from './ErrorState.jsx';
import { SkeletonCards, SkeletonTable } from './Skeleton.jsx';
import { IconRefresh } from './icons.jsx';

export default function ServicePage({
  title,
  loading,
  error,
  onRefresh,
  stats,
  children,
}) {
  return (
    <div>
      <div className="page-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" type="button" onClick={onRefresh} disabled={loading}>
          <IconRefresh />
          Refresh
        </button>
      </div>

      {loading && (
        <>
          {stats ? <SkeletonCards count={Math.min(stats.length || 4, 4)} /> : null}
          <div style={{ height: 16 }} />
          <SkeletonTable />
        </>
      )}

      {!loading && error && (
        <ErrorState title={`Unable to load ${title}`} message={error} onRetry={onRefresh} />
      )}

      {!loading && !error && (
        <>
          {stats?.length > 0 && (
            <div className="stat-grid" style={{ marginBottom: 18 }}>
              {stats}
            </div>
          )}
          {children}
        </>
      )}
    </div>
  );
}
