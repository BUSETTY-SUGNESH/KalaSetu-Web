import Link from 'next/link';
import styles from './Cards.module.css';
import { KalentEvent } from '@/types';

export default function EventCard({ event }: { event: KalentEvent }) {
  const typeColors: Record<string, string> = { COMPETITION: 'badge-saffron', WORKSHOP: 'badge-purple', EXHIBITION: 'badge-gold' };
  const typeIcons: Record<string, string> = { COMPETITION: '🏆', WORKSHOP: '🎓', EXHIBITION: '🏛️' };

  return (
    <Link href={`/kalent/${event.id}`} className={`card ${styles.eventCard}`}>
      <div className={styles.eventImage} style={{ background: `hsl(${event.title.length * 23 % 360}, 40%, 20%)` }}>
        <span style={{ fontSize: '2.5rem' }}>{typeIcons[event.type]}</span>
        <span className={`badge ${typeColors[event.type]} ${styles.eventTypeBadge}`}>{event.type}</span>
      </div>
      <div className={styles.eventInfo}>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        <p className={styles.eventMeta}>
          {event.isVirtual ? '🌐 Online' : `📍 ${event.location}`}
          <span>•</span>
          {new Date(event.startsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
        </p>
        <div className={styles.eventFooter}>
          <span className={styles.eventFee}>{event.fee > 0 ? `₹${event.fee}` : 'Free'}</span>
          <span className={styles.eventReg}>{event.registeredCount} registered</span>
        </div>
      </div>
    </Link>
  );
}
