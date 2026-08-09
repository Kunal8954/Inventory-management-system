import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiClock,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiShoppingCart,
  FiTrendingUp,
} from 'react-icons/fi';
import { Button, EmptyState, Skeleton } from '../components/common';
import { useInventory } from '../hooks/useInventory';
import { fetchOrders } from '../services/salesService';
import { fetchFinancialSummary } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';
import {
  formatCurrency,
  formatDateTime,
  getTransactionTypeColor,
  getTransactionTypeLabel,
} from '../utils/formatters';

export default function Dashboard() {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';
  const { inventory, stats, lowStockAlerts, transactions, loading, error, refetch } = useInventory();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [financials, setFinancials] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);

      try {
        const data = await fetchOrders();
        if (!mounted) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setOrdersError(err.message || 'Failed to load orders');
      } finally {
        if (mounted) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  // Admin-only — the backend also enforces this, but there's no reason to even
  // make the call (or risk a console error) for a role that can't see it.
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;

    fetchFinancialSummary()
      .then((data) => {
        if (mounted) setFinancials(data);
      })
      .catch(() => {
        // Non-critical — the rest of the dashboard still works without this section.
      });

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const isLoading = loading || ordersLoading;
  const combinedError = error || ordersError;

  const reloadAll = () => {
    refetch();
    setOrdersLoading(true);
    setOrdersError(null);
    fetchOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setOrdersError(err.message || 'Failed to load orders'))
      .finally(() => setOrdersLoading(false));
  };

  const totalProducts = stats?.totalItems ?? inventory.length;
  const lowStockCount = lowStockAlerts.length;
  const inventoryValue = formatCurrency(stats?.totalValue ?? 0);
  const ordersThisMonth = orders.filter((order) => {
    const orderDate = order.order_date || order.created_at || order.createdAt;
    if (!orderDate) return true;
    const date = new Date(orderDate);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const topStockedProducts = useMemo(
    () =>
      [...inventory]
        .sort((left, right) => (right.quantity || 0) - (left.quantity || 0))
        .slice(0, 4),
    [inventory]
  );

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Loading inventory overview...</p>
        </div>
        <Skeleton count={4} height="h-24" />
        <Skeleton count={2} height="h-64" />
      </div>
    );
  }

  if (combinedError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">We couldn't load inventory data right now.</p>
        </div>
        <EmptyState
          title="Dashboard unavailable"
          description={combinedError}
          action={
            <Button variant="primary" onClick={reloadAll}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Welcome back. Here's your live inventory overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={reloadAll} className="flex items-center gap-2">
            <FiRefreshCw size={16} /> Refresh
          </Button>
          <Link
            to="/inventory"
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition font-medium"
          >
            <FiPackage size={16} /> Add Stock
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Products</p>
              <p className="text-3xl font-bold text-slate-900">{totalProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FiPackage className="text-blue-600 text-xl" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Tracked items in inventory</p>
        </div>

        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Low Stock Items</p>
              <p className="text-3xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <FiAlertTriangle className="text-amber-600 text-xl" />
            </div>
          </div>
          <Link to="/alerts" className="text-xs text-accent-600 hover:text-accent-700 mt-3 inline-block font-medium">
            View alerts →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Orders This Month</p>
              <p className="text-3xl font-bold text-slate-900">{ordersThisMonth}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <FiShoppingCart className="text-purple-600 text-xl" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">Pulled from the live orders endpoint</p>
        </div>

        {!isStaff && (
          <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Inventory Value</p>
                <p className="text-3xl font-bold text-slate-900">{inventoryValue}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <FiDollarSign className="text-green-600 text-xl" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">Computed from current stock and pricing</p>
          </div>
        )}
      </div>

      {isAdmin && financials && (
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="text-accent-600" />
              <h2 className="text-lg font-bold text-slate-900">Financial Summary</h2>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              Admin only
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Cost of Stock on Hand</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(financials.total_cost_value)}</p>
              <p className="text-xs text-slate-400 mt-1">What's currently in inventory cost to acquire</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Revenue (Completed Sales)</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(financials.total_revenue)}</p>
              <p className="text-xs text-slate-400 mt-1">Total from orders marked Completed</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Profit</p>
              <p className={`text-2xl font-bold ${financials.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financials.total_profit)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Revenue minus the cost of goods actually sold</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Top Stocked Products</h2>
            <FiPackage className="text-accent-600" />
          </div>
          <div className="space-y-3">
            {topStockedProducts.length > 0 ? (
              topStockedProducts.map((product, index) => (
                <div key={product.id || product.productId || product.sku || index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center text-sm font-semibold text-accent-600">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{product.productName || product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{product.quantity}</span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No inventory data yet"
                description="Products will appear here once stock is available."
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Low Stock Alerts</h2>
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {lowStockAlerts.length}
            </span>
          </div>
          <div className="space-y-3">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="font-medium text-slate-900 text-sm">{alert.productName || alert.name}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Stock: <span className="font-semibold">{alert.quantity ?? 0}</span>
                    {typeof alert.shortage === 'number' ? (
                      <>
                        {' '}
                        / Shortage: <span className="font-semibold">{alert.shortage}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No low stock alerts"
                description="Everything is above the reorder threshold right now."
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
          <Link to="/inventory-history" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
            View all →
          </Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Quantity</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTransactionTypeColor(txn.type)}`}>
                        {getTransactionTypeLabel(txn.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900 font-medium">{txn.productName}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{txn.quantity}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 flex items-center gap-1">
                      <FiClock size={12} /> {formatDateTime(txn.date, txn.time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No recent transactions"
            description="Stock in and stock out activity will appear here once inventory changes are recorded."
          />
        )}
      </div>
    </div>
  );
}