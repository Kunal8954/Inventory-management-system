import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Badge } from '../components/common';
import { fetchLowStockAlerts } from '../services/inventoryService';

export default function Notifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchLowStockAlerts();
        if (!mounted) return;
        setAlerts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load notifications');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

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
                    SKU: {alert.sku || '-'} · Quantity: {alert.quantity ?? alert.stock_quantity ?? 0}
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
