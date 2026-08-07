import { useEffect, useMemo, useState } from 'react';
import { EmptyState, Skeleton } from '../components/common';
import { fetchInventoryStats } from '../services/inventoryService';
import { fetchOrders } from '../services/salesService';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsData, ordersData] = await Promise.all([fetchInventoryStats(), fetchOrders()]);
        if (!mounted) return;
        setStats(statsData || null);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load reports');
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

  const totalOrders = orders.length;
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (Number(order.total_amount || order.total || 0) || 0), 0),
    [orders]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Reports</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Reports</h1>
        </div>
        <Skeleton count={4} height="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Reports</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Reports</h1>
        </div>
        <EmptyState title="Failed to load reports" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Dashboard &gt; Reports</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Reports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <p className="text-sm font-medium text-slate-600 mb-1">Inventory Value</p>
          <p className="text-3xl font-bold text-slate-900">{Number(stats?.totalValue || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <p className="text-sm font-medium text-slate-600 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <p className="text-sm font-medium text-slate-600 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-slate-900">{totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
        </div>
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <p className="text-sm font-medium text-slate-600 mb-1">Low Stock</p>
          <p className="text-3xl font-bold text-amber-600">{stats?.lowStockCount ?? 0}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Order ID</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Customer</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Total</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).slice(0, 8).map((order) => (
              <tr key={order.order_id || order.id} className="border-b last:border-b-0">
                <td className="px-6 py-4">{order.order_id || order.id}</td>
                <td className="px-6 py-4">{order.customer_name || order.customer || '-'}</td>
                <td className="px-6 py-4">{Number(order.total_amount || order.total || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                <td className="px-6 py-4">{order.order_status || order.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
