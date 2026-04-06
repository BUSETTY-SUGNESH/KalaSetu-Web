'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api, { getApiErrorMessage } from '@/lib/api';
import styles from '../page.module.css';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  user?: { name: string };
  order?: { id: string };
  assignee?: { name: string } | null;
}

const priorityColor: Record<string, string> = {
  LOW: 'badge-teal',
  MEDIUM: 'badge-saffron',
  HIGH: 'badge-red',
  URGENT: 'badge-red',
};

export default function SupportDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ALL'>('OPEN');

  const load = useCallback(async () => {
    try {
      const query = filter === 'ALL' ? '' : `?status=${filter}`;
      const res = await api.get(`/support/all${query}`);
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  const handleAssignToMe = async (ticketId: string) => {
    if (!user) return;
    try {
      await api.post(`/support/${ticketId}/assign`, { assigneeId: user.id });
      await load();
    } catch (err: unknown) {
      window.alert(getApiErrorMessage(err));
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      await api.patch(`/support/${ticketId}/status`, { status });
      await load();
    } catch (err: unknown) {
      window.alert(getApiErrorMessage(err));
    }
  };

  if (authLoading || !user) return <div>Loading...</div>;

  const allTickets = tickets;
  const openCount = allTickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = allTickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = allTickets.filter(t => t.status === 'RESOLVED').length;
  const urgentCount = allTickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
  const myTickets = allTickets.filter(t => t.assignee?.name === user.name);

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <h1 className="section-title">Support <span>Center</span></h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>Manage and resolve customer support tickets</p>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}

      {/* Priority Alert */}
      {urgentCount > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertError}`}>
          <span style={{ fontSize: '1.2rem' }}>🚨</span>
          <div style={{ flex: 1 }}>
            <strong>{urgentCount} high-priority {urgentCount === 1 ? 'ticket requires' : 'tickets require'} attention</strong>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ border: '1px solid #EF4444' }} onClick={() => setFilter('OPEN')}>
            View Open
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardSaffron}`}>
          <span className={styles.statIcon}>📬</span>
          <span className={styles.statValue}>{loading ? '...' : openCount}</span>
          <span className={styles.statLabel}>Open Tickets</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
          <span className={styles.statIcon}>⏳</span>
          <span className={styles.statValue}>{loading ? '...' : inProgressCount}</span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardTeal}`}>
          <span className={styles.statIcon}>✅</span>
          <span className={styles.statValue}>{loading ? '...' : resolvedCount}</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGold}`}>
          <span className={styles.statIcon}>👤</span>
          <span className={styles.statValue}>{loading ? '...' : myTickets.length}</span>
          <span className={styles.statLabel}>My Tickets</span>
        </div>
      </div>

      {/* Filter + Ticket List */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>Support <span>Tickets</span></h2>
          <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
            {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ALL'] as const).map(s => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setFilter(s); setLoading(true); }}
              >
                {s === 'IN_PROGRESS' ? 'In Progress' : s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading tickets...</div>
        ) : tickets.length > 0 ? (
          <div className={styles.listStack}>
            {tickets.map(t => (
              <div key={t.id} className={styles.listItem} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                {/* Ticket Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1.02rem' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      By {t.user?.name || 'Unknown'} · {new Date(t.createdAt).toLocaleDateString()}
                      {t.order && <> · Order #{t.order.id.slice(0, 8)}</>}
                    </div>
                    {t.assignee && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--teal-light)', marginTop: 2 }}>
                        Assigned: {t.assignee.name}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0, alignItems: 'center' }}>
                    <span className={`badge ${priorityColor[t.priority] || 'badge-purple'}`}>{t.priority}</span>
                    <span className={`badge ${t.status === 'OPEN' ? 'badge-saffron' : t.status === 'RESOLVED' ? 'badge-teal' : 'badge-purple'}`}>
                      {t.status === 'IN_PROGRESS' ? 'IN PROGRESS' : t.status}
                    </span>
                  </div>
                </div>

                {/* Ticket Description */}
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', lineHeight: 1.5 }}>
                  {t.description.length > 180 ? t.description.slice(0, 180) + '...' : t.description}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                  {!t.assignee && t.status === 'OPEN' && (
                    <button className="btn btn-primary btn-sm" onClick={() => void handleAssignToMe(t.id)}>
                      Assign to Me
                    </button>
                  )}
                  {t.status === 'OPEN' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => void handleStatusUpdate(t.id, 'IN_PROGRESS')}>
                      Start Working
                    </button>
                  )}
                  {t.status === 'IN_PROGRESS' && (
                    <button className="btn btn-primary btn-sm" onClick={() => void handleStatusUpdate(t.id, 'RESOLVED')}>
                      Mark Resolved
                    </button>
                  )}
                  {t.status === 'RESOLVED' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => void handleStatusUpdate(t.id, 'OPEN')}>
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No {filter === 'ALL' ? '' : filter.toLowerCase().replace('_', ' ')} tickets found.</p>
          </div>
        )}
      </div>
    </>
  );
}
