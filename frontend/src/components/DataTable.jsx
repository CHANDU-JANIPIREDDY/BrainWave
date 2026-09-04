import React, { useMemo, useState } from 'react';
import EmptyState from './EmptyState.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatEmpty } from '../utils/format.js';

function compareValues(a, b) {
  const left = a ?? '';
  const right = b ?? '';
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

function renderCell(column, row) {
  const value = row[column.key];
  if (column.render) return column.render(value, row);
  if (column.type === 'status') return <StatusBadge value={value} />;
  if (column.truncate) {
    const text = formatEmpty(value);
    return (
      <span className="cell-truncate" title={text === '—' ? undefined : text}>
        {text}
      </span>
    );
  }
  return formatEmpty(value);
}

export default function DataTable({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
  emptyAction,
  searchable = true,
  searchPlaceholder = 'Search',
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = !needle
      ? [...rows]
      : rows.filter((row) =>
          columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(needle)),
        );

    if (!sortKey) return next;
    next.sort((a, b) => {
      const result = compareValues(a[sortKey], b[sortKey]);
      return sortDir === 'asc' ? result : -result;
    });
    return next;
  }, [columns, query, rows, sortDir, sortKey]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  }

  if (!rows.length) {
    return (
      <EmptyState
        title={emptyTitle || 'No records yet'}
        description={emptyDescription || 'There is no data to display from the current workspace.'}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="panel table-card">
      {searchable && (
        <div className="table-toolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          <span className="muted" style={{ fontSize: 12 }}>
            {filtered.length} of {rows.length}
          </span>
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  <button className="th-sort" type="button" onClick={() => toggleSort(column.key)}>
                    {column.label}
                    {sortKey === column.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr key={row.id || row.leadId || row.ticketId || row.invoiceId || row.employeeId || index}>
                {columns.map((column) => (
                  <td key={column.key}>{renderCell(column, row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <EmptyState title="No matching rows" description="Try a different search term." />
      )}
    </div>
  );
}
