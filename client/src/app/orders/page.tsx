import styles from '../dashboard/page.module.css';

export default function OrdersPage() {
  const orders = [
    { id: 'ORD-001', title: 'Ethereal Dawn', artist: 'Priya Sharma', status: 'Shipped', date: 'Mar 25, 2026', amount: '₹24,500', tracking: 'IN123456789' },
    { id: 'ORD-002', title: 'Digital Mandala', artist: 'Ananya Patel', status: 'Delivered', date: 'Mar 18, 2026', amount: '₹12,000', tracking: 'IN987654321' },
    { id: 'ORD-003', title: 'Neon Ganesha', artist: 'Ananya Patel', status: 'Confirmed', date: 'Mar 28, 2026', amount: '₹8,500', tracking: null },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Orders</span></h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>{orders.length} orders</p>

      <div className={styles.orderTable}>
        <div className={styles.orderHeader}>
          <span>Order ID</span><span>Artwork</span><span>Status</span><span>Date</span><span>Amount</span>
        </div>
        {orders.map(o => (
          <div key={o.id} className={styles.orderRow}>
            <span className={styles.orderId}>{o.id}</span>
            <span>{o.title}</span>
            <span className={`badge ${o.status === 'Shipped' ? 'badge-saffron' : o.status === 'Delivered' ? 'badge-teal' : 'badge-purple'}`}>{o.status}</span>
            <span className={styles.orderDate}>{o.date}</span>
            <span className={styles.orderAmount}>{o.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
