import { useEffect, useState } from 'react';
import { Badge, Skeleton } from '../components/common';
import { fetchLowStockAlerts } from '../services/inventoryService';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchLowStockAlerts();
        if (!mounted) return;
        setAlerts(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load alerts');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Low Stock Alerts</h1>
        <Skeleton count={4} height="h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Low Stock Alerts</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Low Stock Alerts</h1>
        <p className="text-slate-500">Inventory levels are currently healthy. When an item falls below its reorder point it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Low Stock Alerts</h1>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Product</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">SKU</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Quantity</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Shortage</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id || a.productId || a.sku} className="border-b last:border-b-0">
                <td className="px-6 py-4">{a.productName || a.product_name || '-'}</td>
                <td className="px-6 py-4">{a.sku || '-'}</td>
                <td className="px-6 py-4">{a.quantity ?? a.stock_quantity ?? '-'}</td>
                <td className="px-6 py-4">{a.shortage ?? Math.max((a.reorder_level || 0) - (a.quantity || a.stock_quantity || 0), 0)}</td>
                <td className="px-6 py-4">
                  { (a.status || '').toLowerCase().includes('out') ? (
                    <Badge label={a.status || 'Out of Stock'} variant="danger" />
                  ) : (
                    <Badge label={a.status || 'Low Stock'} variant="warning" />
                  ) }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

