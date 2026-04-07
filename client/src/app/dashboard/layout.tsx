'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import styles from './layout.module.css';

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const navByRole: Record<string, NavItem[]> = {
  CUSTOMER: [
    { icon: '🏠', label: 'Overview', href: '/dashboard/customer' },
    { icon: '📦', label: 'My Orders', href: '/orders' },
    { icon: '❤️', label: 'Wishlist', href: '/wishlist' },
    { icon: '💰', label: 'Wallet', href: '/wallet' },
  ],
  ARTIST: [
    { icon: '🎨', label: 'Overview', href: '/dashboard/artist' },
    { icon: '🖼️', label: 'My Artworks', href: '/artist-dashboard' },
    { icon: '➕', label: 'Add Artwork', href: '/artist/add-artwork' },
    { icon: '📦', label: 'Orders', href: '/orders' },
    { icon: '💰', label: 'Wallet', href: '/wallet' },
  ],
  DELIVERY: [
    { icon: '🚚', label: 'Overview', href: '/dashboard/delivery' },
  ],
  MANAGER: [
    { icon: '📊', label: 'Overview', href: '/dashboard/manager' },

  ],
  SUPPORT: [
    { icon: '🎫', label: 'Overview', href: '/dashboard/support' },
  ],
  ADMIN: [
    { icon: '👑', label: 'Overview', href: '/dashboard/admin' },
  ],
};

const commonNavByRole: Record<string, NavItem[]> = {
  CUSTOMER: [
    { icon: '🔍', label: 'Explore', href: '/explore' },
    { icon: '💬', label: 'Charcha', href: '/charcha' },
    { icon: '📅', label: 'Kalent', href: '/kalent' },
    { icon: '👤', label: 'Profile', href: '/profile' },
  ],
  ARTIST: [
    { icon: '🔍', label: 'Explore', href: '/explore' },
    { icon: '💬', label: 'Charcha', href: '/charcha' },
    { icon: '📅', label: 'Kalent', href: '/kalent' },
    { icon: '👤', label: 'Profile', href: '/profile' },
  ],
  DELIVERY: [
    { icon: '👤', label: 'Profile', href: '/profile' },
  ],
  MANAGER: [
    { icon: '', label: 'Profile', href: '/profile' },
  ],
  SUPPORT: [
    { icon: '👤', label: 'Profile', href: '/profile' },
  ],
  ADMIN: [
    { icon: '👤', label: 'Profile', href: '/profile' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, switchRole, hasMultipleRoles } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <div className="container" style={{ padding: '4rem' }}>Loading...</div>;
  }

  if (!user) {
    return <div className="container" style={{ padding: '4rem' }}>Please sign in to access the dashboard.</div>;
  }

  const activeRole = user.role as string;
  const roleNav = navByRole[activeRole] || navByRole.CUSTOMER;

  const handleRoleSwitch = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      await switchRole(e.target.value as UserRole);
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarUserName}>{user.name}</div>
          <div className={styles.sidebarRole}>{activeRole.toLowerCase()}</div>

          {hasMultipleRoles && (
            <div className={styles.roleSelector}>
              <select value={activeRole} onChange={handleRoleSwitch}>
                {user.roles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={styles.navGroup}>
          <div className={styles.navGroupTitle}>Dashboard</div>
          {roleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.navGroup}>
          <div className={styles.navGroupTitle}>Platform</div>
          {(commonNavByRole[activeRole] || commonNavByRole.CUSTOMER).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
