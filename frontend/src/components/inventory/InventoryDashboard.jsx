import { useState, useEffect } from 'react';
import {
  FiPackage,
  FiAlertTriangle,
  FiTrendingDown,
  FiDollarSign,
  FiMinus,
  FiDownload,
  FiShoppingCart,
} from 'react-icons/fi';
import {
  Modal,
  Button,
  Notification,
  EmptyState,
  Skeleton,
} from '../common/index';
import { useNotification, usePagination } from '../../hooks/useInventory';
import {
  fetchInventory,
  fetchLowStockAlerts,
  fetchTransactions,
  fetchInventoryStats,
  createStockOut,
  exportInventoryToCSV,
} from '../../services/inventoryService';
import { formatCurrency } from '../../utils/formatters';
import InventoryStats from './InventoryStats';
import InventoryTable from './InventoryTable';
import TransactionHistory from './TransactionHistory';
import { LowStockAlerts } from './TransactionHistory';
import { StockOutForm } from './StockForms';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { notification, showSuccess, showError } = useNotification();
  const { currentPage, totalPages, getCurrentPageData, goToPage } = usePagination(
    inventory,
    10
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invData, txnData, alertsData, statsData] = await Promise.all([
        fetchInventory(),
        fetchTransactions(),
        fetchLowStockAlerts(),
        fetchInventoryStats(),
      ]);

      setInventory(invData);
      setTransactions(txnData);
      setLowStockAlerts(alertsData);
      setStats(statsData);
    } catch (error) {
      showError(error.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = async () => {
    try {
      const [invData, txnData, alertsData, statsData] = await Promise.all([
        fetchInventory(),
        fetchTransactions(),
        fetchLowStockAlerts(),
        fetchInventoryStats(),
      ]);
      setInventory(invData);
      setTransactions(txnData);
      setLowStockAlerts(alertsData);
      setStats(statsData);
    } catch (error) {
      showError(error.message || 'Failed to refresh inventory data');
    }
  };

  const handleStockOut = async (data) => {
    try {
      await createStockOut({
        productId: parseInt(data.productId),
        quantity: parseInt(data.quantity),
        notes: data.reason ? `${data.reason}${data.notes ? ' - ' + data.notes : ''}` : (data.notes || ''),
      });
      showSuccess('Stock Out recorded successfully!');
      setShowStockOutModal(false);
      await refreshData();
    } catch (error) {
      showError(error.message || 'Failed to record stock out');
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventory Management</h1>
          <p className="text-slate-600">Track and manage your stock levels in real-time</p>
        </div>

        <div className="mb-2 flex gap-3 flex-wrap items-center">
          <Button
            variant="secondary"
            onClick={() => setShowStockOutModal(true)}
            className="flex items-center gap-2"
          >
            <FiMinus size={20} /> Stock Out
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => exportInventoryToCSV(filteredInventory, 'inventory.csv')}
          >
            <FiDownload size={20} /> Export CSV
          </Button>
        </div>
        <p className="mb-6 text-sm text-slate-500 flex items-center gap-1.5">
          <FiShoppingCart size={14} />
          Adding new stock happens through Purchase Orders now — create one and mark it Received.
        </p>

        <div className="flex gap-4 mb-6 border-b border-slate-200">
          {[
            { id: 'overview', label: 'Overview', icon: FiPackage },
            { id: 'transactions', label: 'Transactions', icon: FiTrendingDown },
            { id: 'alerts', label: 'Low Stock Alerts', icon: FiAlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <div>
          {isLoading ? (
            <Skeleton count={5} height="h-12" />
          ) : activeTab === 'overview' ? (
            <div className="space-y-6">
              {stats && <InventoryStats stats={stats} />} 
              <InventoryTable 
                data={paginatedInventory} 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          ) : activeTab === 'transactions' ? (
            <TransactionHistory transactions={transactions} />
          ) : (
            <LowStockAlerts alerts={lowStockAlerts} />
          )}
        </div>

        <Modal
          isOpen={showStockOutModal}
          title="Stock Out"
          onClose={() => setShowStockOutModal(false)}
          size="md"
        >
          <StockOutForm
            products={inventory}
            onSubmit={handleStockOut}
            onCancel={() => setShowStockOutModal(false)}
          />
        </Modal>

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;