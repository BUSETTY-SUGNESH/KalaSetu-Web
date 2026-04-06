'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api, { getApiErrorMessage } from '@/lib/api';
import styles from '../page.module.css';

interface RecentOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  artwork?: { title?: string };
  buyer?: { name?: string };
}

interface RoleCount {
  role: string;
  count: number;
}

interface ManagerStats {
  totalUsers: number;
  totalArtworks: number;
  totalOrders: number;
  totalRevenue: number;
  activeBids: number;
  openTickets: number;
  pendingKyc: number;
  recentOrders: RecentOrder[];
  usersByRole: RoleCount[];
}

export default function ManagerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const res = await api.get<ManagerStats>('/users/dashboard-stats');
        setStats(res.data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void fetchStats();
  }, [user]);

  if (authLoading || !user) return <div>Loading...</div>;

  const s = stats;

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <h1 className="section-title">Manager <span>Dashboard</span></h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>Platform operations at a glance</p>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}

      {/* Priority Alerts */}
      {s && s.pendingKyc > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertWarn}`}>
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <div style={{ flex: 1 }}>
            <strong>{s.pendingKyc} KYC {s.pendingKyc === 1 ? 'review' : 'reviews'} pending</strong>
          </div>
          <Link href="/dashboard/manager/kyc" className="btn btn-primary btn-sm">Review Now</Link>
        </div>
      )}
      {s && s.openTickets > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertInfo}`}>
          <span style={{ fontSize: '1.2rem' }}>🎫</span>
          <div style={{ flex: 1 }}>
            <strong>{s.openTickets} unresolved support {s.openTickets === 1 ? 'ticket' : 'tickets'}</strong>
          </div>
          <Link href="/dashboard/manager/tickets" className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--teal-light)' }}>View</Link>
        </div>
      )}

      {/* KPI Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardSaffron}`}>
          <span className={styles.statIcon}>📦</span>
          <span className={styles.statValue}>{loading ? '...' : s?.totalOrders ?? 0}</span>
          <span className={styles.statLabel}>Total Orders</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGold}`}>
          <span className={styles.statIcon}>💰</span>
          <span className={styles.statValue}>₹{loading ? '...' : (s?.totalRevenue ?? 0).toLocaleString('en-IN')}</span>
          <span className={styles.statLabel}>Revenue</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
          <span className={styles.statIcon}>🖼️</span>
          <span className={styles.statValue}>{loading ? '...' : s?.totalArtworks ?? 0}</span>
          <span className={styles.statLabel}>Artworks</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardTeal}`}>
          <span className={styles.statIcon}>⚡</span>
          <span className={styles.statValue}>{loading ? '...' : s?.activeBids ?? 0}</span>
          <span className={styles.statLabel}>Active Bids</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardRed}`}>
          <span className={styles.statIcon}>🔍</span>
          <span className={styles.statValue}>{loading ? '...' : s?.pendingKyc ?? 0}</span>
          <span className={styles.statLabel}>Pending KYC</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSaffron}`}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statValue}>{loading ? '...' : s?.totalUsers ?? 0}</span>
          <span className={styles.statLabel}>Total Users</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Quick <span>Actions</span></h2>
        </div>
        <div className={styles.quickGrid}>
          <Link href="/dashboard/manager/kyc" className={styles.quickCard}>
            <span className={styles.quickIcon}>🔍</span>
            <span className={styles.quickLabel}>KYC Review</span>
            <span className={styles.quickValue}>{s?.pendingKyc ?? 0} pending</span>
          </Link>
          <Link href="/dashboard/manager/tickets" className={styles.quickCard}>
            <span className={styles.quickIcon}>🎫</span>
            <span className={styles.quickLabel}>Support Tickets</span>
            <span className={styles.quickValue}>{s?.openTickets ?? 0} open</span>
          </Link>
          <Link href="/dashboard/manager/orders" className={styles.quickCard}>
            <span className={styles.quickIcon}>📦</span>
            <span className={styles.quickLabel}>All Orders</span>
            <span className={styles.quickValue}>{s?.totalOrders ?? 0} total</span>
          </Link>
          <Link href="/dashboard/manager/bid-requests" className={styles.quickCard}>
            <span className={styles.quickIcon}>🎯</span>
            <span className={styles.quickLabel}>Bid Requests</span>
            <span className={styles.quickValue}>Monitor bids</span>
          </Link>
        </div>
      </div>

      {/* Recent Platform Orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Recent <span>Orders</span></h2>
          <Link href="/dashboard/manager/orders" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : s?.recentOrders && s.recentOrders.length > 0 ? (
          <div className={styles.orderTable}>
            <div className={styles.orderHeader}>
              <span>Order ID</span>
              <span>Artwork</span>
              <span>Buyer</span>
              <span>Status</span>
              <span>Amount</span>
            </div>
            {s.recentOrders.map(o => (
              <div key={o.id} className={styles.orderRow}>
                <span className={styles.orderId}>{o.id.slice(0, 8)}</span>
                <span>{o.artwork?.title || 'Untitled'}</span>
                <span>{o.buyer?.name || 'Unknown'}</span>
                <span className={`badge ${o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'badge-teal' : o.status === 'SHIPPED' ? 'badge-saffron' : 'badge-purple'}`}>{o.status}</span>
                <span className={styles.orderAmount}>₹{o.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><p>No orders in the system yet.</p></div>
        )}
      </div>
    </>
  );
}
