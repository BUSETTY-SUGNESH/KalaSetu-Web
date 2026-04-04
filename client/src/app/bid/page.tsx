'use client';

import { useEffect, useMemo, useState } from 'react';
import BidCard from '@/components/cards/BidCard';
import api from '@/lib/api';
import { Bid } from '@/types';
import styles from './page.module.css';

export default function BidLobbyPage() {
  const [filter, setFilter] = useState('all');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const res = await api.get('/bids/active');
        setBids(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch bids');
        setBids([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchBids();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return bids;
    }

    return bids.filter((bid) => bid.status === filter.toUpperCase());
  }, [bids, filter]);

  const totalBidders = useMemo(
    () => bids.reduce((sum, bid) => sum + Number(bid.participantCount || 0), 0),
    [bids],
  );

  const highestBid = useMemo(
    () => bids.reduce((max, bid) => Math.max(max, Number(bid.currentHighest || 0)), 0),
    [bids],
  );

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title">Live <span>Bids</span></h1>
          <p className={styles.subtitle}>Compete for unique artworks in real-time auctions</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className="stat-card"><span className="stat-value">{bids.length}</span><span className="stat-label">Active Bids</span></div>
        <div className="stat-card"><span className="stat-value">{totalBidders}</span><span className="stat-label">Total Bidders</span></div>
        <div className="stat-card"><span className="stat-value">Rs {highestBid.toLocaleString('en-IN')}</span><span className="stat-label">Highest Bid</span></div>
      </div>

      <div className={styles.filters}>
        {['all', 'active', 'upcoming', 'completed'].map((f) => (
          <button key={f} className={`tag ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'active' && 'Live '}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {loading ? (
        <div style={{ padding: '2rem 0' }}>Loading bids...</div>
      ) : (
        <div className={styles.bidGrid}>
          {filtered.map((bid) => <BidCard key={bid.id} bid={bid} />)}
          {filtered.length === 0 && (
            <div className="empty-state"><div className="empty-state-icon">No bids</div><p className="empty-state-title">No bids in this category</p></div>
          )}
        </div>
      )}
    </div>
  );
}
