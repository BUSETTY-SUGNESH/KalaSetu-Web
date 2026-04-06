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

  const [bidModal, setBidModal] = useState<{ open: boolean; artworkId: string; artworkTitle: string }>({ open: false, artworkId: '', artworkTitle: '' });
  const [bidForm, setBidForm] = useState({ startingPrice: '', minIncrement: '', startsAt: '', endsAt: '' });
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');

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

  const openBidModal = (artwork: Artwork) => {
    setBidError('');
    setBidForm({ startingPrice: String(artwork.price), minIncrement: '100', startsAt: '', endsAt: '' });
    setBidModal({ open: true, artworkId: artwork.id, artworkTitle: artwork.title });
  };

  const handleStartBid = async () => {
    setBidError('');
    if (!bidForm.startingPrice || !bidForm.minIncrement || !bidForm.startsAt || !bidForm.endsAt) {
      setBidError('All fields are required');
      return;
    }
    setBidSubmitting(true);
    try {
      await api.post('/bids', {
        artworkId: bidModal.artworkId,
        startingPrice: Number(bidForm.startingPrice),
        minIncrement: Number(bidForm.minIncrement),
        startsAt: new Date(bidForm.startsAt).toISOString(),
        endsAt: new Date(bidForm.endsAt).toISOString(),
      });
      setBidModal({ open: false, artworkId: '', artworkTitle: '' });
      window.alert('Bid started successfully!');
    } catch (e: unknown) {
      setBidError(getApiErrorMessage(e));
    } finally {
      setBidSubmitting(false);
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
                <button type="button" className="btn btn-primary btn-sm" onClick={() => openBidModal(a)}>
                  Start Bid
                </button>
                <Link href={`/art/${a.id}`} className="btn btn-ghost btn-sm">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {bidModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)',
        }} onClick={() => setBidModal({ open: false, artworkId: '', artworkTitle: '' })}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-2xl)',
            maxWidth: 480, width: '100%', border: '1px solid var(--border-color)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 'var(--space-xs)' }}>
              Start Bid
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
              {bidModal.artworkTitle}
            </p>

            {bidError && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>{bidError}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Starting Price (Rs)</span>
                <input className="input-field" type="number" min={1} value={bidForm.startingPrice}
                  onChange={(e) => setBidForm(f => ({ ...f, startingPrice: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Minimum Increment (Rs)</span>
                <input className="input-field" type="number" min={1} value={bidForm.minIncrement}
                  onChange={(e) => setBidForm(f => ({ ...f, minIncrement: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Starts At</span>
                <input className="input-field" type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={bidForm.startsAt}
                  onChange={(e) => setBidForm(f => ({ ...f, startsAt: e.target.value }))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ends At</span>
                <input className="input-field" type="datetime-local"
                  min={bidForm.startsAt || new Date().toISOString().slice(0, 16)}
                  value={bidForm.endsAt}
                  onChange={(e) => setBidForm(f => ({ ...f, endsAt: e.target.value }))} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setBidModal({ open: false, artworkId: '', artworkTitle: '' })}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={bidSubmitting} onClick={() => void handleStartBid()}>
                {bidSubmitting ? 'Creating...' : 'Start Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
