'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getPaymentErrorMessage } from '@/lib/payment';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import styles from './page.module.css';

export default function CharchaCreatePage() {
  const router = useRouter();
  const { user, loading } = useRequireAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [artworkId, setArtworkId] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const tags = tagsRaw
      .split(/[,#]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);
    const trimmedArt = artworkId.trim();
    setSaving(true);
    try {
      const res = await api.post('/discussions', {
        title: title.trim(),
        body: body.trim(),
        artworkId: trimmedArt ? trimmedArt : undefined,
        tags: tags.length ? tags : undefined,
      });
      router.push(`/charcha/${res.data.id}`);
    } catch (err: unknown) {
      setError(getPaymentErrorMessage(err) || 'Could not create topic');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <h1 className="section-title">New <span>Topic</span></h1>
        <Link href="/charcha" className="btn btn-ghost">← Back to Charcha</Link>
      </div>

      <div className={styles.card}>
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 'var(--space-lg)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#F87171',
            }}
          >
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          <div className="input-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to discuss?"
              required
              minLength={3}
            />
          </div>
          <div className="input-group">
            <label htmlFor="body">Description</label>
            <textarea
              id="body"
              className="input-field"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share context, questions, or ideas"
              required
              minLength={5}
              rows={6}
            />
          </div>
          <div className="input-group">
            <label htmlFor="artworkId">Artwork reference (optional)</label>
            <input
              id="artworkId"
              className="input-field"
              value={artworkId}
              onChange={(e) => setArtworkId(e.target.value)}
              placeholder="Paste an artwork ID to tie this to a listing"
            />
            <p className={styles.hint}>Must be a valid artwork UUID from the platform.</p>
          </div>
          <div className="input-group">
            <label htmlFor="tags">Tags (optional)</label>
            <input
              id="tags"
              className="input-field"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="abstract, sculpture, bids"
            />
            <p className={styles.hint}>Separate with commas. Up to 8 tags.</p>
          </div>
          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Publishing...' : 'Publish topic'}
            </button>
            <Link href="/charcha" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
