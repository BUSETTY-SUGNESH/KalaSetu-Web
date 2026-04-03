'use client';

import { useEffect, useState } from 'react';
import EventCard from '@/components/cards/EventCard';
import api from '@/lib/api';
import { KalentEvent } from '@/types';

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<KalentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const res = await api.get('/events', { params: { type: 'WORKSHOP' } });
        setWorkshops(Array.isArray(res.data) ? res.data : []);
      } finally {
        setLoading(false);
      }
    };

    void fetchWorkshops();
  }, []);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">🎓 <span>Workshops</span></h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>Learn from master artisans and enhance your skills</p>
      {loading ? (
        <div>Loading workshops...</div>
      ) : workshops.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No events available</div>
      ) : (
        <div className="grid-events">{workshops.map((event) => <EventCard key={event.id} event={event} />)}</div>
      )}
    </div>
  );
}
