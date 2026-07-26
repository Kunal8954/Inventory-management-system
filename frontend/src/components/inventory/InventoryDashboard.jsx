import { useState, useEffect } from 'react';
import {
  FiPackage,
  FiAlertTriangle,
  FiTrendingDown,
  FiDollarSign,
  FiPlus,
  FiMinus,
  FiDownload,
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
} from '../../services/inventoryService';
import { formatCurrency } from '../../utils/formatters';
import InventoryStats from './InventoryStats';
import InventoryTable from './InventoryTable';
import TransactionHistory from './TransactionHistory';
import { LowStockAlerts } from './TransactionHistory';
import { StockInForm, StockOutForm } from './StockForms';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { notification, showSuccess, showError } = useNotification();
  const { currentPage, totalPages, getCurrentPageData, goToPage } = usePagination(
    inventory,
    10
  );

  // Load initial data
  useEffect(() => {
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

    loadData();
  }, [showError]);

  // Handle stock in
  const handleStockIn = (data) => {
    // Simulate transaction creation
    const newTransaction = {
      id: transactions.length + 1,
      type: 'STOCK_IN',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      ...data,
    };

    setTransactions([newTransaction, ...transactions]);
    showSuccess('Stock In recorded successfully!');
    setShowStockInModal(false);

    // Update inventory
    const updatedInventory = inventory.map((item) => {
      if (item.productId === parseInt(data.productId)) {
        return {
          ...item,
          quantity: item.quantity + parseInt(data.quantity),
          availableQuantity: item.availableQuantity + parseInt(data.quantity),
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }
      return item;
    });
    setInventory(updatedInventory);
  };

  // Handle stock out
  const handleStockOut = (data) => {
    // Check if sufficient stock available
    const product = inventory.find((p) => p.productId === parseInt(data.productId));
    if (!product || product.availableQuantity < data.quantity) {
      showError('Insufficient stock available!');
      return;
    }

    const newTransaction = {
      id: transactions.length + 1,
      type: 'STOCK_OUT',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      ...data,
    };

    setTransactions([newTransaction, ...transactions]);
    showSuccess('Stock Out recorded successfully!');
    setShowStockOutModal(false);

    // Update inventory
    const updatedInventory = inventory.map((item) => {
      if (item.productId === parseInt(data.productId)) {
        return {
          ...item,
          quantity: item.quantity - parseInt(data.quantity),
          availableQuantity: item.availableQuantity - parseInt(data.quantity),
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }
      return item;
    });
    setInventory(updatedInventory);
  };

  // Filter inventory based on search
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Inventory Management</h1>
          <p className="text-slate-600">Track and manage your stock levels in real-time</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <Button
            variant="primary"
            onClick={() => setShowStockInModal(true)}
            className="flex items-center gap-2"
          >
            <FiPlus size={20} /> Stock In
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowStockOutModal(true)}
            className="flex items-center gap-2"
          >
            <FiMinus size={20} /> Stock Out
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FiDownload size={20} /> Export CSV
          </Button>
        </div>

        {/* Tabs */}
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

        {/* Content */}
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

        {/* Modals */}
        <Modal
          isOpen={showStockInModal}
          title="Stock In"
          onClose={() => setShowStockInModal(false)}
          size="md"
        >
          <StockInForm
            products={inventory}
            onSubmit={handleStockIn}
            onCancel={() => setShowStockInModal(false)}
          />
        </Modal>

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

        {/* Notification */}
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
