'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api, { getApiErrorMessage } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface OrderItem {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  trackingNumber?: string | null;
  shippingAddress?: Record<string, string> | null;
  artwork?: { id?: string; title?: string; images?: string[] };
}

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

function OrderTimeline({ status }: { status: string }) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div style={{ padding: '0.75rem 0', color: status === 'CANCELLED' ? '#EF4444' : 'var(--teal-light)', fontSize: '0.85rem', fontWeight: 600 }}>
        {STATUS_LABELS[status] || status}
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '0.75rem 0' }}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? (active ? 'var(--saffron)' : 'var(--teal-light)') : 'var(--bg-secondary)',
                border: `2px solid ${done ? (active ? 'var(--saffron)' : 'var(--teal-light)') : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', color: done ? '#fff' : 'var(--text-muted)', fontWeight: 700,
              }}>
                {done && !active ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.65rem', color: done ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{STATUS_LABELS[step]}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < currentIdx ? 'var(--teal-light)' : 'var(--border-color)', margin: '0 4px', marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnMsg, setReturnMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get<OrderItem[]>('/orders/my')
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(e => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [user]);

  const handleReturn = async () => {
    if (!returnOrderId || !returnReason.trim()) return;
    setReturnSubmitting(true);
    try {
      await api.post(`/orders/${returnOrderId}/return`, { reason: returnReason });
      setReturnMsg('Return request submitted. Our support team will contact you within 24 hours.');
      setReturnOrderId(null); setReturnReason('');
    } catch (e: unknown) {
      setReturnMsg(e instanceof Error ? e.message : 'Failed to submit return request');
    } finally { setReturnSubmitting(false); }
  };

  if (authLoading || !user) return <div className="container" style={{ padding: '4rem' }}>Loading orders...</div>;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Orders</span></h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-xl)' }}>
        {orders.length} order{orders.length !== 1 ? 's' : ''} placed
      </p>

      {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}
      {returnMsg && <p style={{ color: 'var(--teal-light)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>{returnMsg}</p>}

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading order history...</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>No orders yet.</p>
          <Link href="/explore" className="btn btn-primary">Explore Art</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {orders.map((order) => (
            <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Artwork preview */}
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                    {order.artwork?.images?.[0] ? (
                      <img src={order.artwork.images[0]} alt={order.artwork.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎨</div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{order.artwork?.title || 'Artwork'}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>Order #{order.id.slice(0, 8)}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</div>
                  {order.trackingNumber && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Track: {order.trackingNumber}</div>}
                </div>
              </div>

              {/* Timeline */}
              <OrderTimeline status={order.status} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginTop: 'var(--space-sm)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-sm)' }}>
                {order.artwork?.id && (
                  <Link href={`/art/${order.artwork.id}`} className="btn btn-ghost btn-sm">View Artwork</Link>
                )}
                {order.status === 'DELIVERED' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setReturnOrderId(order.id); setReturnMsg(''); }}>
                    Request Return
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Return modal */}
      {returnOrderId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)' }}
          onClick={() => setReturnOrderId(null)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)', maxWidth: 480, width: '100%', border: '1px solid var(--border-color)' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Request Return</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)' }}>Please describe the reason for your return request.</p>
            <textarea className="input-field" rows={4} placeholder="e.g. Artwork damaged during shipping, incorrect item received..." value={returnReason} onChange={e => setReturnReason(e.target.value)} />
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-ghost" onClick={() => setReturnOrderId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => void handleReturn()} disabled={returnSubmitting || !returnReason.trim()}>
                {returnSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
