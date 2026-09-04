export const TOKEN_KEY = 'brainwave_token';
export const SESSION_REASON_KEY = 'brainwave_session_reason';

export function markSessionExpired() {
  sessionStorage.setItem(SESSION_REASON_KEY, 'expired');
}

export function consumeSessionReason() {
  const reason = sessionStorage.getItem(SESSION_REASON_KEY);
  sessionStorage.removeItem(SESSION_REASON_KEY);
  return reason;
}
