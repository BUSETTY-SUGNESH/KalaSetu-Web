'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api, { getApiErrorMessage } from '@/lib/api';
import { Artwork, Bid } from '@/types';
import styles from '../page.module.css';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  artwork?: { title?: string };
}

interface ArtistStats {
  totalArtworks: number;
  listedArtworks: number;
  pendingOrders: number;
  completedOrders: number;
  totalEarnings: number;
  activeBids: number;
}

export default function ArtistDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState<ArtistStats>({
    totalArtworks: 0, listedArtworks: 0, pendingOrders: 0,
    completedOrders: 0, totalEarnings: 0, activeBids: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [artRes, ordRes, bidRes] = await Promise.allSettled([
        api.get<Artwork[]>('/artworks/mine'),
        api.get<Order[]>('/orders/my'),
        api.get<Bid[]>('/bids/active'),
      ]);

      const artList = artRes.status === 'fulfilled' && Array.isArray(artRes.value.data) ? artRes.value.data : [];
      const ordList = ordRes.status === 'fulfilled' && Array.isArray(ordRes.value.data) ? ordRes.value.data : [];
      const bidList = bidRes.status === 'fulfilled' && Array.isArray(bidRes.value.data) ? bidRes.value.data : [];

      setArtworks(artList);
      setOrders(ordList);
      setBids(bidList.filter(b => b.artistId === user?.id));

      const pending = ordList.filter(o => ['PENDING', 'CONFIRMED', 'ACCEPTED', 'IN_PROGRESS'].includes(o.status));
      const completed = ordList.filter(o => ['COMPLETED', 'DELIVERED'].includes(o.status));
      const earnings = completed.reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        totalArtworks: artList.length,
        listedArtworks: artList.filter(a => a.status === 'LISTED').length,
        pendingOrders: pending.length,
        completedOrders: completed.length,
        totalEarnings: earnings,
        activeBids: bidList.filter(b => b.artistId === user?.id).length,
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadData();
  }, [user, loadData]);

  if (authLoading || !user) return <div>Loading...</div>;

  const recentOrders = orders.slice(0, 5);

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-md)', alignItems: 'center' }}>
          <div>
            <h1 className="section-title">Artist <span>Studio</span></h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
              Welcome back, {user.name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Link href="/artist/add-artwork" className="btn btn-primary">+ Add Artwork</Link>
            <Link href="/bid" className="btn btn-secondary">⚡ Start Bid</Link>
          </div>
        </div>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}

      {/* KPI Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardSaffron}`}>
          <span className={styles.statIcon}>🖼️</span>
          <span className={styles.statValue}>{loading ? '...' : stats.totalArtworks}</span>
          <span className={styles.statLabel}>Total Artworks</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
          <span className={styles.statIcon}>📦</span>
          <span className={styles.statValue}>{loading ? '...' : stats.pendingOrders}</span>
          <span className={styles.statLabel}>Pending Orders</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGold}`}>
          <span className={styles.statIcon}>💰</span>
          <span className={styles.statValue}>₹{loading ? '...' : stats.totalEarnings.toLocaleString('en-IN')}</span>
          <span className={styles.statLabel}>Total Earnings</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardTeal}`}>
          <span className={styles.statIcon}>⚡</span>
          <span className={styles.statValue}>{loading ? '...' : stats.activeBids}</span>
          <span className={styles.statLabel}>Active Bids</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsRow}>
        <Link href="/artist-dashboard" className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>🖼️ Manage Artworks</Link>
        <Link href="/orders" className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>📦 View Orders</Link>
        <Link href="/wallet" className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>💰 Wallet</Link>
        <Link href="/dashboard/artist/bid-requests" className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>🎯 Bid Requests</Link>
      </div>

      {/* Two Column: Recent Artworks + Active Bids */}
      <div className={styles.twoCol}>
        {/* Recent Artworks */}
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Recent <span>Artworks</span></h2>
            <Link href="/artist-dashboard" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : artworks.length > 0 ? (
            <div className={styles.listStack}>
              {artworks.slice(0, 4).map(a => (
                <div key={a.id} className={styles.listItem}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      ₹{Number(a.price).toLocaleString('en-IN')} · <span className={`badge ${a.status === 'LISTED' ? 'badge-teal' : a.status === 'SOLD' ? 'badge-saffron' : 'badge-purple'}`}>{a.status}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <Link href={`/artist/add-artwork?id=${a.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                    <Link href={`/art/${a.id}`} className="btn btn-ghost btn-sm">View</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No artworks yet.</p>
              <Link href="/artist/add-artwork" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-sm)' }}>Create First Listing</Link>
            </div>
          )}
        </div>

        {/* Active Bids */}
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title" style={{ fontSize: '1.3rem' }}>My <span>Bids</span></h2>
            <Link href="/bid" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : bids.length > 0 ? (
            <div className={styles.listStack}>
              {bids.slice(0, 4).map(b => (
                <Link key={b.id} href={`/bid/${b.id}`} className={styles.listItem} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.artwork?.title || 'Untitled'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      ₹{b.currentHighest.toLocaleString('en-IN')} · {b.participantCount} bids
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'ACTIVE' ? 'badge-live' : b.status === 'UPCOMING' ? 'badge-saffron' : 'badge-teal'}`}>
                    {b.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No active bids.</p>
              <Link href="/bid" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-sm)' }}>Start a Bid</Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Recent <span>Sales</span></h2>
          <Link href="/orders" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : recentOrders.length > 0 ? (
          <div className={styles.orderTable}>
            <div className={styles.orderHeader}>
              <span>Order ID</span>
              <span>Artwork</span>
              <span>Status</span>
              <span>Date</span>
              <span>Amount</span>
            </div>
            {recentOrders.map(o => (
              <div key={o.id} className={styles.orderRow}>
                <span className={styles.orderId}>{o.id.slice(0, 8)}</span>
                <span>{o.artwork?.title || 'Untitled'}</span>
                <span className={`badge ${o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'badge-teal' : o.status === 'SHIPPED' ? 'badge-saffron' : 'badge-purple'}`}>{o.status}</span>
                <span className={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString()}</span>
                <span className={styles.orderAmount}>₹{o.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No sales yet. List your first artwork to start selling!</p>
          </div>
        )}
      </div>
    </>
  );
}
