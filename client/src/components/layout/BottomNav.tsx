'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './BottomNav.module.css';

const I = {
  home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  explore: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  bid: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>,
  wishlist: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  wallet: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="14" r="1.5"/></svg>,
  profile: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  dash: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  signIn: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  studio: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  truck: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  ticket: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  kalent: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

export default function BottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const role = user?.role ?? '';

  const tabs = (() => {
    if (!isAuthenticated) {
      return [
        { href: '/', label: 'Home', icon: I.home },
        { href: '/explore', label: 'Explore', icon: I.explore },
        { href: '/bid', label: 'Bids', icon: I.bid },
        { href: '/kalent', label: 'Kalent', icon: I.kalent },
        { href: '/login', label: 'Sign In', icon: I.signIn },
      ];
    }
    switch (role) {
      case 'CUSTOMER': return [
        { href: '/', label: 'Home', icon: I.home },
        { href: '/explore', label: 'Explore', icon: I.explore },
        { href: '/bid', label: 'Bids', icon: I.bid },
        { href: '/wishlist', label: 'Wishlist', icon: I.wishlist },
        { href: '/dashboard/customer', label: 'Dashboard', icon: I.dash },
      ];
      case 'ARTIST': return [
        { href: '/', label: 'Home', icon: I.home },
        { href: '/explore', label: 'Explore', icon: I.explore },
        { href: '/dashboard/artist', label: 'Studio', icon: I.studio },
        { href: '/wallet', label: 'Wallet', icon: I.wallet },
        { href: '/profile', label: 'Profile', icon: I.profile },
      ];
      case 'ADMIN': return [
        { href: '/', label: 'Home', icon: I.home },
        { href: '/dashboard/admin', label: 'Console', icon: I.dash },
        { href: '/profile', label: 'Profile', icon: I.profile },
      ];
      case 'MANAGER': return [
        { href: '/', label: 'Home', icon: I.home },
        { href: '/dashboard/manager', label: 'Ops', icon: I.dash },
        { href: '/profile', label: 'Profile', icon: I.profile },
      ];
      case 'SUPPORT': return [
        { href: '/', label: 'Home', icon: I.home },
        { href: '/dashboard/support', label: 'Tickets', icon: I.ticket },
        { href: '/profile', label: 'Profile', icon: I.profile },
      ];
      case 'DELIVERY': return [
        { href: '/', label: 'Home', icon: I.home },
        { href: '/dashboard/delivery', label: 'Deliveries', icon: I.truck },
        { href: '/profile', label: 'Profile', icon: I.profile },
      ];
      default: return [
        { href: '/', label: 'Home', icon: I.home },
        { href: '/explore', label: 'Explore', icon: I.explore },
        { href: '/bid', label: 'Bids', icon: I.bid },
        { href: '/kalent', label: 'Kalent', icon: I.kalent },
        { href: '/profile', label: 'Profile', icon: I.profile },
      ];
    }
  })();

  return (
    <nav className={styles.bottomNav}>
      {tabs.map(tab => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={`${styles.tab} ${isActive ? styles.active : ''}`}>
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
            {isActive && <span className={styles.indicator}/>}
          </Link>
        );
      })}
    </nav>
  );
}
