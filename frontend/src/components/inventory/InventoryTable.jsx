import { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { Badge, EmptyState } from '../common/index';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';

const InventoryTable = ({ data, searchQuery, onSearchChange }) => {
  const [sortBy, setSortBy] = useState('productName');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
  });

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <EmptyState
          title="No inventory items found"
          description="Start by adding products to your inventory"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-slate-200 flex gap-4 items-center">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        <button className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700">
          <FiFilter size={18} /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[
                { key: 'productName', label: 'Product' },
                { key: 'sku', label: 'SKU' },
                { key: 'category', label: 'Category' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'reservedQuantity', label: 'Reserved' },
                { key: 'availableQuantity', label: 'Available' },
                { key: 'status', label: 'Status' },
                { key: 'unitPrice', label: 'Unit Price' },
                { key: 'lastUpdated', label: 'Last Updated' },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-6 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortBy === col.key && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr
                key={item.id}
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                } border-b border-slate-200 hover:bg-slate-100 transition`}
              >
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {item.productName}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.sku}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                <td className="px-6 py-4 text-sm text-slate-900 font-semibold">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <Badge label={item.reservedQuantity} variant="warning" size="sm" />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {item.availableQuantity}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Badge label={item.status} variant={
                    item.status === 'In Stock' ? 'success' : 
                    item.status === 'Low Stock' ? 'warning' : 'danger'
                  } size="sm" />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatCurrency(item.price)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDate(item.lastUpdated)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold">{sortedData.length}</span> items
        </p>
      </div>
    </div>
  );
};

export default InventoryTable;
