'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api, { getApiErrorMessage } from '@/lib/api';
import { Bid } from '@/types';
import styles from '../page.module.css';

interface DashboardOrder {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  artwork?: { title?: string };
}

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [liveBids, setLiveBids] = useState<Bid[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [ordRes, bidRes] = await Promise.allSettled([
        api.get<DashboardOrder[]>('/orders/my'),
        api.get<Bid[]>('/bids/active'),
      ]);
      setOrders(ordRes.status === 'fulfilled' && Array.isArray(ordRes.value.data) ? ordRes.value.data : []);
      setLiveBids(bidRes.status === 'fulfilled' && Array.isArray(bidRes.value.data) ? bidRes.value.data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadData();
  }, [user, loadData]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(`wishlist:${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setWishlistCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch { /* noop */ }
  }, [user]);

  if (authLoading || !user) return <div>Loading...</div>;

  const kycStatus = user.kyc?.status || 'NOT_STARTED';
  const activeOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'SHIPPED', 'IN_PROGRESS'].includes(o.status));
  const totalSpent = orders.filter(o => ['COMPLETED', 'DELIVERED'].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <h1 className="section-title">Welcome, <span>{user.name}</span></h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>Your art collection dashboard</p>
      </div>

      {/* KYC Alert */}
      {kycStatus !== 'VERIFIED' && (
        <div className={`${styles.alertBanner} ${kycStatus === 'PENDING' ? styles.alertWarn : styles.alertError}`}>
          <span style={{ fontSize: '1.2rem' }}>{kycStatus === 'PENDING' ? '⏳' : '⚠️'}</span>
          <div style={{ flex: 1 }}>
            <strong>KYC {kycStatus === 'PENDING' ? 'Under Review' : 'Required'}</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {kycStatus === 'PENDING' ? 'Your identity verification is being processed.' : 'Complete KYC to access bidding and wallet.'}
            </p>
          </div>
          {kycStatus !== 'PENDING' && (
            <Link href="/profile?tab=kyc" className="btn btn-primary btn-sm">Complete KYC</Link>
          )}
        </div>
      )}

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}

      {/* KPI Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardSaffron}`}>
          <span className={styles.statIcon}>📦</span>
          <span className={styles.statValue}>{loading ? '...' : activeOrders.length}</span>
          <span className={styles.statLabel}>Active Orders</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
          <span className={styles.statIcon}>❤️</span>
          <span className={styles.statValue}>{wishlistCount}</span>
          <span className={styles.statLabel}>Wishlist Items</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGold}`}>
          <span className={styles.statIcon}>💰</span>
          <span className={styles.statValue}>₹{Number(user.wallet?.balance || 0).toLocaleString('en-IN')}</span>
          <span className={styles.statLabel}>Wallet Balance</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardTeal}`}>
          <span className={styles.statIcon}>🛒</span>
          <span className={styles.statValue}>₹{loading ? '...' : totalSpent.toLocaleString('en-IN')}</span>
          <span className={styles.statLabel}>Total Spent</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsRow}>
        <Link href="/explore" className="btn btn-primary">🔍 Explore Art</Link>
        <Link href="/bid" className="btn btn-secondary">⚡ Live Bids</Link>
        <Link href="/wishlist" className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>❤️ Wishlist</Link>
        <Link href="/charcha" className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>💬 Charcha</Link>
      </div>

      {/* Two Column: Live Bids + Recent Orders */}
      <div className={styles.twoCol}>
        {/* Live Bids */}
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Live <span>Bids</span></h2>
            <Link href="/bid" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : liveBids.length > 0 ? (
            <div className={styles.listStack}>
              {liveBids.slice(0, 4).map(b => (
                <Link key={b.id} href={`/bid/${b.id}`} className={styles.listItem} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.artwork?.title || 'Untitled'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Current: ₹{b.currentHighest.toLocaleString('en-IN')} · {b.participantCount} bids
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'ACTIVE' ? 'badge-live' : 'badge-saffron'}`}>
                    {b.status === 'ACTIVE' ? '🔴 LIVE' : b.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No live bids right now.</p>
              <Link href="/bid" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-sm)' }}>Browse Bids</Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Quick <span>Access</span></h2>
          </div>
          <div className={styles.quickGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <Link href="/orders" className={styles.quickCard}>
              <span className={styles.quickIcon}>📦</span>
              <span className={styles.quickLabel}>My Orders</span>
              <span className={styles.quickValue}>{orders.length} total</span>
            </Link>
            <Link href="/wallet" className={styles.quickCard}>
              <span className={styles.quickIcon}>💰</span>
              <span className={styles.quickLabel}>Wallet</span>
              <span className={styles.quickValue}>₹{Number(user.wallet?.balance || 0).toLocaleString('en-IN')}</span>
            </Link>
            <Link href="/kalent" className={styles.quickCard}>
              <span className={styles.quickIcon}>📅</span>
              <span className={styles.quickLabel}>Kalent</span>
              <span className={styles.quickValue}>Events & Workshops</span>
            </Link>
            <Link href="/dashboard/customer/support" className={styles.quickCard}>
              <span className={styles.quickIcon}>🎫</span>
              <span className={styles.quickLabel}>Support</span>
              <span className={styles.quickValue}>Get help</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Recent <span>Orders</span></h2>
          <Link href="/orders" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : orders.length > 0 ? (
          <div className={styles.orderTable}>
            <div className={styles.orderHeader}>
              <span>Order ID</span>
              <span>Artwork</span>
              <span>Status</span>
              <span>Date</span>
              <span>Amount</span>
            </div>
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className={styles.orderRow}>
                <span className={styles.orderId}>{order.id.slice(0, 8)}</span>
                <span>{order.artwork?.title || 'Untitled'}</span>
                <span className={`badge ${order.status === 'DELIVERED' ? 'badge-teal' : order.status === 'SHIPPED' ? 'badge-saffron' : 'badge-purple'}`}>{order.status}</span>
                <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className={styles.orderAmount}>₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No orders yet. Start exploring art!</p>
            <Link href="/explore" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-sm)' }}>Explore Art</Link>
          </div>
        )}
      </div>
    </>
  );
}
