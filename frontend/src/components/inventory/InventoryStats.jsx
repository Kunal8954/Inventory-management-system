import { FiPackage, FiAlertTriangle, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

const InventoryStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Items',
      value: stats.totalItems.toLocaleString(),
      icon: FiPackage,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: FiAlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStockCount,
      icon: FiTrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(stats.totalInventoryValue),
      icon: FiDollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} border-2 ${card.borderColor} rounded-lg p-6 shadow-sm hover:shadow-md transition`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-600 font-medium">{card.title}</h3>
              <Icon className={`${card.color} w-6 h-6`} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryStats;
