import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

function message(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export default function Login() {
  const { sendCode, verifyCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await sendCode(email);
      setStep('code');
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyCode(email, code);
      // On success the auth state changes and the app replaces this view.
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo" aria-hidden>
          📚
        </div>
        <h1>Anna's Pages</h1>

        {step === 'email' ? (
          <form className="form" onSubmit={handleSend}>
            <p className="login-text">
              Enter your email and we'll send you a 6-digit sign-in code.
            </p>
            <label className="field">
              <span>Email</span>
              <input
                className="input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={busy}
            >
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleVerify}>
            <p className="login-text">
              Enter the 6-digit code sent to <strong>{email}</strong>.
            </p>
            <label className="field">
              <span>Sign-in code</span>
              <input
                className="input"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={busy}
            >
              {busy ? 'Verifying…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="btn btn-block"
              disabled={busy}
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        {error && <p className="hint import-error">{error}</p>}
      </div>
    </div>
  );
}
