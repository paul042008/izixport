declare module 'flutterwave-react-v3' {
  import { FC } from 'react';
  interface FlutterwaveConfig {
    public_key: string;
    tx_ref: string;
    amount: number;
    currency: string;
    payment_options?: string;
    customer: { email: string; name: string; phone_number?: string };
    customizations?: { title?: string; description?: string; logo?: string };
    meta?: Record<string, any>;
  }
  export function useFlutterwave(config: FlutterwaveConfig): (options: {
    callback: (response: { status: string; transaction_id?: string; tx_ref?: string }) => void;
    onClose: () => void;
  }) => void;
}