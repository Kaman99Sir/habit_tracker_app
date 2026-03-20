import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiAuth } from '../api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token provided in the URL.');
      return;
    }

    apiAuth.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error');
        setErrorMsg(err.message || 'Verification failed. The link may be expired or invalid.');
      });
  }, [token]);

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      
      {status === 'loading' && (
        <>
          <h1 style={{ fontSize: 24, color: 'var(--text-primary)' }}>Verifying Email...</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Please wait while we verify your account.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 8 }}>Email Verified!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Your email address has been successfully verified.</p>
          <Link to="/" style={{
            padding: '12px 24px', background: 'var(--color-teal)', color: '#fff',
            border: 'none', borderRadius: 8, textDecoration: 'none', fontWeight: 600
          }}>
            Go to Dashboard
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 8 }}>Verification Failed</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>{errorMsg}</p>
          <Link to="/login" style={{
            padding: '12px 24px', background: 'var(--bg-elevated)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', fontWeight: 500
          }}>
            Return to Login
          </Link>
        </>
      )}

    </div>
  );
}
