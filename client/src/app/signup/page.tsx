'use client';
import Link from 'next/link';
import styles from '../login/page.module.css';

export default function SignupPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span className={styles.logoText}>Kala<span>Setu</span></span>
        </div>
        <h1 className={styles.title}>Join KalaSetu</h1>
        <p className={styles.subtitle}>Create your account and discover Indian art</p>

        <form className={styles.form} onSubmit={e => e.preventDefault()}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" className="input-field" placeholder="Your name" />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" className="input-field" placeholder="you@example.com" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" className="input-field" placeholder="Min 8 characters" />
          </div>
          <div className="input-group">
            <label htmlFor="role">I am a</label>
            <select id="role" className="input-field" defaultValue="CUSTOMER">
              <option value="CUSTOMER">Art Lover / Buyer</option>
              <option value="ARTIST">Artist</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Create Account</button>
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
