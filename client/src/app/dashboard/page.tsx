import Link from 'next/link';
import styles from './page.module.css';

export default function DashboardPage() {
  const quickActions = [
    { icon: '📦', label: 'Orders', href: '/orders', count: 3 },
    { icon: '❤️', label: 'Wishlist', href: '/wishlist', count: 5 },
    { icon: '💰', label: 'Wallet', href: '/wallet', balance: '₹2,450' },
    { icon: '💬', label: 'Messages', href: '/messages', count: 2 },
  ];

  const recentOrders = [
    { id: 'ORD-001', title: 'Ethereal Dawn', status: 'Shipped', date: 'Mar 25, 2026', amount: '₹24,500' },
    { id: 'ORD-002', title: 'Digital Mandala', status: 'Delivered', date: 'Mar 18, 2026', amount: '₹12,000' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.header}>
        <h1 className="section-title">Welcome, <span>User</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Here&apos;s what&apos;s happening with your account</p>
      </div>

      <div className={styles.quickGrid}>
        {quickActions.map(a => (
          <Link key={a.label} href={a.href} className={styles.quickCard}>
            <span className={styles.quickIcon}>{a.icon}</span>
            <span className={styles.quickLabel}>{a.label}</span>
            <span className={styles.quickValue}>{'balance' in a ? a.balance : `${a.count} items`}</span>
          </Link>
        ))}
      </div>

      <section style={{ marginTop: 'var(--space-2xl)' }}>
        <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Recent <span>Orders</span></h2>
        <div className={styles.orderTable}>
          <div className={styles.orderHeader}>
            <span>Order ID</span><span>Artwork</span><span>Status</span><span>Date</span><span>Amount</span>
          </div>
          {recentOrders.map(o => (
            <div key={o.id} className={styles.orderRow}>
              <span className={styles.orderId}>{o.id}</span>
              <span>{o.title}</span>
              <span className={`badge ${o.status === 'Shipped' ? 'badge-saffron' : 'badge-teal'}`}>{o.status}</span>
              <span className={styles.orderDate}>{o.date}</span>
              <span className={styles.orderAmount}>{o.amount}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
