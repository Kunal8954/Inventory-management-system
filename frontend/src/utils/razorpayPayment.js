import { createOrderPayment, verifyOrderPayment } from '../services/shopService';

let scriptPromise = null;

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
};

/**
 * Opens Razorpay's checkout for a given order. The frontend never decides
 * whether payment "succeeded" — it only forwards what Razorpay's widget
 * returns to the backend, which independently verifies it.
 *
 * @param {number} orderId
 * @param {{name?: string, email?: string}} user
 * @param {{onSuccess?: Function, onDismiss?: Function, onError?: (message: string) => void}} callbacks
 */
export const payForOrder = async (orderId, user, { onSuccess, onDismiss, onError } = {}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onError?.('Could not load the payment window. Please try again.');
    return;
  }

  let session;
  try {
    session = await createOrderPayment(orderId);
  } catch (err) {
    onError?.(err.message || 'Could not start payment.');
    return;
  }

  const options = {
    key: session.key_id,
    amount: session.amount,
    currency: session.currency,
    name: 'StockPilot',
    description: `Order #${orderId}`,
    order_id: session.razorpay_order_id,
    prefill: { name: user?.name || '', email: user?.email || '' },
    theme: { color: '#2563EB' },
    handler: async (response) => {
      try {
        await verifyOrderPayment(orderId, {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        onSuccess?.();
      } catch (err) {
        onError?.(err.message || 'Payment could not be verified. Contact support.');
      }
    },
    modal: {
      ondismiss: () => {
        onDismiss?.();
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

export default { payForOrder };
