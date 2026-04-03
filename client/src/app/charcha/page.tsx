'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DiscussionCard from '@/components/cards/DiscussionCard';
import api from '@/lib/api';
import { Discussion } from '@/types';
import styles from './page.module.css';

export default function CharchaPage() {
  const [sort, setSort] = useState('trending');
  const [activeTag, setActiveTag] = useState('all');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const res = await api.get('/discussions', { params: { sort } });
        setDiscussions(Array.isArray(res.data) ? res.data : []);
      } finally {
        setLoading(false);
      }
    };

    void fetchDiscussions();
  }, [sort]);

  const allTags = useMemo(() => ['all', ...new Set(discussions.flatMap((discussion) => discussion.tags))], [discussions]);
  const sorted = [...discussions].sort((a, b) =>
    sort === 'trending' ? b.upvotes - a.upvotes : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const filtered = activeTag === 'all' ? sorted : sorted.filter(d => d.tags.includes(activeTag));

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title">Charcha <span>Sabha</span></h1>
          <p className={styles.subtitle}>Join India&apos;s art community in meaningful discussions</p>
        </div>
        <Link href="/charcha/create" className="btn btn-primary">+ New Topic</Link>
      </div>

      <div className={styles.controls}>
        <div className="tabs" style={{ border: 'none', flex: 1 }}>
          <button className={`tab ${sort === 'trending' ? 'active' : ''}`} onClick={() => setSort('trending')}>🔥 Trending</button>
          <button className={`tab ${sort === 'newest' ? 'active' : ''}`} onClick={() => setSort('newest')}>🕐 Newest</button>
        </div>
        <div className={styles.tagFilters}>
          {allTags.map(tag => (
            <button key={tag} className={`tag ${activeTag === tag ? 'active' : ''}`} onClick={() => setActiveTag(tag)}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>Loading discussions...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No discussions yet</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((discussion) => <DiscussionCard key={discussion.id} discussion={discussion} />)}
        </div>
      )}
    </div>
  );
}
