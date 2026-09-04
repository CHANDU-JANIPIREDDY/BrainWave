import React from 'react';
import { IconAlert } from './icons.jsx';

export default function ErrorState({ title, message, onRetry, retryLabel = 'Try Again' }) {
  return (
    <div className="state panel">
      <div className="state-icon">
        <IconAlert />
      </div>
      <h3>{title || 'Unable to load data'}</h3>
      {message && <p>{message}</p>}
      {onRetry && (
        <button className="btn btn-primary" type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
