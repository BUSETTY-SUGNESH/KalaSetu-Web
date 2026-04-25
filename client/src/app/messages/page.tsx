'use client';
import styles from './page.module.css';

export default function MessagesPage() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Messages</span></h1>

      <div className={styles.chatLayout}>
        <div className={styles.convList} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: 'var(--space-xl)', textAlign: 'center' }}>No conversations yet</p>
        </div>

        <div className={styles.chatArea}>
          <div className={styles.chatEmpty}>
            <span style={{ fontSize: '3rem', opacity: 0.3 }}>💬</span>
            <p>Direct messaging is coming soon.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              For now, use the <strong>Charcha Sabha</strong> forum to connect with artists and buyers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
