'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

const roleDashboardMap: Record<string, string> = {
  CUSTOMER: '/dashboard/customer',
  BUYER: '/dashboard/customer',
  ARTIST: '/dashboard/artist',
  DELIVERY: '/dashboard/delivery',
  MANAGER: '/dashboard/manager',
  SUPPORT: '/dashboard/support',
  ADMIN: '/dashboard/admin',
};

export default function DashboardPage() {
  const { user, loading, hasMultipleRoles, switchRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Single role → auto redirect
    if (!hasMultipleRoles) {
      const target = roleDashboardMap[user.role] || '/dashboard/customer';
      router.replace(target);
    }
  }, [user, loading, hasMultipleRoles, router]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem' }}>Loading account...</div>;
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem' }}>
        Please <Link href="/login" style={{ color: 'var(--saffron)' }}>sign in</Link> to view your dashboard.
      </div>
    );
  }

  // Multi-role user: show role selector
  if (hasMultipleRoles) {
    const handleSelect = async (role: UserRole) => {
      try {
        await switchRole(role);
        const target = roleDashboardMap[role] || '/dashboard/customer';
        router.push(target);
      } catch (err) {
        console.error('Role switch failed:', err);
      }
    };

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: 'var(--space-3xl)' }}>
        <h1 className="section-title" style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          Welcome, <span>{user.name}</span>
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
          You have multiple roles. Select one to continue:
        </p>

        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {user.roles.map((role) => (
            <button
              key={role}
              onClick={() => void handleSelect(role)}
              className="btn btn-ghost"
              style={{
                padding: 'var(--space-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                fontSize: '1rem',
                border: role === user.role ? '2px solid var(--saffron)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>
                {role === 'CUSTOMER' || role === 'BUYER' ? '🛒' :
                 role === 'ARTIST' ? '🎨' :
                 role === 'DELIVERY' ? '🚚' :
                 role === 'MANAGER' ? '📊' :
                 role === 'SUPPORT' ? '🎫' :
                 role === 'ADMIN' ? '👑' : '👤'}
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {role === 'BUYER' ? 'Customer' : role.charAt(0) + role.slice(1).toLowerCase()}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {role === 'CUSTOMER' || role === 'BUYER' ? 'Browse, buy, and bid on art' :
                   role === 'ARTIST' ? 'Manage artwork and sales' :
                   role === 'DELIVERY' ? 'Handle deliveries' :
                   role === 'MANAGER' ? 'Oversee operations' :
                   role === 'SUPPORT' ? 'Resolve support tickets' :
                   role === 'ADMIN' ? 'Full system access' : 'Dashboard access'}
                </div>
              </div>
              {role === user.role && (
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--saffron)' }}>Active</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <div className="container" style={{ padding: '4rem' }}>Redirecting...</div>;
}
