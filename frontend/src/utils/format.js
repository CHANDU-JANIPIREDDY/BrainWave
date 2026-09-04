export function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function displayName(user) {
  return user?.username || 'there';
}

export function initials(value) {
  const parts = String(value || '')
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  const letters = ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
  return letters || 'U';
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+') && digits.length >= 10) return raw;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

export function formatEmpty(value) {
  const text = value === undefined || value === null ? '' : String(value).trim();
  return text || '—';
}

export function countMatching(rows, key, matcher) {
  return rows.filter((row) => matcher(String(row?.[key] || ''))).length;
}

export function uniqueValues(rows, key) {
  return new Set(rows.map((row) => String(row?.[key] || '').trim()).filter(Boolean));
}

export function statusTone(value) {
  const text = String(value || '').toLowerCase();
  if (!text) return 'neutral';
  if (/(success|qualified|paid|closed|complete|active|operational|healthy|won)/.test(text)) return 'success';
  if (/(fail|error|forbidden|overdue|cancelled|canceled|lost|high|critical|not contacted)/.test(text)) return 'danger';
  if (/(pending|hold|draft|medium|warning|progress)/.test(text)) return 'warning';
  if (/(open|new|contacted|info|low|assigned)/.test(text)) return 'info';
  return 'neutral';
}
