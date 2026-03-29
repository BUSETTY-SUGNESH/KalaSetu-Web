import EventCard from '@/components/cards/EventCard';
import { mockEvents } from '@/lib/mockData';

export default function CompetitionsPage() {
  const competitions = mockEvents.filter(e => e.type === 'COMPETITION');
  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">🏆 <span>Competitions</span></h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>Showcase your talent and win recognition</p>
      <div className="grid-events">{competitions.map(e => <EventCard key={e.id} event={e} />)}</div>
    </div>
  );
}
