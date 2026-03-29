'use client';
import styles from './page.module.css';

export default function MessagesPage() {
  const conversations = [
    { id: 1, name: 'Priya Sharma', lastMessage: 'Your artwork has been shipped!', time: '2h ago', unread: true, avatar: 'PS' },
    { id: 2, name: 'KalaSetu Support', lastMessage: 'Your verification is complete.', time: '1d ago', unread: false, avatar: 'KS' },
    { id: 3, name: 'Ravi Kumar', lastMessage: 'Thank you for your interest in my sculpture!', time: '3d ago', unread: false, avatar: 'RK' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Messages</span></h1>

      <div className={styles.chatLayout}>
        <div className={styles.convList}>
          {conversations.map(c => (
            <div key={c.id} className={`${styles.convItem} ${c.unread ? styles.unread : ''}`}>
              <div className={styles.convAvatar} style={{ background: `hsl(${c.name.length * 37 % 360}, 45%, 30%)` }}>{c.avatar}</div>
              <div className={styles.convInfo}>
                <span className={styles.convName}>{c.name}</span>
                <span className={styles.convMsg}>{c.lastMessage}</span>
              </div>
              <span className={styles.convTime}>{c.time}</span>
              {c.unread && <span className={styles.unreadDot}/>}
            </div>
          ))}
        </div>

        <div className={styles.chatArea}>
          <div className={styles.chatEmpty}>
            <span style={{ fontSize: '3rem', opacity: 0.3 }}>💬</span>
            <p>Select a conversation to start messaging</p>
          </div>
        </div>
      </div>
    </div>
  );
}
