'use client';
import styles from './page.module.css';

export default function WalletPage() {
  const transactions = [
    { id: 1, desc: 'Payment for "Ethereal Dawn"', amount: -24500, type: 'debit', date: 'Mar 25, 2026' },
    { id: 2, desc: 'Wallet Top-up', amount: 30000, type: 'credit', date: 'Mar 20, 2026' },
    { id: 3, desc: 'Bid Refund — "Kathak in Motion"', amount: 15000, type: 'credit', date: 'Mar 15, 2026' },
    { id: 4, desc: 'Payment for "Neon Ganesha"', amount: -8500, type: 'debit', date: 'Mar 10, 2026' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Wallet</span></h1>

      <div className={styles.balanceCard}>
        <span className={styles.balanceLabel}>Available Balance</span>
        <span className={styles.balanceAmount}>₹12,000</span>
        <div className={styles.balanceActions}>
          <button className="btn btn-primary">+ Add Funds</button>
          <button className="btn btn-secondary">Withdraw</button>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 'var(--space-xl) 0 var(--space-md)' }}>Transaction History</h2>
      <div className={styles.txnList}>
        {transactions.map(t => (
          <div key={t.id} className={styles.txnItem}>
            <div className={styles.txnIcon}>{t.type === 'credit' ? '↓' : '↑'}</div>
            <div className={styles.txnInfo}>
              <span className={styles.txnDesc}>{t.desc}</span>
              <span className={styles.txnDate}>{t.date}</span>
            </div>
            <span className={`${styles.txnAmount} ${t.type === 'credit' ? styles.credit : styles.debit}`}>
              {t.type === 'credit' ? '+' : ''}₹{Math.abs(t.amount).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
