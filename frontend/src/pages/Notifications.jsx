import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, Skeleton, Badge } from '../components/common';
import { fetchLowStockAlerts } from '../services/inventoryService';
import { fetchNotifications, markNotificationRead } from '../services/notificationService';

export default function Notifications() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [orderNotifs, setOrderNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [alertData, notifData] = await Promise.all([fetchLowStockAlerts(), fetchNotifications()]);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setOrderNotifs(Array.isArray(notifData) ? notifData : []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
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
        const [alertData, notifData] = await Promise.all([fetchLowStockAlerts(), fetchNotifications()]);
        if (!mounted) return;
        setAlerts(Array.isArray(alertData) ? alertData : []);
        setOrderNotifs(Array.isArray(notifData) ? notifData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load notifications');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.notification_id);
        setOrderNotifs((prev) =>
          prev.map((n) => (n.notification_id === notif.notification_id ? { ...n, is_read: 1 } : n))
        );
      } catch {
        // Non-critical — still navigate even if marking read fails
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Notifications</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Notifications</h1>
        </div>
        <Skeleton count={4} height="h-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Notifications</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Notifications</h1>
        </div>
        <EmptyState title="Failed to load notifications" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Dashboard &gt; Notifications</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Notifications</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Order Requests</h2>
          <p className="text-sm text-slate-500">Fires whenever a customer places a new order.</p>
        </div>

        {orderNotifs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No order notifications yet"
              description="New customer order requests will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {orderNotifs.map((notif) => (
              <li key={notif.notification_id}>
                <button
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left px-6 py-4 flex items-start justify-between gap-4 transition-colors hover:bg-slate-50 ${
                    notif.is_read ? '' : 'bg-accent-50/50'
                  }`}
                >
                  <div>
                    <p className={`text-sm ${notif.is_read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-1.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Low Stock Notifications</h2>
          <p className="text-sm text-slate-500">Real alerts pulled from the inventory endpoint.</p>
        </div>

        {alerts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No notifications right now"
              description="When an item drops below its reorder threshold, it will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {alerts.map((alert) => (
              <li key={alert.id || alert.productId || alert.sku} className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{alert.productName || alert.product_name || 'Low stock item'}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    SKU: {alert.sku || '-'} &middot; Quantity: {alert.quantity ?? alert.stock_quantity ?? 0}
                  </p>
                </div>
                <Badge label={alert.status || 'Low Stock'} variant={(alert.status || '').toLowerCase().includes('out') ? 'danger' : 'warning'} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}