'use client';
import { use } from 'react';
import Link from 'next/link';
import { mockEvents } from '@/lib/mockData';
import styles from './page.module.css';

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const event = mockEvents.find(e => e.id === eventId) || mockEvents[0];
  const typeIcons: Record<string, string> = { COMPETITION: '🏆', WORKSHOP: '🎓', EXHIBITION: '🏛️' };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <Link href="/kalent" className={styles.back}>← Back to Kalent</Link>

      <div className={styles.grid}>
        <div className={styles.main}>
          <div className={styles.image} style={{ background: `hsl(${event.title.length * 23 % 360}, 40%, 20%)` }}>
            <span style={{ fontSize: '5rem' }}>{typeIcons[event.type]}</span>
          </div>
          <span className={`badge badge-purple`}>{event.type}</span>
          <h1 className={styles.title}>{event.title}</h1>
          <p className={styles.description}>{event.description}</p>

          <div className={styles.details}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>📍 Location</span><span>{event.isVirtual ? 'Online (Virtual)' : event.location}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>📅 Starts</span><span>{new Date(event.startsAt).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>📅 Ends</span><span>{new Date(event.endsAt).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
            {event.maxParticipants && <div className={styles.detailItem}><span className={styles.detailLabel}>👥 Max Participants</span><span>{event.maxParticipants}</span></div>}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.registerCard}>
            <span className={styles.fee}>{event.fee > 0 ? `₹${event.fee}` : 'Free'}</span>
            <span className={styles.feeNote}>{event.fee > 0 ? 'Registration fee' : 'Open registration'}</span>
            <div className={styles.regStats}>
              <span>{event.registeredCount} already registered</span>
              {event.maxParticipants && <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${(event.registeredCount / event.maxParticipants) * 100}%` }} /></div>}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }}>Register Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
