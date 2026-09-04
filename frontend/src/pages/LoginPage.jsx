import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { consumeSessionReason } from '../utils/session.js';
import BrandMark from '../components/BrandMark.jsx';

const REMEMBER_KEY = 'brainwave_remembered_username';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [username, setUsername] = useState(() => localStorage.getItem(REMEMBER_KEY) || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(REMEMBER_KEY)));
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (consumeSessionReason() === 'expired') {
      setInfo('Your session expired. Please sign in again.');
    }
  }, []);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, username);
      else localStorage.removeItem(REMEMBER_KEY);
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-frame">
        <section className="login-hero" aria-label="BrainWave branding">
          <div className="login-hero-content">
            <p className="login-quote">Great teams build extraordinary tomorrows.</p>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-top">
            Welcome to BrainWave
            <span className="login-dash" />
          </div>

          <div className="login-panel-copy">
            <BrandMark size={42} />
            <div className="login-eyebrow" style={{ marginTop: 16 }}>Sign in to your account</div>
            <h2>Good to see you again</h2>
            <p>Sign in to continue to BrainWave</p>
          </div>

          <form onSubmit={onSubmit} className="login-form">
            <label className="login-field">
              <span className="login-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5 19c1.4-3.2 4-5 7-5s5.6 1.8 7 5" />
                </svg>
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Username"
              />
            </label>

            <label className="login-field">
              <span className="login-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Password"
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </label>

            <div className="login-row">
              <label className="login-remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
            </div>

            {info && <div className="muted">{info}</div>}
            {error && <div className="error">{error}</div>}

            <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="login-or">
            <span>or</span>
          </div>

          <p className="login-admin-note">
            Don’t have an account? <strong>Contact your administrator</strong>
          </p>

          <div className="login-copy">
            © 2026 BrainWave. All rights reserved. | Make Every Moment Count.
          </div>
        </section>
      </div>
    </div>
  );
}
