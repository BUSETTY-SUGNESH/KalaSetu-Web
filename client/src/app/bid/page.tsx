'use client';
import { useState } from 'react';
import BidCard from '@/components/cards/BidCard';
import { mockBids } from '@/lib/mockData';
import styles from './page.module.css';

export default function BidLobbyPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? mockBids : mockBids.filter(b => b.status === filter.toUpperCase());

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title">Live <span>Bids</span></h1>
          <p className={styles.subtitle}>Compete for unique artworks in real-time auctions</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className="stat-card"><span className="stat-value">3</span><span className="stat-label">Active Bids</span></div>
        <div className="stat-card"><span className="stat-value">12</span><span className="stat-label">Total Bidders</span></div>
        <div className="stat-card"><span className="stat-value">₹1.3L</span><span className="stat-label">Highest Bid</span></div>
      </div>

      <div className={styles.filters}>
        {['all', 'active', 'upcoming', 'completed'].map(f => (
          <button key={f} className={`tag ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'active' && '🔴 '}{f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.bidGrid}>
        {filtered.map(bid => <BidCard key={bid.id} bid={bid} />)}
        {filtered.length === 0 && (
          <div className="empty-state"><div className="empty-state-icon">🏷️</div><p className="empty-state-title">No bids in this category</p></div>
        )}
      </div>
    </div>
  );
}
