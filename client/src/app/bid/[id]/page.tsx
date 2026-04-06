'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Bid } from '@/types';
import styles from './page.module.css';

export default function BidRoomPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();

  const [bid, setBid] = useState<Bid | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBid = async () => {
    try {
      const res = await api.get(`/bids/${id}`);
      const bidData: Bid = res.data;
      setBid(bidData);
      setBidAmount(Number(bidData.currentHighest) + Number(bidData.minIncrement));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    void fetchBid();
  }, [id]);

  const minBid = useMemo(() => {
    if (!bid) return 0;
    return Number(bid.currentHighest) + Number(bid.minIncrement);
  }, [bid]);

  const handlePlaceBid = async () => {
    if (!bid) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await api.post(`/bids/${bid.id}/place`, { amount: Number(bidAmount) });
      await fetchBid();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem' }}>Loading bid room...</div>;
  }

  if (!bid) {
    return <div className="container" style={{ padding: '4rem' }}>Bid not found.</div>;
  }

  const isLive = bid.status === 'ACTIVE';
  const artistName = bid.artist?.user.name || bid.artistName || 'Unknown Artist';

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.room}>
        <div className={styles.artworkSide}>
          <div className={styles.artImage} style={{ background: `hsl(${bid.artwork.title.length * 23 % 360}, 40%, 22%)` }}>
            <span style={{ fontSize: '5rem', opacity: 0.4 }}>Art</span>
            {isLive && <div className={styles.liveIndicator}><span className={styles.liveDot}/>LIVE</div>}
          </div>
          <h2 className={styles.artTitle}>{bid.artwork.title}</h2>
          <p className={styles.artArtist}>by {artistName}</p>
        </div>

        <div className={styles.bidSide}>
          <div className={styles.bidHeader}>
            <div>
              <span className={styles.label}>Current Bid</span>
              <span className={styles.currentBid}>Rs {Number(bid.currentHighest).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className={styles.label}>Starting Price</span>
              <span className={styles.startPrice}>Rs {Number(bid.startingPrice).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className={styles.timerBox}>
            <span className={styles.label}>Status</span>
            <div className={styles.timer}>{bid.status}</div>
          </div>

          {error && <p style={{ color: '#EF4444' }}>{error}</p>}

          <div className={styles.bidInput}>
            <label className={styles.label}>Your Bid (min. Rs {minBid.toLocaleString('en-IN')})</label>
            <div className={styles.inputRow}>
              <span className={styles.currency}>Rs</span>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className={`input-field ${styles.bidField}`}
                min={minBid}
                disabled={!isLive || !user}
              />
              {user ? (
                <button className="btn btn-primary" onClick={handlePlaceBid} disabled={!isLive || submitting || bidAmount < minBid}>
                  {submitting ? 'Placing...' : 'Place Bid'}
                </button>
              ) : (
                <Link href="/login" className="btn btn-primary">Sign In</Link>
              )}
            </div>
          </div>

          <div className={styles.history}>
            <h3 className={styles.historyTitle}>Bid History ({bid.participantCount} bidders)</h3>
            <div className={styles.historyList}>
              {(bid.participants || []).map((entry, index) => (
                <div key={entry.id} className={styles.historyItem}>
                  <span className={styles.historyUser}>{entry.isWinning && index === 0 ? 'Leading: ' : ''}{entry.user.name}</span>
                  <span className={styles.historyAmount}>Rs {Number(entry.amount).toLocaleString('en-IN')}</span>
                  <span className={styles.historyTime}>{new Date(entry.placedAt).toLocaleString()}</span>
                </div>
              ))}
              {!bid.participants?.length && (
                <p style={{ color: 'var(--text-muted)' }}>No bids yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
