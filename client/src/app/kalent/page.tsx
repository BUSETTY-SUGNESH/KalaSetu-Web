'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import EventCard from '@/components/cards/EventCard';
import api, { getApiErrorMessage } from '@/lib/api';
import { KalentEvent } from '@/types';
import styles from './page.module.css';

export default function KalentPage() {
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState<KalentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setError('');
      try {
        const res = await api.get('/events');
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err));
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchEvents();
  }, []);

  const filtered = useMemo(() => (filter === 'all' ? events : events.filter((event) => event.type === filter)), [events, filter]);
  const totalParticipants = useMemo(
    () => filtered.reduce((sum, event) => sum + Number(event.registeredCount || 0), 0),
    [filtered],
  );

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Kalent</h1>
        <p className={styles.heroDesc}>Grow your art journey through competitions, workshops, and exhibitions</p>
        <div className={styles.quickLinks}>
          <Link href="/kalent/competitions" className={styles.quickLink}>🏆 Competitions</Link>
          <Link href="/kalent/workshops" className={styles.quickLink}>🎓 Workshops</Link>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className="stat-card"><span className="stat-value">{events.length}</span><span className="stat-label">Upcoming Events</span></div>
        <div className="stat-card"><span className="stat-value">{totalParticipants}</span><span className="stat-label">Participants</span></div>
        <div className="stat-card"><span className="stat-value">₹{filtered.reduce((sum, event) => sum + Number(event.fee || 0), 0).toLocaleString('en-IN')}</span><span className="stat-label">Fee Pool</span></div>
      </div>

      <div className={styles.filters}>
        {[{ v: 'all', l: 'All Events' }, { v: 'COMPETITION', l: '🏆 Competitions' }, { v: 'WORKSHOP', l: '🎓 Workshops' }, { v: 'EXHIBITION', l: '🏛️ Exhibitions' }].map(f => (
          <button key={f.v} className={`tag ${filter === f.v ? 'active' : ''}`} onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>

      {error && <p style={{ color: '#EF4444' }}>{error}</p>}

      {loading ? (
        <div style={{ padding: '2rem 0' }}>Loading events...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No events available</div>
      ) : (
        <div className="grid-events">
          {filtered.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
}
