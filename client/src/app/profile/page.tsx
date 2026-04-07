'use client';

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { getPaymentErrorMessage } from '@/lib/payment';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import styles from './page.module.css';

type ProfileTab = 'info' | 'wallet' | 'purchases' | 'listings' | 'discussions';

interface ProfileOverview {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
  wallet: { id: string; balance: number; updatedAt: string } | null;
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    description?: string | null;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    purpose: string;
    status: string;
    createdAt: string;
  }>;
  purchases: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    artwork: { id: string; title: string; status: string };
  }>;
  listings: Array<{
    id: string;
    title: string;
    price: number;
    status: string;
    createdAt: string;
  }>;
  discussions: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
  }>;
  earnings: number;
}

const tabFromParam = (raw: string | null): ProfileTab | null => {
  if (!raw) return null;
  if (['info', 'wallet', 'purchases', 'listings', 'discussions'].includes(raw)) {
    return raw as ProfileTab;
  }
  return null;
};

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useRequireAuth();
  const { refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [overview, setOverview] = useState<ProfileOverview | null>(null);
  const [overviewError, setOverviewError] = useState('');
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [tab, setTab] = useState<ProfileTab>('info');

  useEffect(() => {
    const next = tabFromParam(searchParams.get('tab'));
    if (next) {
      setTab(next);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name || '');
    setPhone(user.phone || '');
    setAvatarUrl(user.avatarUrl || '');
  }, [user]);

  const loadOverview = useCallback(async () => {
    if (!user) {
      return;
    }
    setOverviewError('');
    setOverviewLoading(true);
    try {
      const res = await api.get<ProfileOverview>('/users/profile/overview');
      setOverview(res.data);
    } catch (err: unknown) {
      const msg = getPaymentErrorMessage(err) || 'Failed to load profile data';
      setOverviewError(msg);
      setOverview({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        wallet: user.wallet ?? null,
        transactions: [],
        payments: [],
        purchases: [],
        listings: [],
        discussions: [],
        earnings: 0,
      });
    } finally {
      setOverviewLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadOverview();
    }
  }, [user, loadOverview]);

  const displayRole = useMemo(() => {
    if (!user?.role) return '';
    return user.role;
  }, [user?.role]);

  const isArtist = displayRole === 'ARTIST';

  const initials = useMemo(() => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [name]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.put('/users/profile', {
        name,
        phone,
        avatarUrl,
      });
      await refreshProfile();
      await loadOverview();
      setSuccess('Profile updated successfully.');
    } catch (err: unknown) {
      setError(getPaymentErrorMessage(err) || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="container" style={{ padding: '4rem' }}>Loading profile...</div>;
  }

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'info', label: 'Account' },
    { id: 'wallet', label: 'Wallet & activity' },
    { id: 'purchases', label: 'My purchases' },
    ...(isArtist ? [{ id: 'listings' as const, label: 'My listings' }] : []),
    { id: 'discussions', label: 'My discussions' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Profile</span></h1>

      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {overviewError && (
        <p style={{ color: '#F87171', marginTop: 'var(--space-md)' }}>{overviewError}</p>
      )}

      {tab === 'info' && (
        <div className={styles.panel}>
          <div className={styles.card}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>{initials}</div>
              <div>
                <p style={{ marginBottom: 'var(--space-xs)', fontWeight: 600 }}>{user.email}</p>
                <p className={styles.muted}>Role: {displayRole}</p>
                <p className={styles.muted}>Verified: {user.isVerified ? 'Yes' : 'No'}</p>
                {isArtist && overview && (
                  <p className={styles.muted}>
                    Lifetime earnings (confirmed orders): Rs {Number(overview.earnings || 0).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            {error && <p style={{ color: '#EF4444', marginBottom: 'var(--space-md)' }}>{error}</p>}
            {success && <p style={{ color: 'var(--teal-light)', marginBottom: 'var(--space-md)' }}>{success}</p>}

            <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
              <div className={styles.row}>
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" className="input-field" value={user.email} disabled />
                </div>
              </div>

              <div className={styles.row}>
                <div className="input-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    className="input-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="avatarUrl">Avatar URL</label>
                  <input
                    id="avatarUrl"
                    className="input-field"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'wallet' && (
        <div className={styles.panel}>
          <div className={styles.card}>
            {overviewLoading ? (
              <p className={styles.muted}>Loading wallet...</p>
            ) : (
              <>
                <p style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                  Balance: Rs {Number(overview?.wallet?.balance ?? user.wallet?.balance ?? 0).toLocaleString('en-IN')}
                </p>
                <p className={styles.muted} style={{ marginBottom: 'var(--space-lg)' }}>
                  Top up or spend from the <Link href="/wallet" style={{ color: 'var(--saffron)' }}>wallet page</Link>.
                </p>
                <h2 style={{ fontSize: '1.05rem', marginBottom: 'var(--space-md)' }}>Wallet transactions</h2>
                {!overview?.transactions?.length ? (
                  <p className={styles.muted}>No wallet transactions yet.</p>
                ) : (
                  <div className={styles.list}>
                    {overview.transactions.map((tx) => (
                      <div key={tx.id} className={styles.listItem}>
                        <div>
                          <div className={styles.listTitle}>{tx.description || tx.type}</div>
                          <div className={styles.muted}>{new Date(tx.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={styles.badge}>{tx.status}</span>
                          <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
                            {tx.type === 'CREDIT' ? '+' : '-'}Rs {Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h2 style={{ fontSize: '1.05rem', margin: 'var(--space-xl) 0 var(--space-md)' }}>Payment history</h2>
                {!overview?.payments?.length ? (
                  <p className={styles.muted}>No payments recorded.</p>
                ) : (
                  <div className={styles.list}>
                    {overview.payments.map((p) => (
                      <div key={p.id} className={styles.listItem}>
                        <div>
                          <div className={styles.listTitle}>{p.purpose.replace(/_/g, ' ')}</div>
                          <div className={styles.muted}>{new Date(p.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={styles.badge}>{p.status}</span>
                          <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
                            Rs {Number(p.amount).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'purchases' && (
        <div className={styles.panel}>
          <div className={styles.card}>
            {overviewLoading ? (
              <p className={styles.muted}>Loading purchases...</p>
            ) : !overview?.purchases?.length ? (
              <p className={styles.muted}>No purchases yet. <Link href="/explore" style={{ color: 'var(--saffron)' }}>Explore art</Link></p>
            ) : (
              <div className={styles.list}>
                {overview.purchases.map((order) => (
                  <div key={order.id} className={styles.listItem}>
                    <div>
                      <div className={styles.listTitle}>{order.artwork?.title || 'Artwork'}</div>
                      <div className={styles.muted}>{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={styles.badge}>{order.status}</span>
                      <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
                        Rs {Number(order.totalAmount).toLocaleString('en-IN')}
                      </div>
                      <Link href={`/art/${order.artwork?.id}`} className="btn btn-ghost" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        View artwork
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'listings' && isArtist && (
        <div className={styles.panel}>
          <div className={styles.card}>
            {overviewLoading ? (
              <p className={styles.muted}>Loading listings...</p>
            ) : !overview?.listings?.length ? (
              <p className={styles.muted}>
                No listings yet. Listings are created via the artwork APIs (studio tools coming next).
              </p>
            ) : (
              <div className={styles.list}>
                {overview.listings.map((art) => (
                  <div key={art.id} className={styles.listItem}>
                    <div>
                      <div className={styles.listTitle}>{art.title}</div>
                      <div className={styles.muted}>{new Date(art.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={styles.badge}>{art.status}</span>
                      <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
                        Rs {Number(art.price).toLocaleString('en-IN')}
                      </div>
                      <Link href={`/art/${art.id}`} className="btn btn-ghost" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'discussions' && (
        <div className={styles.panel}>
          <div className={styles.card}>
            {overviewLoading ? (
              <p className={styles.muted}>Loading discussions...</p>
            ) : !overview?.discussions?.length ? (
              <p className={styles.muted}>
                You have not started a topic yet.{' '}
                <Link href="/charcha/create" style={{ color: 'var(--saffron)' }}>Create one</Link>
              </p>
            ) : (
              <div className={styles.list}>
                {overview.discussions.map((d) => (
                  <div key={d.id} className={styles.listItem}>
                    <div>
                      <div className={styles.listTitle}>{d.title}</div>
                      <div className={styles.muted}>{new Date(d.createdAt).toLocaleString()}</div>
                    </div>
                    <Link href={`/charcha/${d.id}`} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem' }}>Loading profile...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
