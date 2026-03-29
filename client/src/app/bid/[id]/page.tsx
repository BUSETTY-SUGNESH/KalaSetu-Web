'use client';
import { use, useState } from 'react';
import { mockBids } from '@/lib/mockData';
import styles from './page.module.css';

export default function BidRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const bid = mockBids.find(b => b.id === id) || mockBids[0];
  const [bidAmount, setBidAmount] = useState(bid.currentHighest + bid.minIncrement);
  const isLive = bid.status === 'ACTIVE';

  const bidHistory = [
    { user: 'Amit K.', amount: 32500, time: '2 min ago' },
    { user: 'Sneha R.', amount: 31000, time: '5 min ago' },
    { user: 'Rahul M.', amount: 29500, time: '12 min ago' },
    { user: 'Priya D.', amount: 27000, time: '18 min ago' },
    { user: 'Vikash S.', amount: 25000, time: '25 min ago' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.room}>
        <div className={styles.artworkSide}>
          <div className={styles.artImage} style={{ background: `hsl(${bid.artwork.title.length * 23 % 360}, 40%, 22%)` }}>
            <span style={{ fontSize: '5rem', opacity: 0.4 }}>🖼️</span>
            {isLive && <div className={styles.liveIndicator}><span className={styles.liveDot}/>LIVE</div>}
          </div>
          <h2 className={styles.artTitle}>{bid.artwork.title}</h2>
          <p className={styles.artArtist}>by {bid.artistName}</p>
        </div>

        <div className={styles.bidSide}>
          <div className={styles.bidHeader}>
            <div>
              <span className={styles.label}>Current Bid</span>
              <span className={styles.currentBid}>₹{bid.currentHighest.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className={styles.label}>Starting Price</span>
              <span className={styles.startPrice}>₹{bid.startingPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className={styles.timerBox}>
            <span className={styles.label}>Time Remaining</span>
            <div className={styles.timer}>
              <div className={styles.timerUnit}><span>23</span><small>Hours</small></div>
              <span className={styles.timerSep}>:</span>
              <div className={styles.timerUnit}><span>45</span><small>Mins</small></div>
              <span className={styles.timerSep}>:</span>
              <div className={styles.timerUnit}><span>12</span><small>Secs</small></div>
            </div>
          </div>

          <div className={styles.bidInput}>
            <label className={styles.label}>Your Bid (min. ₹{(bid.currentHighest + bid.minIncrement).toLocaleString('en-IN')})</label>
            <div className={styles.inputRow}>
              <span className={styles.currency}>₹</span>
              <input type="number" value={bidAmount} onChange={e => setBidAmount(Number(e.target.value))} className={`input-field ${styles.bidField}`} />
              <button className="btn btn-primary">Place Bid</button>
            </div>
          </div>

          <div className={styles.history}>
            <h3 className={styles.historyTitle}>Bid History ({bid.participantCount} bidders)</h3>
            <div className={styles.historyList}>
              {bidHistory.map((h, i) => (
                <div key={i} className={styles.historyItem}>
                  <span className={styles.historyUser}>{i === 0 ? '👑 ' : ''}{h.user}</span>
                  <span className={styles.historyAmount}>₹{h.amount.toLocaleString('en-IN')}</span>
                  <span className={styles.historyTime}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
