import React from 'react';
import { IconInbox } from './icons.jsx';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="state panel">
      <div className="state-icon">{icon || <IconInbox />}</div>
      <h3>{title || 'Nothing to display'}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
