'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api, { getApiErrorMessage } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Artwork } from '@/types';

export default function ArtistDashboardPage() {
  const router = useRouter();
  const { user, loading } = useRequireAuth();
  const [items, setItems] = useState<Artwork[]>([]);
  const [error, setError] = useState('');
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    if (!loading && user && user.role !== 'ARTIST') {
      router.replace('/');
    }
  }, [loading, user, router]);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<Artwork[]>('/artworks/mine');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ARTIST') {
      void load();
    }
  }, [user?.role, load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this artwork?')) {
      return;
    }
    try {
      await api.delete(`/artworks/${id}`);
      await load();
    } catch (e: unknown) {
      window.alert(getApiErrorMessage(e));
    }
  };

  if (loading || !user) {
    return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;
  }

  if (user.role !== 'ARTIST') {
    return null;
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-md)', alignItems: 'center' }}>
        <h1 className="section-title">Artist <span>Dashboard</span></h1>
        <Link href="/artist/add-artwork" className="btn btn-primary">
          + Add artwork
        </Link>
      </div>

      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
        Manage your listings. New pieces start as pending review before they go live.
      </p>

      {error && (
        <p style={{ color: '#F87171', marginTop: 'var(--space-md)' }}>{error}</p>
      )}

      {listLoading ? (
        <p style={{ marginTop: 'var(--space-xl)' }}>Loading your artworks...</p>
      ) : items.length === 0 ? (
        <div
          style={{
            marginTop: 'var(--space-xl)',
            padding: 'var(--space-2xl)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          No artworks yet.{' '}
          <Link href="/artist/add-artwork" style={{ color: 'var(--saffron)' }}>
            Create your first listing
          </Link>
          .
        </div>
      ) : (
        <div style={{ marginTop: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {items.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 'var(--space-md)',
                alignItems: 'center',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Rs {Number(a.price).toLocaleString('en-IN')} · {a.status}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <Link href={`/artist/add-artwork?id=${a.id}`} className="btn btn-ghost btn-sm">
                  Edit
                </Link>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleDelete(a.id)}>
                  Delete
                </button>
                <Link href={`/art/${a.id}`} className="btn btn-ghost btn-sm">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
