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

interface AdminStats {
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

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const res = await api.get<AdminStats>('/users/dashboard-stats');
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-md)', alignItems: 'center' }}>
          <div>
            <h1 className="section-title">Admin <span>Console</span></h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>Full platform overview and management</p>
          </div>
          <Link href="/dashboard/admin/create-user" className="btn btn-primary">+ Create User</Link>
        </div>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}

      {/* Alerts */}
      {s && s.pendingKyc > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertWarn}`}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>{s.pendingKyc} KYC {s.pendingKyc === 1 ? 'application' : 'applications'} pending review</strong>
          </div>
          <Link href="/dashboard/admin/kyc" className="btn btn-primary btn-sm">Review</Link>
        </div>
      )}
      {s && s.openTickets > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertError}`}>
          <span style={{ fontSize: '1.2rem' }}>🎫</span>
          <div style={{ flex: 1 }}>
            <strong>{s.openTickets} open support {s.openTickets === 1 ? 'ticket' : 'tickets'}</strong>
          </div>
          <Link href="/dashboard/admin/tickets" className="btn btn-ghost btn-sm" style={{ border: '1px solid #EF4444' }}>View</Link>
        </div>
      )}

      {/* KPI Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardSaffron}`}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statValue}>{loading ? '...' : s?.totalUsers ?? 0}</span>
          <span className={styles.statLabel}>Total Users</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
          <span className={styles.statIcon}>🖼️</span>
          <span className={styles.statValue}>{loading ? '...' : s?.totalArtworks ?? 0}</span>
          <span className={styles.statLabel}>Total Artworks</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGold}`}>
          <span className={styles.statIcon}>💰</span>
          <span className={styles.statValue}>₹{loading ? '...' : (s?.totalRevenue ?? 0).toLocaleString('en-IN')}</span>
          <span className={styles.statLabel}>Total Revenue</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardTeal}`}>
          <span className={styles.statIcon}>📦</span>
          <span className={styles.statValue}>{loading ? '...' : s?.totalOrders ?? 0}</span>
          <span className={styles.statLabel}>Total Orders</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardRed}`}>
          <span className={styles.statIcon}>🎫</span>
          <span className={styles.statValue}>{loading ? '...' : s?.openTickets ?? 0}</span>
          <span className={styles.statLabel}>Open Tickets</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSaffron}`}>
          <span className={styles.statIcon}>⚡</span>
          <span className={styles.statValue}>{loading ? '...' : s?.activeBids ?? 0}</span>
          <span className={styles.statLabel}>Active Bids</span>
        </div>
      </div>

      {/* Two Column: User Breakdown + Admin Actions */}
      <div className={styles.twoCol}>
        {/* User Breakdown */}
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Users by <span>Role</span></h2>
            <Link href="/dashboard/admin/users" className="btn btn-ghost btn-sm">Manage</Link>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : s?.usersByRole && s.usersByRole.length > 0 ? (
            <div className={styles.listStack}>
              {s.usersByRole.map(r => (
                <div key={r.role} className={styles.listItem}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {r.role === 'BUYER' ? 'Customer' : r.role.toLowerCase()}
                  </span>
                  <span className="badge badge-purple">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No user data available.</p></div>
          )}
        </div>

        {/* Admin Actions */}
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Admin <span>Actions</span></h2>
          </div>
          <div className={styles.quickGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <Link href="/dashboard/admin/create-user" className={styles.quickCard}>
              <span className={styles.quickIcon}>👤</span>
              <span className={styles.quickLabel}>Create User</span>
              <span className={styles.quickValue}>Add staff & agents</span>
            </Link>
            <Link href="/dashboard/admin/users" className={styles.quickCard}>
              <span className={styles.quickIcon}>👥</span>
              <span className={styles.quickLabel}>User Management</span>
              <span className={styles.quickValue}>View & manage</span>
            </Link>
            <Link href="/dashboard/admin/kyc" className={styles.quickCard}>
              <span className={styles.quickIcon}>🔍</span>
              <span className={styles.quickLabel}>KYC Review</span>
              <span className={styles.quickValue}>{s?.pendingKyc ?? 0} pending</span>
            </Link>
            <Link href="/dashboard/admin/escrow" className={styles.quickCard}>
              <span className={styles.quickIcon}>🔒</span>
              <span className={styles.quickLabel}>Escrow</span>
              <span className={styles.quickValue}>Manage funds</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Recent <span>Orders</span></h2>
          <Link href="/dashboard/admin/orders" className="btn btn-ghost btn-sm">View All</Link>
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
