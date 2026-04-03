'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const isArtist = user?.role === 'ARTIST';
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore' },
    { href: '/bid', label: 'Bids' },
    { href: '/charcha', label: 'Charcha Sabha' },
    { href: '/kalent', label: 'Kalent' },
  ];

  return (
    <header className={`${styles.navbar} glass`}>
      <div className={`${styles.inner} container`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span className={styles.logoText}>Kala<span>Setu</span></span>
        </Link>

        <div className={`${styles.searchBar} ${searchOpen ? styles.searchOpen : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search art, artists, events..."
            className={styles.searchInput}
          />
        </div>

        <nav className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <Link href="/wishlist" className={styles.actionBtn} aria-label="Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span className={styles.actionBadge}>3</span>
          </Link>
          <Link href="/wallet" className={styles.actionBtn} aria-label="Wallet">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="14" r="1.5"/></svg>
          </Link>
          <button className={styles.actionBtn} aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className={styles.actionBadge}>5</span>
          </button>

          {!loading && !isAuthenticated && (
            <Link href="/login" className={`btn btn-primary btn-sm ${styles.loginBtn}`}>Sign In</Link>
          )}

          {!loading && isAuthenticated && (
            <div className={styles.profileMenuWrapper}>
              <button
                className={styles.profileButton}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-label="Profile menu"
              >
                <span className={styles.profileAvatar}>{userInitials}</span>
                <span className={styles.profileName}>{user?.name?.split(' ')[0]}</span>
              </button>

              <div className={`${styles.profileMenu} ${profileMenuOpen ? styles.profileMenuOpen : ''}`}>
                <Link href="/profile" className={styles.profileMenuItem}>Profile</Link>
                <Link href="/dashboard" className={styles.profileMenuItem}>
                  {isArtist ? 'Artist hub' : 'Dashboard'}
                </Link>
                {isArtist && (
                  <Link href="/artist-dashboard" className={styles.profileMenuItem} onClick={() => setProfileMenuOpen(false)}>
                    Artist dashboard
                  </Link>
                )}
                {isArtist && (
                  <Link href="/profile?tab=listings" className={styles.profileMenuItem} onClick={() => setProfileMenuOpen(false)}>
                    My listings
                  </Link>
                )}
                {!isArtist && (
                  <Link href="/orders" className={styles.profileMenuItem} onClick={() => setProfileMenuOpen(false)}>
                    My orders
                  </Link>
                )}
                <button className={styles.profileMenuItem} onClick={handleLogout}>Logout</button>
              </div>
            </div>
          )}

          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`}/>
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`}/>
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`}/>
          </button>
        </div>
      </div>
    </header>
  );
}
