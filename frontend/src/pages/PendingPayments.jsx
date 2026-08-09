import { useEffect, useState } from 'react';
import { FiMail, FiClock } from 'react-icons/fi';
import { EmptyState, Skeleton, Notification } from '../components/common';
import {
  fetchPendingPayments,
  setCustomerReminderInterval,
  setSupplierReminderInterval,
  sendCustomerPaymentReminder,
  sendVendorPaymentReminder,
} from '../services/paymentsService';
import { formatCurrency } from '../utils/formatters';

export default function PendingPayments() {
  const [data, setData] = useState({ customer_payments: [], vendor_payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPendingPayments();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleIntervalChange = async (kind, id, days) => {
    const value = Number(days);
    if (!value || value < 1) return;
    try {
      if (kind === 'customer') {
        await setCustomerReminderInterval(id, value);
      } else {
        await setSupplierReminderInterval(id, value);
      }
      await load();
    } catch (err) {
      notify('error', err.message || 'Failed to update interval');
    }
  };

  const handleSendReminder = async (kind, orderId) => {
    const rowKey = `${kind}-${orderId}`;
    setSendingId(rowKey);
    try {
      if (kind === 'customer') {
        await sendCustomerPaymentReminder(orderId);
      } else {
        await sendVendorPaymentReminder(orderId);
      }
      notify('success', 'Reminder sent');
      await load();
    } catch (err) {
      notify('error', err.message || 'Failed to send reminder');
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pending Payments</h1>
        </div>
        <Skeleton count={4} height="h-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pending Payments</h1>
        </div>
        <EmptyState title="Failed to load" description={error} />
      </div>
    );
  }

  const renderRow = (kind, row) => {
    const id = kind === 'customer' ? row.customer_id : row.supplier_id;
    const orderId = kind === 'customer' ? row.order_id : row.purchase_order_id;
    const name = kind === 'customer' ? row.customer_name : row.supplier_name;
    const rowKey = `${kind}-${orderId}`;

    return (
      <div
        key={rowKey}
        className={`flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-lg border ${
          row.needs_reminder ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
        }`}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            #{orderId} &middot; {name}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatCurrency(row.total_amount)} &middot; pending {row.days_pending} day{row.days_pending === 1 ? '' : 's'}
            {row.last_reminder_sent_at && (
              <> &middot; last reminded {new Date(row.last_reminder_sent_at).toLocaleDateString()}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <FiClock size={12} />
            <span>remind after</span>
            <input
              type="number"
              min={1}
              defaultValue={row.reminder_interval_days}
              onBlur={(e) => handleIntervalChange(kind, id, e.target.value)}
              className="w-14 px-1.5 py-1 border border-slate-200 rounded text-xs text-center"
            />
            <span>days</span>
          </div>

          <button
            onClick={() => handleSendReminder(kind, orderId)}
            disabled={sendingId === rowKey}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
              row.needs_reminder
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FiMail size={14} />
            {sendingId === rowKey ? 'Sending...' : 'Send Reminder'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Dashboard &gt; Pending Payments</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Pending Payments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Each customer and vendor has its own reminder interval — edit the days directly, it saves on its own.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Customers Who Owe Us</h2>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
            {data.customer_payments.length}
          </span>
        </div>
        {data.customer_payments.length === 0 ? (
          <EmptyState title="No pending customer payments" description="Everything's settled on the sales side." />
        ) : (
          <div className="space-y-2">
            {data.customer_payments.map((row) => renderRow('customer', row))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Vendors We Owe</h2>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
            {data.vendor_payments.length}
          </span>
        </div>
        {data.vendor_payments.length === 0 ? (
          <EmptyState title="No pending vendor payments" description="Everything's settled on the purchasing side." />
        ) : (
          <div className="space-y-2">
            {data.vendor_payments.map((row) => renderRow('vendor', row))}
          </div>
        )}
      </div>

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
    </div>
  );
}
