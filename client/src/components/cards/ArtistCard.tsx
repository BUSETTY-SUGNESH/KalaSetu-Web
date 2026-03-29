import Link from 'next/link';
import styles from './Cards.module.css';
import { Artist } from '@/types';

export default function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link href={`/artist/${artist.id}`} className={`card ${styles.artistCard}`}>
      <div className={styles.artistAvatar} style={{ background: `hsl(${artist.name.length * 37 % 360}, 45%, 30%)` }}>
        <span>{artist.name.split(' ').map(n => n[0]).join('')}</span>
      </div>
      <h3 className={styles.artistName}>{artist.name}</h3>
      <p className={styles.artistSpecialty}>{artist.specialty}</p>
      <div className={styles.artistStats}>
        <span>⭐ {artist.rating}</span>
        <span>•</span>
        <span>{artist.totalSales} sold</span>
      </div>
      <span className={styles.artistRegion}>{artist.region}</span>
    </Link>
  );
}
