'use client';

import { useEffect, useMemo, useState } from 'react';
import BidCard from '@/components/cards/BidCard';
import api, { getApiErrorMessage } from '@/lib/api';
import { Artwork, Bid } from '@/types';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function BidLobbyPage() {
  const { user } = useAuth();
  const isArtist = user?.role === 'ARTIST';

  const [filter, setFilter] = useState('all');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Artist-only: artwork list for the "Start Bid" modal
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artworksLoading, setArtworksLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [bidForm, setBidForm] = useState({ artworkId: '', startingPrice: '', minIncrement: '100', startsAt: '', endsAt: '' });
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');

  const fetchBids = async () => {
    try {
      const res = await api.get('/bids/active');
      setBids(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBids();
  }, []);

  useEffect(() => {
    if (!isArtist) return;
    setArtworksLoading(true);
    api.get<Artwork[]>('/artworks/mine')
      .then((res) => setArtworks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setArtworks([]))
      .finally(() => setArtworksLoading(false));
  }, [isArtist]);

  const filtered = useMemo(() => {
    if (filter === 'all') return bids;
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

  const openModal = () => {
    setBidError('');
    setBidForm({ artworkId: '', startingPrice: '', minIncrement: '100', startsAt: '', endsAt: '' });
    setModalOpen(true);
  };

  const handleArtworkChange = (artworkId: string) => {
    const selected = artworks.find((a) => a.id === artworkId);
    setBidForm((f) => ({
      ...f,
      artworkId,
      startingPrice: selected ? String(selected.price) : f.startingPrice,
    }));
  };

  const handleStartBid = async () => {
    setBidError('');
    if (!bidForm.artworkId || !bidForm.startingPrice || !bidForm.minIncrement || !bidForm.startsAt || !bidForm.endsAt) {
      setBidError('All fields are required');
      return;
    }
    setBidSubmitting(true);
    try {
      await api.post('/bids', {
        artworkId: bidForm.artworkId,
        startingPrice: Number(bidForm.startingPrice),
        minIncrement: Number(bidForm.minIncrement),
        startsAt: new Date(bidForm.startsAt).toISOString(),
        endsAt: new Date(bidForm.endsAt).toISOString(),
      });
      setModalOpen(false);
      void fetchBids();
    } catch (e: unknown) {
      setBidError(getApiErrorMessage(e));
    } finally {
      setBidSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.header}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
          <div>
            <h1 className="section-title">Live <span>Bids</span></h1>
            <p className={styles.subtitle}>
              {isArtist
                ? 'Manage and start auctions for your artworks'
                : 'Compete for unique artworks in real-time auctions'}
            </p>
          </div>
          {isArtist && (
            <button className="btn btn-primary" onClick={openModal}>
              + Start a Bid
            </button>
          )}
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

      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)', maxWidth: 480, width: '100%', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 'var(--space-xs)' }}>Start a Bid</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>Set up an auction for one of your artworks</p>

            {bidError && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{bidError}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Artwork</span>
                <select
                  className="input-field"
                  value={bidForm.artworkId}
                  disabled={artworksLoading}
                  onChange={(e) => handleArtworkChange(e.target.value)}
                >
                  <option value="">{artworksLoading ? 'Loading...' : 'Select an artwork'}</option>
                  {artworks.map((a) => (
                    <option key={a.id} value={a.id}>{a.title} — Rs {Number(a.price).toLocaleString('en-IN')}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Starting Price (Rs)</span>
                <input className="input-field" type="number" min={1} value={bidForm.startingPrice}
                  onChange={(e) => setBidForm((f) => ({ ...f, startingPrice: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Minimum Increment (Rs)</span>
                <input className="input-field" type="number" min={1} value={bidForm.minIncrement}
                  onChange={(e) => setBidForm((f) => ({ ...f, minIncrement: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Starts At</span>
                <input className="input-field" type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={bidForm.startsAt}
                  onChange={(e) => setBidForm((f) => ({ ...f, startsAt: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ends At</span>
                <input className="input-field" type="datetime-local"
                  min={bidForm.startsAt || new Date().toISOString().slice(0, 16)}
                  value={bidForm.endsAt}
                  onChange={(e) => setBidForm((f) => ({ ...f, endsAt: e.target.value }))} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={bidSubmitting} onClick={() => void handleStartBid()}>
                {bidSubmitting ? 'Creating...' : 'Start Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
