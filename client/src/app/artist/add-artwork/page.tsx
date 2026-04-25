'use client';

import { ChangeEvent, FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { getApiErrorMessage } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabase';

function AddArtworkForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { user, loading: authLoading } = useRequireAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Painting');
  const [medium, setMedium] = useState('');
  const [images, setImages] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingArt, setLoadingArt] = useState(Boolean(editId));

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ARTIST') {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!editId) {
      setLoadingArt(false);
      return;
    }

    const load = async () => {
      try {
        const res = await api.get(`/artworks/mine/${editId}`);
        const a = res.data as {
          title: string;
          description?: string | null;
          price: number;
          category: string;
          medium?: string | null;
          images: unknown;
        };
        setTitle(a.title);
        setDescription(a.description || '');
        setPrice(String(a.price));
        setCategory(a.category);
        setMedium(a.medium || '');
        const raw = a.images;
        const arr = Array.isArray(raw) ? raw.map(String) : [];
        setImages(arr.join(', '));
      } catch (e: unknown) {
        setError(getApiErrorMessage(e));
      } finally {
        setLoadingArt(false);
      }
    };

    void load();
  }, [editId]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(fileName, file);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from('artworks')
      .getPublicUrl(fileName);

    setImages(publicUrl.publicUrl);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const priceNum = Number(price);
    const imageList = images
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!title.trim() || !Number.isFinite(priceNum) || priceNum <= 0 || imageList.length === 0) {
      setError('Title, positive price, and at least one image URL are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        category: category.trim(),
        medium: medium.trim() || undefined,
        images: imageList,
      };
      if (editId) {
        await api.put(`/artworks/${editId}`, payload);
      } else {
        await api.post('/artworks', payload);
      }
      router.push('/artist-dashboard');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;
  }

  if (user.role !== 'ARTIST') {
    return null;
  }

  if (loadingArt) {
    return <div className="container" style={{ padding: '4rem' }}>Loading artwork...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)', maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <h1 className="section-title">{editId ? 'Edit' : 'Add'} <span>Artwork</span></h1>
        <Link href="/artist-dashboard" className="btn btn-ghost">
          ← Dashboard
        </Link>
      </div>

      {error && <p style={{ color: '#F87171', marginTop: 'var(--space-md)' }}>{error}</p>}

      <form onSubmit={(e) => void handleSubmit(e)} style={{ marginTop: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div className="input-group">
          <label htmlFor="title">Title</label>
          <input id="title" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" className="input-field" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="input-group">
          <label htmlFor="price">Price (Rs)</label>
          <input id="price" type="number" min={1} step="0.01" className="input-field" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="input-group">
          <label htmlFor="category">Category</label>
          <select id="category" className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} required>
            {['Painting', 'Sculpture', 'Digital Art', 'Textile', 'Photography', 'Mixed Media'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="medium">Medium (optional)</label>
          <input id="medium" className="input-field" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="Oil on canvas" />
        </div>
        <div className="input-group">
          <label>Upload Artwork Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="input-field"
          />
        </div>
        <div className="input-group">
          <label htmlFor="images">Image URL</label>
          <input
            id="images"
            className="input-field"
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="Upload an image above or paste a URL"
            required
          />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Auto-filled after upload, or paste a URL manually.</p>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : editId ? 'Save changes' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}

export default function AddArtworkPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem' }}>Loading...</div>}>
      <AddArtworkForm />
    </Suspense>
  );
}

