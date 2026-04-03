'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import styles from './page.module.css';

interface DiscussionReply {
  id: string;
  authorName: string;
  body: string;
  upvotes: number;
  createdAt: string;
}

interface DiscussionDetail {
  id: string;
  title: string;
  body: string;
  authorName: string;
  tags: string[];
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: string;
  replies: DiscussionReply[];
}

export default function TopicDetailPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId;
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const res = await api.get(`/discussions/${topicId}`);
        setDiscussion(res.data);
      } catch {
        setDiscussion(null);
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      void fetchDiscussion();
    }
  }, [topicId]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem' }}>Loading discussion...</div>;
  }

  if (!discussion) {
    return <div className="container" style={{ padding: '4rem' }}>Discussion not found.</div>;
  }

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
        <h2 className={styles.replyTitle}>Replies ({discussion.replies.length})</h2>
        {discussion.replies.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No reviews yet</p>
        ) : discussion.replies.map((reply) => (
          <div key={reply.id} className={styles.reply}>
            <div className={styles.replyHeader}>
              <div className={styles.avatar} style={{ background: `hsl(${reply.authorName.length * 47 % 360}, 45%, 30%)` }}>{reply.authorName[0]}</div>
              <div><span className={styles.authorName}>{reply.authorName}</span><span className={styles.time}>{new Date(reply.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
            </div>
            <p className={styles.replyBody}>{reply.body}</p>
            <button className={styles.voteBtn}>▲ {reply.upvotes}</button>
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
