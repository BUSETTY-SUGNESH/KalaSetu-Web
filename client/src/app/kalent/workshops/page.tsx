import EventCard from '@/components/cards/EventCard';
import { mockEvents } from '@/lib/mockData';

export default function WorkshopsPage() {
  const workshops = mockEvents.filter(e => e.type === 'WORKSHOP');
  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">🎓 <span>Workshops</span></h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>Learn from master artisans and enhance your skills</p>
      <div className="grid-events">{workshops.map(e => <EventCard key={e.id} event={e} />)}</div>
    </div>
  );
}
