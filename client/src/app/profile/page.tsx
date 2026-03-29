'use client';
import styles from './page.module.css';

export default function ProfilePage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Profile</span></h1>

      <div className={styles.card}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>U</div>
          <button className="btn btn-secondary btn-sm">Change Photo</button>
        </div>

        <form className={styles.form} onSubmit={e => e.preventDefault()}>
          <div className={styles.row}>
            <div className="input-group"><label>Full Name</label><input className="input-field" defaultValue="Demo User" /></div>
            <div className="input-group"><label>Email</label><input className="input-field" defaultValue="user@example.com" disabled /></div>
          </div>
          <div className={styles.row}>
            <div className="input-group"><label>Phone</label><input className="input-field" defaultValue="+91 98765 43210" /></div>
            <div className="input-group"><label>Location</label><input className="input-field" defaultValue="Mumbai, Maharashtra" /></div>
          </div>
          <div className="input-group"><label>Bio</label><textarea className="input-field" rows={3} defaultValue="Art enthusiast and collector." style={{ resize: 'vertical' }} /></div>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
}
