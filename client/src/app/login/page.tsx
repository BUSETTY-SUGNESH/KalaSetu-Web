'use client';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };
const handleGoogleLogin = async () => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/dashboard'
      }
    });
  } catch (err) {
    console.error(err);
    setError('Google login failed');
  }
};

const handleGithubLogin = async () => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'http://localhost:3000/dashboard'
      }
    });
  } catch (err) {
    console.error(err);
    setError('GitHub login failed');
  }
};
  if (authLoading || user) {
    return <div className="container" style={{ padding: '4rem' }}>Preparing your account...</div>;
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span className={styles.logoText}>Kala<span>Setu</span></span>
        </div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue your art journey</p>

        {error && <p style={{ color: 'var(--saffron)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
        {forgotMsg && <p style={{ color: 'var(--teal-light)', textAlign: 'center', marginBottom: '1rem', fontSize: '0.875rem' }}>{forgotMsg}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              className="input-field" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.options}>
            <label className={styles.checkbox}><input type="checkbox" /> Remember me</label>
            <button
              type="button"
              className={styles.forgotLink}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setForgotMsg(email ? `A reset link will be sent to ${email} once this feature is enabled.` : 'Enter your email address first, then click Forgot password.')}
            >Forgot password?</button>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.divider}><span>or continue with</span></div>
        <div className={styles.socials}>
  <button
    type="button"
    className={`btn btn-ghost ${styles.socialBtn}`}
    onClick={handleGoogleLogin}
  >
    Continue with Google
  </button>

  <button
    type="button"
    className={`btn btn-ghost ${styles.socialBtn}`}
    onClick={handleGithubLogin}
  >
    Continue with GitHub
  </button>
</div>

        <p className={styles.switchAuth}>Don&apos;t have an account? <Link href="/signup" className={styles.switchLink}>Sign Up</Link></p>
      </div>
    </div>
  );
}
