import { useEffect, useState } from 'react';
import { Skeleton } from '../components/common';
import { fetchOrders } from '../services/salesService';

export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchOrders();
        if (!mounted) return;
        setOrders(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load orders');
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
        <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
        <Skeleton count={3} height="h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.total_amount || o.total || 0) || 0), 0);
  const pendingCount = orders.filter((o) => (o.order_status || o.status || '').toString().toLowerCase() === 'pending').length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Sales</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-slate-500">Total Orders</div>
          <div className="text-2xl font-semibold">{totalOrders}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-slate-500">Total Revenue</div>
          <div className="text-2xl font-semibold">{totalRevenue.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-slate-500">Pending Orders</div>
          <div className="text-2xl font-semibold">{pendingCount}</div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Order ID</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Customer</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Total</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Payment</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id || o.id} className="border-b last:border-b-0">
                <td className="px-6 py-4">{o.order_id || o.id}</td>
                <td className="px-6 py-4">{o.customer_name || o.customer || '-'}</td>
                <td className="px-6 py-4">{(o.total_amount || o.total || 0).toLocaleString ? (o.total_amount || o.total || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : o.total_amount || o.total || 0}</td>
                <td className="px-6 py-4">{o.payment_status || o.paymentStatus || '-'}</td>
                <td className="px-6 py-4">{o.order_status || o.status || '-'}</td>
                <td className="px-6 py-4">{(o.order_date || o.created_at || o.createdAt) ? new Date(o.order_date || o.created_at || o.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
