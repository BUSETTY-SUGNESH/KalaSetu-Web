import axios from 'axios';
import api from './api';

export interface ShippingAddressPayload {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type PaymentPurpose = 'ORDER' | 'WALLET_TOPUP';

interface CreatePaymentOrderPayload {
  purpose: PaymentPurpose;
  amount?: number;
  artworkId?: string;
  shippingAddress?: ShippingAddressPayload;
}

interface StartPaymentParams {
  payload: CreatePaymentOrderPayload;
  name: string;
  description: string;
  onSuccess?: (result: { orderId?: string; walletBalance?: number }) => Promise<void> | void;
}

interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/** True when NEXT_PUBLIC_RAZORPAY_KEY_ID is set (inlined at build time in Next). */
export const isRazorpayPublicKeyConfigured = (): boolean => {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY;
  return Boolean(key && String(key).trim());
};

export const getPaymentErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
};

const loadRazorpaySdk = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Payment can only be initialized in browser');
  }

  if (window.Razorpay) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if (window.Razorpay) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });

  for (let i = 0; i < 30 && !window.Razorpay; i += 1) {
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK did not initialize');
  }
};

export const startPayment = async ({ payload, name, description, onSuccess }: StartPaymentParams) => {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY;
  if (!key || !String(key).trim()) {
    throw new Error(
      'Razorpay is not configured: add NEXT_PUBLIC_RAZORPAY_KEY_ID to client .env.local (same Key Id as RAZORPAY_KEY_ID on the server) and restart next dev.',
    );
  }

  await loadRazorpaySdk();

  let order: RazorpayOrderResponse;
  try {
    const orderRes = await api.post<RazorpayOrderResponse>('/payments/create-order', payload);
    order = orderRes.data;
  } catch (err: unknown) {
    throw new Error(getPaymentErrorMessage(err));
  }

  if (!order?.id || order?.amount == null || !order?.currency) {
    throw new Error('Invalid order response received from server');
  }

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK is unavailable');
  }

  await new Promise<void>((resolve, reject) => {
    const amount =
      typeof order.amount === 'string' ? Number.parseInt(order.amount, 10) : Number(order.amount);
    if (!Number.isFinite(amount)) {
      reject(new Error('Invalid order amount from gateway'));
      return;
    }

    const options = {
      key,
      amount,
      currency: order.currency,
      name,
      description,
      order_id: order.id,
      handler: async (response: RazorpayVerifyPayload) => {
        try {
          const verifyRes = await api.post<{ success: boolean; orderId?: string; walletBalance?: number; error?: string }>(
            '/payments/verify',
            response,
          );
          if (!verifyRes.data.success) {
            reject(new Error(verifyRes.data.error || 'Payment verification failed'));
            return;
          }

          if (onSuccess) {
            await onSuccess({
              orderId: verifyRes.data.orderId,
              walletBalance: verifyRes.data.walletBalance,
            });
          }
          resolve();
        } catch (error) {
          reject(new Error(getPaymentErrorMessage(error)));
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    };

    const razorpay = new window.Razorpay!(options);
    razorpay.open();
  });
};
