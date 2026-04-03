'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import styles from './page.module.css';

interface DashboardOrder {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  createdAt: string;
  totalAmount: number;
  artwork?: {
    title?: string;
  };
}

const getWishlistKey = (userId: string) => `wishlist:${userId}`;

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my');
        setOrders(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      void fetchOrders();
    }
  }, [user]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      setWishlistCount(0);
      return;
    }

    const raw = window.localStorage.getItem(getWishlistKey(user.id));
    if (!raw) {
      setWishlistCount(0);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      setWishlistCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setWishlistCount(0);
    }
  }, [user]);

  if (authLoading) return <div className="container" style={{ padding: '4rem' }}>Loading account...</div>;
  if (!user) return <div className="container" style={{ padding: '4rem' }}>Please <Link href="/login" style={{ color: 'var(--saffron)' }}>sign in</Link> to view your dashboard.</div>;

  const isArtist = user.role === 'ARTIST';
  const displayRole = user.role === 'CUSTOMER' ? 'BUYER' : user.role;

  const quickActions = [
    ...(isArtist
      ? [{ icon: '🎨', label: 'My listings', href: '/profile?tab=listings', balance: 'Manage in profile' }]
      : [{ icon: '📦', label: 'My Orders', href: '/orders', count: orders.length }]),
    { icon: '❤️', label: 'Wishlist', href: '/wishlist', count: wishlistCount },
    { icon: '💰', label: 'Wallet', href: '/wallet', balance: `Rs ${Number(user.wallet?.balance || 0).toLocaleString('en-IN')}` },
    { icon: '💬', label: 'Charcha', href: '/charcha', balance: 'Open Sabha' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.header}>
        <h1 className="section-title">Welcome, <span>{user.name}</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Here&apos;s what&apos;s happening with your account
          {displayRole && (
            <span style={{ marginLeft: '0.5rem' }}>
              · Role: {displayRole}
            </span>
          )}
        </p>
      </div>

      {isArtist && (
        <div
          style={{
            marginBottom: 'var(--space-xl)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Artist workspace</p>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage listings and track activity from your profile. Use the API or admin tools to publish new artwork.
          </p>
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            <Link href="/profile?tab=listings" className="btn btn-primary btn-sm">View listings</Link>
            <Link href="/profile?tab=wallet" className="btn btn-ghost btn-sm">Earnings & wallet</Link>
          </div>
        </div>
      )}

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}

      <div className={styles.quickGrid}>
        {quickActions.map(a => (
          <Link key={a.label} href={a.href} className={styles.quickCard}>
            <span className={styles.quickIcon}>{a.icon}</span>
            <span className={styles.quickLabel}>{a.label}</span>
            <span className={styles.quickValue}>{'balance' in a ? a.balance : `${a.count} items`}</span>
          </Link>
        ))}
      </div>

      {!isArtist && (
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
                  <span className={styles.orderTitle}>{order.artwork?.title || 'Untitled Artwork'}</span>
                  <span className={`badge ${order.status === 'DELIVERED' ? 'badge-teal' : order.status === 'SHIPPED' ? 'badge-saffron' : 'badge-purple'}`}>{order.status}</span>
                  <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className={styles.orderAmount}>Rs {order.totalAmount.toLocaleString('en-IN')}</span>
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
      )}
    </div>
  );
}
