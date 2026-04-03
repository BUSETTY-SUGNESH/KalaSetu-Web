'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import styles from '../dashboard/page.module.css';

interface OrderItem {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  trackingNumber?: string | null;
  artwork?: {
    title?: string;
  };
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my');
        setOrders(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      void fetchOrders();
    }
  }, [user]);

  if (authLoading || !user) {
    return <div className="container" style={{ padding: '4rem' }}>Loading orders...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Orders</span></h1>

      {error && <p style={{ color: '#EF4444', marginTop: 'var(--space-md)' }}>{error}</p>}

      {loading ? (
        <div style={{ marginTop: 'var(--space-xl)' }}>Loading order history...</div>
      ) : orders.length === 0 ? (
        <div style={{ marginTop: 'var(--space-xl)', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No orders found for your account.</p>
          <Link href="/explore" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Explore Art</Link>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>{orders.length} orders</p>
          <div className={styles.orderTable}>
            <div className={styles.orderHeader}>
              <span>Order ID</span><span>Artwork</span><span>Status</span><span>Date</span><span>Amount</span>
            </div>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderRow}>
                <span className={styles.orderId}>{order.id.slice(0, 8)}</span>
                <span>{order.artwork?.title || 'Untitled Artwork'}</span>
                <span className="badge badge-teal">{order.status}</span>
                <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className={styles.orderAmount}>Rs {Number(order.totalAmount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
