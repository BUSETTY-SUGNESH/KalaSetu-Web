'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRequireRole } from '@/hooks/useRequireRole';
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

interface PendingArtwork {
  id: string;
  title: string;
  price: number;
  category: string;
  createdAt: string;
  artist?: { user: { name: string } };
}

interface PendingArtist {
  id: string;
  user: { name: string; email: string };
  specialty?: string;
  verificationStatus: string;
}

interface ManagerStats {
  totalOrders: number;
  totalRevenue: number;
  totalArtworks: number;
  activeBids: number;
  openTickets: number;
  pendingKyc: number;
  pendingArtworks: PendingArtwork[];
  pendingArtists: PendingArtist[];
  recentOrders: RecentOrder[];
}

export default function ManagerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { authorized } = useRequireRole(['MANAGER']);
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const res = await api.get<ManagerStats>('/users/manager-stats');
        setStats(res.data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void fetchStats();
  }, [user]);

  if (authLoading || !user || !authorized) return <div>Loading...</div>;

  const s = stats;

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <h1 className="section-title">Operations <span>Center</span></h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>Platform operations and content management</p>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}

      {/* Priority Alerts */}
      {s && (s.pendingArtworks?.length ?? 0) > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertWarn}`}>
          <span style={{ fontSize: '1.2rem' }}>🖼️</span>
          <div style={{ flex: 1 }}>
            <strong>{s.pendingArtworks.length} {s.pendingArtworks.length === 1 ? 'artwork awaits' : 'artworks await'} review</strong>
          </div>
        </div>
      )}
      {s && s.pendingKyc > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertInfo}`}>
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <div style={{ flex: 1 }}>
            <strong>{s.pendingKyc} KYC {s.pendingKyc === 1 ? 'application' : 'applications'} pending</strong>
          </div>
        </div>
      )}
      {s && s.openTickets > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertError}`}>
          <span style={{ fontSize: '1.2rem' }}>🎫</span>
          <div style={{ flex: 1 }}>
            <strong>{s.openTickets} open {s.openTickets === 1 ? 'ticket' : 'tickets'} need attention</strong>
          </div>
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
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Operations <span>Summary</span></h2>
        </div>
        <div className={styles.quickGrid}>
          <div className={styles.quickCard} style={{ cursor: 'default' }}>
            <span className={styles.quickIcon}>🖼️</span>
            <span className={styles.quickLabel}>Artwork Queue</span>
            <span className={styles.quickValue}>{s?.pendingArtworks?.length ?? 0} pending</span>
          </div>
          <div className={styles.quickCard} style={{ cursor: 'default' }}>
            <span className={styles.quickIcon}>🔍</span>
            <span className={styles.quickLabel}>KYC Review</span>
            <span className={styles.quickValue}>{s?.pendingKyc ?? 0} pending</span>
          </div>
          <div className={styles.quickCard} style={{ cursor: 'default' }}>
            <span className={styles.quickIcon}>🎫</span>
            <span className={styles.quickLabel}>Support Tickets</span>
            <span className={styles.quickValue}>{s?.openTickets ?? 0} open</span>
          </div>
          <div className={styles.quickCard} style={{ cursor: 'default' }}>
            <span className={styles.quickIcon}>📦</span>
            <span className={styles.quickLabel}>Orders</span>
            <span className={styles.quickValue}>{s?.totalOrders ?? 0} total</span>
          </div>
          <div className={styles.quickCard} style={{ cursor: 'default' }}>
            <span className={styles.quickIcon}>🎨</span>
            <span className={styles.quickLabel}>Artist Verification</span>
            <span className={styles.quickValue}>{s?.pendingArtists?.length ?? 0} pending</span>
          </div>
          <div className={styles.quickCard} style={{ cursor: 'default' }}>
            <span className={styles.quickIcon}>⚡</span>
            <span className={styles.quickLabel}>Active Bids</span>
            <span className={styles.quickValue}>{s?.activeBids ?? 0} live</span>
          </div>
        </div>
      </div>

      {/* Two Column: Pending Artworks + Pending Artists */}
      <div className={styles.twoCol}>
        {/* Pending Artworks for Review */}
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Artwork <span>Queue</span></h2>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : s?.pendingArtworks && s.pendingArtworks.length > 0 ? (
            <div className={styles.listStack}>
              {s.pendingArtworks.slice(0, 5).map(a => (
                <div key={a.id} className={styles.listItem}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      By {a.artist?.user?.name || 'Unknown'} · ₹{Number(a.price).toLocaleString('en-IN')} · {a.category}
                    </div>
                  </div>
                  <span className="badge badge-saffron">PENDING</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No artworks pending review.</p></div>
          )}
        </div>

        {/* Pending Artist Verifications */}
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Artist <span>Verification</span></h2>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : s?.pendingArtists && s.pendingArtists.length > 0 ? (
            <div className={styles.listStack}>
              {s.pendingArtists.slice(0, 5).map(a => (
                <div key={a.id} className={styles.listItem}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.user.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {a.user.email} {a.specialty ? `· ${a.specialty}` : ''}
                    </div>
                  </div>
                  <span className="badge badge-saffron">PENDING</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No artists pending verification.</p></div>
          )}
        </div>
      </div>

      {/* Recent Platform Orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Recent <span>Orders</span></h2>
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
