import { useState, useEffect } from 'react'
import { FaBox, FaExclamationTriangle, FaDollarSign, FaShoppingCart, FaPlus, FaChartLine, FaClock } from 'react-icons/fa'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    // Mock data - replace with real API call later
    setStats({
      totalProducts: 245,
      lowStockItems: 12,
      inventoryValue: '$125,430',
      ordersThisMonth: 48,
      topProducts: [
        { name: 'Laptop Pro', sales: 250 },
        { name: 'USB Cable', sales: 420 },
        { name: 'Monitor 27"', sales: 180 },
        { name: 'Keyboard RGB', sales: 320 },
      ],
      recentTransactions: [
        { id: 1, type: 'Stock In', product: 'Laptop Pro', quantity: 50, time: '2 hours ago' },
        { id: 2, type: 'Stock Out', product: 'USB Cable', quantity: 100, time: '4 hours ago' },
        { id: 3, type: 'Stock In', product: 'Monitor 27"', quantity: 20, time: '1 day ago' },
        { id: 4, type: 'Stock Out', product: 'Keyboard RGB', quantity: 75, time: '1 day ago' },
      ],
      alerts: [
        { id: 1, product: 'Mouse Wireless', stock: 5, threshold: 20 },
        { id: 2, product: 'HDMI Cable', stock: 8, threshold: 15 },
        { id: 3, product: 'Power Bank', stock: 3, threshold: 10 },
      ],
    })
  }, [])

  if (!stats) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here's your inventory overview.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link
            to="/inventory"
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition font-medium"
          >
            <FaPlus size={16} /> Add Stock
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Products</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FaBox className="text-blue-600 text-xl" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">+5 added this month</p>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Low Stock Items</p>
              <p className="text-3xl font-bold text-red-600">{stats.lowStockItems}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <FaExclamationTriangle className="text-red-600 text-xl" />
            </div>
          </div>
          <Link to="/alerts" className="text-xs text-accent-600 hover:text-accent-700 mt-3 inline-block font-medium">
            View alerts →
          </Link>
        </div>

        {/* Inventory Value */}
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Inventory Value</p>
              <p className="text-3xl font-bold text-slate-900">{stats.inventoryValue}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">+2.5% vs last month</p>
        </div>

        {/* Orders This Month */}
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Orders This Month</p>
              <p className="text-3xl font-bold text-slate-900">{stats.ordersThisMonth}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <FaShoppingCart className="text-purple-600 text-xl" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">+8 pending</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Top Selling Products</h2>
            <FaChartLine className="text-accent-600" />
          </div>
          <div className="space-y-3">
            {stats.topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center text-sm font-semibold text-accent-600">
                    {idx + 1}
                  </div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-600 rounded-full" 
                      style={{ width: `${(product.sales / 450) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-600 w-10 text-right">{product.sales}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Low Stock Alerts</h2>
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {stats.alerts.length}
            </span>
          </div>
          <div className="space-y-3">
            {stats.alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="font-medium text-slate-900 text-sm">{alert.product}</p>
                <p className="text-xs text-red-600 mt-1">
                  Stock: <span className="font-semibold">{alert.stock}</span> / Threshold: <span className="font-semibold">{alert.threshold}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-soft-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
          <Link to="/inventory-history" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
            View all →
          </Link>
        </div>
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
              {stats.recentTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      txn.type === 'Stock In' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium">{txn.product}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{txn.quantity}</td>
                  <td className="py-3 px-4 text-sm text-slate-500 flex items-center gap-1">
                    <FaClock size={12} /> {txn.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
