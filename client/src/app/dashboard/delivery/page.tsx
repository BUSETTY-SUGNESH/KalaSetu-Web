'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import api, { getApiErrorMessage } from '@/lib/api';
import styles from '../page.module.css';

interface Delivery {
  id: string;
  status: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  order: {
    id: string;
    totalAmount: number;
    shippingAddress: string;
    artwork?: { title?: string };
    buyer?: { name: string };
  };
}

const statusColor: Record<string, string> = {
  ASSIGNED: 'badge-purple',
  PICKED_UP: 'badge-saffron',
  IN_TRANSIT: 'badge-saffron',
  DELIVERED: 'badge-teal',
  FAILED: 'badge-red',
};

export default function DeliveryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { authorized } = useRequireRole(['DELIVERY']);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/delivery/my');
      setDeliveries(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.patch(`/delivery/${id}/status`, { status });
      await load();
    } catch (err: unknown) {
      window.alert(getApiErrorMessage(err));
    }
  };

  if (authLoading || !user || !authorized) return <div>Loading...</div>;

  const active = deliveries.filter(d => !['DELIVERED', 'FAILED'].includes(d.status));
  const completed = deliveries.filter(d => d.status === 'DELIVERED');

  return (
    <>
      <div className={styles.header}>
        <h1 className="section-title">Delivery <span>Dashboard</span></h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>Manage your assigned deliveries</p>
      </div>

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}

      <div className={styles.quickGrid}>
        <div className={styles.quickCard}>
          <span className={styles.quickIcon}>📋</span>
          <span className={styles.quickLabel}>Active</span>
          <span className={styles.quickValue}>{active.length} deliveries</span>
        </div>
        <div className={styles.quickCard}>
          <span className={styles.quickIcon}>✅</span>
          <span className={styles.quickLabel}>Completed</span>
          <span className={styles.quickValue}>{completed.length} deliveries</span>
        </div>
        <div className={styles.quickCard}>
          <span className={styles.quickIcon}>📦</span>
          <span className={styles.quickLabel}>Total</span>
          <span className={styles.quickValue}>{deliveries.length} all time</span>
        </div>
      </div>

      <section style={{ marginTop: 'var(--space-2xl)' }}>
        <h2 className="section-title" style={{ fontSize: '1.4rem', marginBottom: 'var(--space-lg)' }}>Active <span>Deliveries</span></h2>

        {loading ? (
          <div>Loading deliveries...</div>
        ) : active.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {active.map(d => (
              <div key={d.id} style={{
                padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.order.artwork?.title || 'Order'}</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Order #{d.order.id.slice(0, 8)} · {d.order.buyer?.name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      📍 {d.order.shippingAddress || 'Address not provided'}
                    </div>
                  </div>
                  <span className={`badge ${statusColor[d.status] || 'badge-purple'}`}>{d.status.replace('_', ' ')}</span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                  {d.status === 'ASSIGNED' && (
                    <button className="btn btn-primary btn-sm" onClick={() => void handleStatusUpdate(d.id, 'PICKED_UP')}>
                      Mark Picked Up
                    </button>
                  )}
                  {d.status === 'PICKED_UP' && (
                    <button className="btn btn-primary btn-sm" onClick={() => void handleStatusUpdate(d.id, 'IN_TRANSIT')}>
                      Mark In Transit
                    </button>
                  )}
                  {d.status === 'IN_TRANSIT' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => void handleStatusUpdate(d.id, 'DELIVERED')}>
                        Mark Delivered
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => void handleStatusUpdate(d.id, 'FAILED')}>
                        Mark Failed
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No active deliveries. Check back later!</p>
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section style={{ marginTop: 'var(--space-2xl)' }}>
          <h2 className="section-title" style={{ fontSize: '1.4rem', marginBottom: 'var(--space-lg)' }}>Recent <span>Completed</span></h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {completed.slice(0, 5).map(d => (
              <div key={d.id} style={{
                display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-md) var(--space-lg)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', background: 'var(--bg-card)',
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{d.order.artwork?.title || 'Order'}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'var(--space-sm)' }}>
                    {d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <span className="badge badge-teal">DELIVERED</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
