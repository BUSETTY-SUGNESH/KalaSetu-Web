'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { KalentEvent } from '@/types';
import styles from './page.module.css';

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<KalentEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get<KalentEvent>(`/events/${eventId}`);
        setEvent(res.data);
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      void fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    if (!user || !eventId) return;
    const checkReg = async () => {
      try {
        const res = await api.get<{ registered: boolean }>(`/events/${eventId}/my-registration`);
        setRegistered(!!res.data?.registered);
      } catch {
        /* ignore */
      }
    };
    void checkReg();
  }, [user, eventId]);

  const handleRegister = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setRegError('');
    setRegLoading(true);
    try {
      await api.post(`/events/${eventId}/register`);
      setRegistered(true);
      if (event) {
        setEvent({ ...event, registeredCount: event.registeredCount + 1 });
      }
    } catch (err) {
      setRegError(getApiErrorMessage(err));
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem' }}>Loading event...</div>;
  }

  if (!event) {
    return <div className="container" style={{ padding: '4rem' }}>Event not found.</div>;
  }

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
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleRegister}
              disabled={registered || regLoading}
            >
              {registered ? '✓ Registered' : regLoading ? 'Registering...' : 'Register Now'}
            </button>
            {regError && <p style={{ color: '#EF4444', fontSize: '0.85rem' }}>{regError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
