import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Badge } from '../components/common';
import { fetchMyOrders, cancelOrder, requestRefund } from '../services/shopService';
import { payForOrder } from '../utils/razorpayPayment';
import { useAuth } from '../contexts/AuthContext';

const statusVariant = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'danger';
  if (s === 'pending') return 'warning';
  return 'info';
};

export default function ShopOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [requestingId, setRequestingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMyOrders();
        if (!mounted) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load your orders');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const handleRequestRefund = async (orderId) => {
    const reason = window.prompt('Tell us why you want a refund for this order:');
    if (!reason || !reason.trim()) return;

    setRequestingId(orderId);
    try {
      await requestRefund(orderId, reason.trim());
      await load();
    } catch (err) {
      alert(err.message || 'Failed to submit refund request');
    } finally {
      setRequestingId(null);
    }
  };

  const handlePayNow = async (orderId) => {
    setPayingId(orderId);
    await payForOrder(orderId, user, {
      onSuccess: async () => {
        await load();
        setPayingId(null);
      },
      onDismiss: () => {
        setPayingId(null);
      },
      onError: (message) => {
        alert(message);
        setPayingId(null);
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
        <Skeleton count={3} height="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
        <EmptyState title="Couldn't load your orders" description={error} />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
        <EmptyState title="No orders yet" description="Orders you place will show up here." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const canPay =
            order.payment_method === 'Online' &&
            order.payment_status !== 'Paid' &&
            (order.order_status || '').toLowerCase() !== 'cancelled';

          const refundReq = order.refund_request;
          const canRequestRefund =
            order.payment_status === 'Paid' && (!refundReq || refundReq.status !== 'Pending');

          return (
            <div key={order.order_id} className="bg-white rounded-xl border border-slate-200 shadow-soft-md p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-slate-900">Order #{order.order_id}</p>
                  <p className="text-xs text-slate-500">
                    {order.order_date ? new Date(order.order_date).toLocaleString() : '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={order.order_status || 'Pending'} variant={statusVariant(order.order_status)} />
                  <Badge label={order.payment_status || 'Pending'} variant={order.payment_status === 'Paid' ? 'success' : 'warning'} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1 mb-3">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {item.product_name} <span className="text-slate-400">&times; {item.quantity}</span>
                    </span>
                    <span className="text-slate-600">
                      {Number(item.subtotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                  </div>
                ))}
              </div>

              {refundReq && (
                <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${
                  refundReq.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                  refundReq.status === 'Rejected' ? 'bg-slate-100 text-slate-600' : 'bg-green-50 text-green-700'
                }`}>
                  {refundReq.status === 'Pending' && 'Refund requested — awaiting review.'}
                  {refundReq.status === 'Rejected' && (
                    <>Previous refund request declined{refundReq.staff_note ? `: ${refundReq.staff_note}` : '.'}</>
                  )}
                  {refundReq.status === 'Approved' && 'Refund approved.'}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-500">
                  {order.payment_method && <span className="mr-3">{order.payment_method}</span>}
                  {order.delivery_city && <span>Deliver to {order.delivery_city}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">
                    {Number(order.total_amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </span>
                  {canPay && (
                    <button
                      onClick={() => handlePayNow(order.order_id)}
                      disabled={payingId === order.order_id}
                      className="text-xs font-semibold text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                    >
                      {payingId === order.order_id ? 'Opening...' : 'Pay Now'}
                    </button>
                  )}
                  {canRequestRefund && (
                    <button
                      onClick={() => handleRequestRefund(order.order_id)}
                      disabled={requestingId === order.order_id}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 underline"
                    >
                      {requestingId === order.order_id ? 'Submitting...' : 'Request Refund'}
                    </button>
                  )}
                  {(order.order_status || '').toLowerCase() === 'pending' && (
                    <button
                      onClick={() => handleCancel(order.order_id)}
                      disabled={cancellingId === order.order_id}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 underline"
                    >
                      {cancellingId === order.order_id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}