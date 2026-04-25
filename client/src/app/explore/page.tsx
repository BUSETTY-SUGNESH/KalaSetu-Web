'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import ArtCard from '@/components/cards/ArtCard';
import api from '@/lib/api';
import { Artwork } from '@/types';
import styles from './page.module.css';

const CATEGORIES = ['All', 'Painting', 'Sculpture', 'Digital Art', 'Textile', 'Photography', 'Mixed Media'];

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  // sync sort from URL (e.g. coming from home page links)
  useEffect(() => { const s = searchParams.get('sort'); if (s) setSort(s); }, [searchParams]);

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (category !== 'All') params.category = category;
        const res = await api.get<Artwork[]>('/artworks', { params });
        setArtworks(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to fetch artworks', error);
        setArtworks([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchArtworks();
  }, [category]);

  const filtered = useMemo(() => {
    let result = [...artworks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.artist?.user.name || '').toLowerCase().includes(q) ||
          (a.medium || '').toLowerCase().includes(q),
      );
    }

    if (minPrice !== '') {
      const min = Number(minPrice);
      if (!isNaN(min)) result = result.filter((a) => Number(a.price) >= min);
    }
    if (maxPrice !== '') {
      const max = Number(maxPrice);
      if (!isNaN(max)) result = result.filter((a) => Number(a.price) <= max);
    }

    if (sort === 'price_asc') result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price_desc') result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'popular') result.sort((a, b) => b.viewCount - a.viewCount);

    return result;
  }, [artworks, search, minPrice, maxPrice, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCategoryChange = (c: string) => {
    setCategory(c);
    const params = new URLSearchParams(searchParams.toString());
    if (c === 'All') params.delete('category');
    else params.set('category', c);
    router.replace(`/explore?${params.toString()}`);
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <header className={styles.header}>
        <h1 className="section-title">Explore <span>Art</span></h1>
        <p className={styles.subtitle}>Discover authentic masterpieces from across India</p>
      </header>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-lg)' }}>
        <input
          className="input-field"
          placeholder="Search by title, artist, medium..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 'var(--space-md)', alignItems: 'center' }}>
        <input
          className="input-field"
          type="number"
          placeholder="Min price (₹)"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ width: 140 }}
        />
        <input
          className="input-field"
          type="number"
          placeholder="Max price (₹)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ width: 140 }}
        />
        <select
          className="input-field"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ minWidth: 160 }}
        >
          <option value="newest">Newest First</option>
          <option value="popular">Most Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className={styles.filters}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`${styles.filterBtn} ${category === c ? styles.active : ''}`}
            onClick={() => handleCategoryChange(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={styles.resultsBar}>
        <span>{filtered.length} artwork{filtered.length !== 1 ? 's' : ''} found</span>
        {search && <span>Searching for &quot;{search}&quot;</span>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading masterpieces...</div>
      ) : filtered.length > 0 ? (
        <div className="grid-art">
          {filtered.map(art => (
            <ArtCard key={art.id} artwork={art} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No artworks found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem' }}>Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
