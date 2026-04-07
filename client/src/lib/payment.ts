export interface ShippingAddressPayload {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type PaymentPurpose = 'ORDER' | 'WALLET_TOPUP';

interface StartPaymentParams {
  payload: {
    purpose: PaymentPurpose;
    amount?: number;
    artworkId?: string;
    shippingAddress?: ShippingAddressPayload;
  };
  name: string;
  description: string;
  onSuccess?: (result: { orderId?: string; walletBalance?: number }) => Promise<void> | void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export const isRazorpayPublicKeyConfigured = (): boolean => {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY;
  return Boolean(key && String(key).trim());
};

export const getPaymentErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
};

export const startPayment = async (_params: StartPaymentParams) => {
  throw new Error(
    'Payment processing requires a server-side Supabase Edge Function. ' +
    'Configure Razorpay via Edge Functions to enable payments.',
  );
};
