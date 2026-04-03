'use client';

import { useEffect, useState } from 'react';
import EventCard from '@/components/cards/EventCard';
import api from '@/lib/api';
import { KalentEvent } from '@/types';

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<KalentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await api.get('/events', { params: { type: 'COMPETITION' } });
        setCompetitions(Array.isArray(res.data) ? res.data : []);
      } finally {
        setLoading(false);
      }
    };

    void fetchCompetitions();
  }, []);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">🏆 <span>Competitions</span></h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>Showcase your talent and win recognition</p>
      {loading ? (
        <div>Loading competitions...</div>
      ) : competitions.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No events available</div>
      ) : (
        <div className="grid-events">{competitions.map((event) => <EventCard key={event.id} event={event} />)}</div>
      )}
    </div>
  );
}
