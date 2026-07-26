// Inventory API Service
// This service will connect to your backend once you build it
// All endpoints are prepared for future integration

// Replace with your actual backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Mock delay to simulate API calls
const simulateDelay = () => new Promise((resolve) => setTimeout(resolve, 300));

// Fetch inventory items (GET /inventory)
export const fetchInventory = async () => {
  try {
    // TODO: Replace with actual API call:
    // const response = await fetch(`${API_BASE_URL}/inventory`, {
    //   headers: { Authorization: `Bearer ${getAuthToken()}` }
    // });
    // return response.json();

    // Mock implementation for now
    await simulateDelay();
    const { mockInventoryItems } = await import('../data/mockInventory');
    return mockInventoryItems;
  } catch (error) {
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }
};

// Get low stock alerts (GET /inventory/low-stock)
export const fetchLowStockAlerts = async () => {
  try {
    // TODO: Replace with:
    // const response = await fetch(`${API_BASE_URL}/inventory/low-stock`, {
    //   headers: { Authorization: `Bearer ${getAuthToken()}` }
    // });

    await simulateDelay();
    const { lowStockAlerts } = await import('../data/mockInventory');
    return lowStockAlerts;
  } catch (error) {
    throw new Error(`Failed to fetch low stock alerts: ${error.message}`);
  }
};

// Get inventory transactions (GET /inventory/transactions)
export const fetchTransactions = async (filters = {}) => {
  try {
    // TODO: Replace with:
    // const params = new URLSearchParams(filters);
    // const response = await fetch(`${API_BASE_URL}/inventory/transactions?${params}`, {
    //   headers: { Authorization: `Bearer ${getAuthToken()}` }
    // });

    await simulateDelay();
    const { mockTransactions } = await import('../data/mockInventory');
    let filtered = mockTransactions;

    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }
    if (filters.productId) {
      filtered = filtered.filter((t) => t.productId === filters.productId);
    }
    if (filters.startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= new Date(filters.endDate));
    }

    return filtered;
  } catch (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
};

// Stock In (POST /inventory/in)
export const createStockIn = async (data) => {
  try {
    // TODO: Replace with:
    // const response = await fetch(`${API_BASE_URL}/inventory/in`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${getAuthToken()}`
    //   },
    //   body: JSON.stringify(data)
    // });
    // return response.json();

    // Validate required fields
    if (!data.productId || !data.quantity) {
      throw new Error('Product and quantity are required');
    }
    if (data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    await simulateDelay();

    return {
      id: Date.now(),
      ...data,
      type: 'STOCK_IN',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      createdBy: 'current_user',
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to create stock in: ${error.message}`);
  }
};

// Stock Out (POST /inventory/out)
export const createStockOut = async (data) => {
  try {
    // TODO: Replace with:
    // const response = await fetch(`${API_BASE_URL}/inventory/out`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${getAuthToken()}`
    //   },
    //   body: JSON.stringify(data)
    // });
    // return response.json();

    // Validate required fields
    if (!data.productId || !data.quantity) {
      throw new Error('Product and quantity are required');
    }
    if (data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    await simulateDelay();

    return {
      id: Date.now(),
      ...data,
      type: 'STOCK_OUT',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      createdBy: 'current_user',
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to create stock out: ${error.message}`);
  }
};

// Inventory Adjustment (POST /inventory/adjust)
export const createAdjustment = async (data) => {
  try {
    // TODO: Replace with:
    // const response = await fetch(`${API_BASE_URL}/inventory/adjust`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${getAuthToken()}`
    //   },
    //   body: JSON.stringify(data)
    // });

    if (!data.productId || data.quantity === undefined) {
      throw new Error('Product and quantity are required');
    }

    await simulateDelay();

    return {
      id: Date.now(),
      ...data,
      type: 'ADJUSTMENT',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      createdBy: 'current_user',
      success: true,
    };
  } catch (error) {
    throw new Error(`Failed to create adjustment: ${error.message}`);
  }
};

// Get inventory statistics (GET /inventory/stats)
export const fetchInventoryStats = async () => {
  try {
    // TODO: Replace with:
    // const response = await fetch(`${API_BASE_URL}/inventory/stats`, {
    //   headers: { Authorization: `Bearer ${getAuthToken()}` }
    // });

    await simulateDelay();
    const { inventoryStats } = await import('../data/mockInventory');
    return inventoryStats;
  } catch (error) {
    throw new Error(`Failed to fetch inventory stats: ${error.message}`);
  }
};

// Export to CSV
export const exportInventoryToCSV = (data, filename = 'inventory.csv') => {
  const headers = ['Product', 'SKU', 'Category', 'Quantity', 'Reserved', 'Available', 'Status'];
  const csvContent = [
    headers.join(','),
    ...data.map((item) =>
      [
        item.productName,
        item.sku,
        item.category,
        item.quantity,
        item.reservedQuantity,
        item.availableQuantity,
        item.status,
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
};
