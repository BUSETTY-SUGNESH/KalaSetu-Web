'use client';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span className={styles.logoText}>Kala<span>Setu</span></span>
        </div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue your art journey</p>

        <form className={styles.form} onSubmit={e => e.preventDefault()}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" className="input-field" placeholder="you@example.com" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" className="input-field" placeholder="••••••••" />
          </div>
          <div className={styles.options}>
            <label className={styles.checkbox}><input type="checkbox" /> Remember me</label>
            <a href="#" className={styles.forgotLink}>Forgot password?</a>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Sign In</button>
        </form>

        <div className={styles.divider}><span>or continue with</span></div>
        <div className={styles.socials}>
          <button className={`btn btn-ghost ${styles.socialBtn}`}>Google</button>
          <button className={`btn btn-ghost ${styles.socialBtn}`}>GitHub</button>
        </div>

        <p className={styles.switchAuth}>Don&apos;t have an account? <Link href="/signup" className={styles.switchLink}>Sign Up</Link></p>
      </div>
    </div>
  );
}
