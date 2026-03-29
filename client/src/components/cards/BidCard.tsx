import Link from 'next/link';
import styles from './Cards.module.css';
import { Bid } from '@/types';

export default function BidCard({ bid }: { bid: Bid }) {
  const isLive = bid.status === 'ACTIVE';
  const endDate = new Date(bid.endsAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <Link href={`/bid/${bid.id}`} className={`card ${styles.bidCard}`}>
      <div className={styles.bidImage} style={{ background: `hsl(${parseInt(bid.id.replace(/\D/g,'') || '0') * 67 % 360}, 35%, 22%)` }}>
        <span className={styles.artEmoji}>🖼️</span>
        {isLive && (
          <div className={styles.liveTag}>
            <span className={styles.liveDot}/>
            LIVE
          </div>
        )}
      </div>
      <div className={styles.bidInfo}>
        <h3 className={styles.bidTitle}>{bid.artwork.title}</h3>
        <p className={styles.bidArtist}>by {bid.artistName}</p>
        <div className={styles.bidPriceRow}>
          <div>
            <span className={styles.bidLabel}>Current Bid</span>
            <span className={styles.bidPrice}>₹{bid.currentHighest.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className={styles.bidLabel}>{isLive ? 'Ends In' : 'Starts'}</span>
            <span className={styles.bidTimer}>{isLive ? `${hoursLeft}h left` : new Date(bid.startsAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className={styles.bidFooter}>
          <span>{bid.participantCount} bidders</span>
          <span className={`badge ${isLive ? 'badge-live' : 'badge-teal'}`}>{bid.status}</span>
        </div>
      </div>
    </Link>
  );
}
