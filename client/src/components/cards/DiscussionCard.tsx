import Link from 'next/link';
import styles from './Cards.module.css';
import { Discussion } from '@/types';

export default function DiscussionCard({ discussion }: { discussion: Discussion }) {
  return (
    <Link href={`/charcha/${discussion.id}`} className={`card ${styles.discussionCard}`}>
      <div className={styles.discussionLeft}>
        <div className={styles.discussionVotes}>
          <button className={styles.voteBtn} onClick={e => e.preventDefault()}>▲</button>
          <span>{discussion.upvotes}</span>
        </div>
      </div>
      <div className={styles.discussionContent}>
        <div className={styles.discussionHeader}>
          {discussion.isPinned && <span className={`badge badge-gold`}>📌 Pinned</span>}
          <h3 className={styles.discussionTitle}>{discussion.title}</h3>
        </div>
        <p className={styles.discussionBody}>{discussion.body}</p>
        <div className={styles.discussionMeta}>
          <span className={styles.discussionAuthor}>{discussion.authorName}</span>
          <span>•</span>
          <span>{discussion.replyCount} replies</span>
          <span>•</span>
          <span>{new Date(discussion.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
        </div>
        <div className={styles.discussionTags}>
          {discussion.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
