'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  if (authLoading) return <div className="container" style={{ padding: '4rem' }}>Loading account...</div>;
  if (!user) return <div className="container" style={{ padding: '4rem' }}>Please <Link href="/login" style={{ color: 'var(--saffron)' }}>sign in</Link> to view your dashboard.</div>;

  const quickActions = [
    { icon: '📦', label: 'My Orders', href: '/orders', count: orders.length },
    { icon: '❤️', label: 'Wishlist', href: '/wishlist', count: 0 },
    { icon: '💰', label: 'Wallet', href: '/wallet', balance: '₹0' },
    { icon: '💬', label: 'Messages', href: '/messages', count: 0 },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.header}>
        <h1 className="section-title">Welcome, <span>{user.name}</span></h1>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 className="section-title" style={{ fontSize: '1.4rem' }}>Recent <span>Orders</span></h2>
          <Link href="/orders" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>View All</Link>
        </div>

        {loading ? (
          <div>Loading orders...</div>
        ) : orders.length > 0 ? (
          <div className={styles.orderTable}>
            <div className={styles.orderHeader}>
              <span>Order ID</span>
              <span>Artwork</span>
              <span>Status</span>
              <span>Date</span>
              <span>Amount</span>
            </div>
            {orders.map(order => (
              <div key={order.id} className={styles.orderRow}>
                <span className={styles.orderId}>{order.id.slice(0, 8)}</span>
                <span className={styles.orderTitle}>{order.artwork?.title}</span>
                <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
                <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className={styles.orderAmount}>₹{order.totalAmount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)' }}>You haven&apos;t placed any orders yet.</p>
            <Link href="/explore" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Explore Art</Link>
          </div>
        )}
      </section>
    </div>
  );
}
