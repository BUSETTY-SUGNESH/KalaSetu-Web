import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>◆</span>
              <span className={styles.logoText}>Kala<span>Setu</span></span>
            </Link>
            <p className={styles.tagline}>Bridging tradition with technology. India&apos;s premier cultural marketplace.</p>
            <div className={styles.socials}>
              {['Instagram', 'Twitter', 'YouTube', 'LinkedIn'].map(s => (
                <a key={s} href="#" className={styles.socialLink} aria-label={s}>{s[0]}</a>
              ))}
            </div>
          </div>

          <div className={styles.linkGroup}>
            <h4 className={styles.groupTitle}>Marketplace</h4>
            <Link href="/explore">Explore Art</Link>
            <Link href="/bid">Live Bids</Link>
            <Link href="/explore?category=paintings">Paintings</Link>
            <Link href="/explore?category=sculpture">Sculptures</Link>
            <Link href="/explore?category=digital">Digital Art</Link>
          </div>

          <div className={styles.linkGroup}>
            <h4 className={styles.groupTitle}>Community</h4>
            <Link href="/charcha">Charcha Sabha</Link>
            <Link href="/kalent">Events</Link>
            <Link href="/kalent/workshops">Workshops</Link>
            <Link href="/kalent/competitions">Competitions</Link>
          </div>

          <div className={styles.linkGroup}>
            <h4 className={styles.groupTitle}>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Artist Guidelines</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© 2026 KalaSetu. All rights reserved.</p>
          <p>Made with ❤️ for Indian Art & Culture</p>
        </div>
      </div>
    </footer>
  );
}
