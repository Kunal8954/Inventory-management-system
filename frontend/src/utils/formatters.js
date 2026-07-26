// Formatters for displaying data
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString, timeString) => {
  return `${formatDate(dateString)} ${timeString}`;
};

export const getStockStatus = (quantity, reorderPoint) => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= reorderPoint) return 'Low Stock';
  return 'In Stock';
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'In Stock':
      return 'bg-green-100 text-green-800 border border-green-300';
    case 'Low Stock':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    case 'Out of Stock':
      return 'bg-red-100 text-red-800 border border-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getTransactionTypeColor = (type) => {
  switch (type) {
    case 'STOCK_IN':
      return 'bg-blue-100 text-blue-800';
    case 'STOCK_OUT':
      return 'bg-orange-100 text-orange-800';
    case 'ADJUSTMENT':
      return 'bg-purple-100 text-purple-800';
    case 'TRANSFER':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getTransactionTypeLabel = (type) => {
  switch (type) {
    case 'STOCK_IN':
      return 'Stock In';
    case 'STOCK_OUT':
      return 'Stock Out';
    case 'ADJUSTMENT':
      return 'Adjustment';
    case 'TRANSFER':
      return 'Transfer';
    default:
      return type;
  }
};

export const getTransactionTypeIcon = (type) => {
  switch (type) {
    case 'STOCK_IN':
      return '📥';
    case 'STOCK_OUT':
      return '📤';
    case 'ADJUSTMENT':
      return '⚙️';
    case 'TRANSFER':
      return '↔️';
    default:
      return '📝';
  }
};

export const pluralize = (count, singular, plural) => {
  return count === 1 ? singular : plural;
};
