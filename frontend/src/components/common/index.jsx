import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

// Reusable Modal Component
export const Modal = ({ isOpen, title, onClose, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

// Reusable Badge Component
export const Badge = ({ label, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    primary: 'bg-accent-100 text-accent-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`inline-block rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {label}
    </span>
  );
};

// Reusable Button Component
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  const variants = {
    primary: 'bg-accent-600 text-white hover:bg-accent-700',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-accent-600 text-accent-600 hover:bg-accent-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        rounded-lg font-medium transition duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// Reusable Notification/Toast Component
export const Notification = ({ message, type = 'success', onClose }) => {
  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: <FiCheckCircle className="text-green-600" size={24} />,
      text: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <FiAlertCircle className="text-red-600" size={24} />,
      text: 'text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <FiAlertCircle className="text-yellow-600" size={24} />,
      text: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <FiInfo className="text-blue-600" size={24} />,
      text: 'text-blue-800',
    },
  };

  const styles = typeStyles[type] || typeStyles.success;

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg border ${styles.bg} shadow-lg flex items-center gap-3 max-w-md animate-slide-in-up`}>
      {styles.icon}
      <p className={`flex-1 ${styles.text}`}>{message}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
        <FiX size={20} />
      </button>
    </div>
  );
};

// Empty State Component
export const EmptyState = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">📭</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-center mb-6 max-w-md">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

// Loading Skeleton Component
export const Skeleton = ({ width = 'w-full', height = 'h-6', count = 1 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${width} ${height} bg-slate-200 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  );
};

// Data Table Header
export const TableHeader = ({ columns, onSort, sortBy, sortOrder }) => {
  return (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className="px-6 py-3 text-left text-sm font-semibold text-slate-900"
          >
            {column.sortable ? (
              <button
                onClick={() => onSort(column.key)}
                className="hover:text-accent-600 transition"
              >
                {column.label}{' '}
                {sortBy === column.key && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            ) : (
              column.label
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
};

// Pagination Component
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <p className="text-sm text-slate-600">
        Page <span className="font-semibold">{currentPage}</span> of{' '}
        <span className="font-semibold">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
