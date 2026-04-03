'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthContext';
import { getPaymentErrorMessage, isRazorpayPublicKeyConfigured, startPayment } from '@/lib/payment';
import styles from './page.module.css';

interface WalletPayment {
  id: string;
  amount: number;
  purpose: 'ORDER' | 'WALLET_TOPUP' | 'SUBSCRIPTION' | 'PREMIUM_FEATURE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  order?: {
    artwork?: {
      title?: string;
    };
  };
}

export default function WalletPage() {
  const { refreshProfile } = useAuth();
  const { user, loading: authLoading } = useRequireAuth();
  const [payments, setPayments] = useState<WalletPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [paying, setPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  const fetchWalletData = async () => {
    try {
      const res = await api.get('/payments/my');
      setPayments(res.data);
    } catch (err: unknown) {
      setError(getPaymentErrorMessage(err) || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchWalletData();
    }
  }, [user]);

  const handleAddFunds = async () => {
    const amount = Number(topUpAmount);
    setError('');
    setPaymentMessage('');

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setPaying(true);
    try {
      await startPayment({
        payload: {
          purpose: 'WALLET_TOPUP',
          amount,
        },
        name: 'KalaSetu Wallet',
        description: 'Wallet Top-up',
        onSuccess: async () => {
          await refreshProfile();
          await fetchWalletData();
          setPaymentMessage('Wallet top-up completed successfully.');
        },
      });
    } catch (err: unknown) {
      setError(getPaymentErrorMessage(err) || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const transactions = useMemo(
    () =>
      payments.slice(0, 12).map((payment) => ({
        id: payment.id,
        desc:
          payment.purpose === 'WALLET_TOPUP'
            ? 'Wallet top-up'
            : `Order payment - ${payment.order?.artwork?.title || 'Artwork'}`,
        amount: payment.purpose === 'WALLET_TOPUP' ? Math.abs(Number(payment.amount)) : -Math.abs(Number(payment.amount)),
        date: new Date(payment.createdAt).toLocaleDateString(),
        status: payment.status,
      })),
    [payments],
  );

  if (authLoading || !user) {
    return <div className="container" style={{ padding: '4rem' }}>Loading wallet...</div>;
  }

  const razorpayReady = isRazorpayPublicKeyConfigured();

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Wallet</span></h1>

      {!razorpayReady && (
        <div
          role="status"
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md) var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(250, 204, 21, 0.35)',
            background: 'rgba(250, 204, 21, 0.08)',
            color: '#EAB308',
          }}
        >
          Add <code style={{ fontSize: '0.85em' }}>NEXT_PUBLIC_RAZORPAY_KEY_ID</code> to{' '}
          <code style={{ fontSize: '0.85em' }}>client/.env.local</code> (same Key Id as Razorpay dashboard) and restart{' '}
          <code style={{ fontSize: '0.85em' }}>npm run dev</code>. Add Funds is disabled until then.
        </div>
      )}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md) var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#F87171',
          }}
        >
          {error}
        </div>
      )}
      {paymentMessage && <p style={{ color: 'var(--teal-light)', marginTop: 'var(--space-md)' }}>{paymentMessage}</p>}

      <div className={styles.balanceCard}>
        <span className={styles.balanceLabel}>Available Balance</span>
        <span className={styles.balanceAmount}>Rs {Number(user.wallet?.balance || 0).toLocaleString('en-IN')}</span>
        <div className={styles.balanceActions}>
          <input
            className="input-field"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="Top-up amount"
            style={{ maxWidth: '180px' }}
          />
          <button className="btn btn-primary" onClick={handleAddFunds} disabled={paying || !razorpayReady}>
            {paying ? 'Processing...' : 'Add Funds'}
          </button>
          <button className="btn btn-secondary" disabled>Withdraw (coming soon)</button>
        </div>
        {!user.isVerified && (
          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
            Artwork purchases require a verified account. Wallet top-ups work without verification.
          </p>
        )}
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 'var(--space-xl) 0 var(--space-md)' }}>Transaction History</h2>

      {loading ? (
        <div>Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No wallet transactions yet.</div>
      ) : (
        <div className={styles.txnList}>
          {transactions.map((txn) => {
            const isCredit = txn.amount > 0;
            return (
              <div key={txn.id} className={styles.txnItem}>
                <div className={styles.txnIcon}>{isCredit ? '↓' : '↑'}</div>
                <div className={styles.txnInfo}>
                  <span className={styles.txnDesc}>{txn.desc} ({txn.status})</span>
                  <span className={styles.txnDate}>{txn.date}</span>
                </div>
                <span className={`${styles.txnAmount} ${isCredit ? styles.credit : styles.debit}`}>
                  {isCredit ? '+' : ''}Rs {Math.abs(txn.amount).toLocaleString('en-IN')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
