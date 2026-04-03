'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/page.module.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'BUYER' | 'ARTIST'>('BUYER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      const dest = user.role === 'ARTIST' ? '/artist-dashboard' : '/';
      router.replace(dest);
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await signup({ name, email, password, role });
      router.push(created.role === 'ARTIST' ? '/artist-dashboard' : '/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
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
        <h1 className={styles.title}>Join KalaSetu</h1>
        <p className={styles.subtitle}>Create your account and discover Indian art</p>

        {error && <p style={{ color: 'var(--saffron)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              className="input-field" 
              placeholder="Your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              placeholder="Min 8 characters" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="role">I am a</label>
            <select 
              id="role" 
              className="input-field" 
              value={role}
              onChange={(e) => setRole(e.target.value as 'BUYER' | 'ARTIST')}
            >
              <option value="BUYER">Buyer / Art lover</option>
              <option value="ARTIST">Artist / Seller</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}><span>or continue with</span></div>
        <div className={styles.socials}>
          <button className={`btn btn-ghost ${styles.socialBtn}`}>Google</button>
          <button className={`btn btn-ghost ${styles.socialBtn}`}>GitHub</button>
        </div>

        <p className={styles.switchAuth}>Already have an account? <Link href="/login" className={styles.switchLink}>Sign In</Link></p>
      </div>
    </div>
  );
}
