import React from 'react';
import { formatEmpty, statusTone } from '../utils/format.js';

export default function StatusBadge({ value, tone }) {
  const label = formatEmpty(value);
  if (label === '—') return <span className="muted">—</span>;
  return <span className={`badge badge-${tone || statusTone(label)}`}>{label}</span>;
}
