'use client';
import { use } from 'react';
import Link from 'next/link';
import { mockDiscussions } from '@/lib/mockData';
import styles from './page.module.css';

export default function TopicDetailPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);
  const discussion = mockDiscussions.find(d => d.id === topicId) || mockDiscussions[0];

  const replies = [
    { author: 'Meera Nair', body: 'I use Museum Glass for all my watercolors. The UV protection is excellent and it maintains color vibrancy for years.', upvotes: 12, time: '1 day ago' },
    { author: 'Arjun Desai', body: 'Great question! I would also recommend proper matting with acid-free materials. This prevents the paper from touching the glass.', upvotes: 8, time: '1 day ago' },
    { author: 'Vikram Singh', body: 'For humid climates, consider silica gel packets inside the frame. This has saved many of my works from moisture damage.', upvotes: 6, time: '22 hours ago' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <Link href="/charcha" className={styles.back}>← Back to Charcha Sabha</Link>

      <article className={styles.topic}>
        <div className={styles.topicHeader}>
          <div className={styles.authorRow}>
            <div className={styles.avatar} style={{ background: `hsl(${discussion.authorName.length * 37 % 360}, 45%, 30%)` }}>{discussion.authorName[0]}</div>
            <div><span className={styles.authorName}>{discussion.authorName}</span><span className={styles.time}>{new Date(discussion.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
          </div>
          {discussion.isPinned && <span className="badge badge-gold">📌 Pinned</span>}
        </div>
        <h1 className={styles.title}>{discussion.title}</h1>
        <p className={styles.body}>{discussion.body}</p>
        <div className={styles.tags}>{discussion.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
        <div className={styles.stats}>
          <button className={styles.voteBtn}>▲ {discussion.upvotes}</button>
          <span>{discussion.replyCount} replies</span>
        </div>
      </article>

      <div className={styles.replySection}>
        <h2 className={styles.replyTitle}>Replies ({replies.length})</h2>
        {replies.map((r, i) => (
          <div key={i} className={styles.reply}>
            <div className={styles.replyHeader}>
              <div className={styles.avatar} style={{ background: `hsl(${r.author.length * 47 % 360}, 45%, 30%)` }}>{r.author[0]}</div>
              <div><span className={styles.authorName}>{r.author}</span><span className={styles.time}>{r.time}</span></div>
            </div>
            <p className={styles.replyBody}>{r.body}</p>
            <button className={styles.voteBtn}>▲ {r.upvotes}</button>
          </div>
        ))}

        <div className={styles.replyForm}>
          <h3>Add your reply</h3>
          <textarea className={`input-field ${styles.textarea}`} rows={4} placeholder="Share your thoughts..." />
          <button className="btn btn-primary">Post Reply</button>
        </div>
      </div>
    </div>
  );
}
