import { useState } from 'react';
import { Badge, EmptyState } from '../common/index';
import {
  getTransactionTypeColor,
  getTransactionTypeLabel,
  getTransactionTypeIcon,
  formatDateTime,
} from '../../utils/formatters';

const TransactionHistory = ({ transactions }) => {
  const [filterType, setFilterType] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter transactions
  const filteredTransactions = filterType
    ? transactions.filter((t) => t.type === filterType)
    : transactions;

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <EmptyState
          title="No transactions yet"
          description="Stock movements will appear here"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-slate-200 flex gap-4 items-center flex-wrap">
        <div>
          <label className="text-sm font-medium text-slate-900 mr-2">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="">All Types</option>
            <option value="STOCK_IN">Stock In</option>
            <option value="STOCK_OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900 mr-2">Sort:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-slate-200">
        {sortedTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600">No transactions found</p>
          </div>
        ) : (
          sortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-4 hover:bg-slate-50 transition"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-2xl pt-1">{getTransactionTypeIcon(transaction.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {transaction.productName}
                    </h3>
                    <Badge
                      label={getTransactionTypeLabel(transaction.type)}
                      variant="default"
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-slate-600 mb-1">
                    {transaction.reason}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(transaction.date, transaction.time)} • By {transaction.createdBy}
                  </p>
                  {transaction.notes && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                      {transaction.notes}
                    </p>
                  )}
                </div>

                {/* Quantity Badge */}
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      transaction.type === 'STOCK_IN' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'STOCK_IN' ? '+' : ''}
                    {transaction.quantity}
                  </div>
                  <p className="text-xs text-slate-500">{transaction.productName}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const LowStockAlerts = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <EmptyState
          title="All stock levels are good!"
          description="No items are currently below the reorder point"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-yellow-50 border-b-2 border-yellow-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-900">
                Product
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-900">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-900">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-900">
                Reorder Point
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-900">
                Shortage
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-yellow-900">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, index) => {
              const shortage = Math.max(0, alert.reorderPoint - alert.quantity);
              return (
                <tr
                  key={alert.id}
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-yellow-50'
                  } border-b border-yellow-100 hover:bg-yellow-50 transition`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {alert.productName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{alert.sku}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {alert.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {alert.reorderPoint}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge
                      label={`-${shortage} items`}
                      variant="danger"
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="px-3 py-1 text-accent-600 hover:bg-accent-50 border border-accent-200 rounded-lg transition text-xs font-medium">
                      Create PO
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { TransactionHistory, LowStockAlerts };
export default TransactionHistory;
