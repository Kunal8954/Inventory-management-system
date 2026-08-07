import { useState, useCallback, useEffect, useRef } from 'react';
import {
  fetchInventory,
  fetchInventoryStats,
  fetchLowStockAlerts,
  fetchTransactions,
} from '../services/inventoryService';

// Hook for managing notifications/toasts
export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), duration);
  }, []);

  const showSuccess = useCallback((message) => showNotification(message, 'success'), [showNotification]);
  const showError = useCallback((message) => showNotification(message, 'error', 5000), [showNotification]);
  const showWarning = useCallback((message) => showNotification(message, 'warning'), [showNotification]);
  const showInfo = useCallback((message) => showNotification(message, 'info'), [showNotification]);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotification: () => setNotification(null),
  };
};

// Hook for managing inventory data
export const useInventoryData = (initialData) => {
  const [data, setData] = useState(initialData || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateData = useCallback((newData) => {
    setData(newData);
    setError(null);
  }, []);

  const addItem = useCallback((item) => {
    setData((prevData) => [...prevData, item]);
  }, []);

  const updateItem = useCallback((id, updatedItem) => {
    setData((prevData) =>
      prevData.map((item) => (item.id === id ? { ...item, ...updatedItem } : item))
    );
  }, []);

  const removeItem = useCallback((id) => {
    setData((prevData) => prevData.filter((item) => item.id !== id));
  }, []);

  const setLoadingState = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  const setErrorState = useCallback((err) => {
    setError(err);
  }, []);

  return {
    data,
    isLoading,
    error,
    updateData,
    addItem,
    updateItem,
    removeItem,
    setLoadingState,
    setErrorState,
  };
};

// Hook for managing form state
export const useForm = (initialState = {}) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [touched]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    resetForm,
  };
};

// Hook for managing pagination
export const usePagination = (data, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const getCurrentPageData = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [currentPage, data, itemsPerPage]);

  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    getCurrentPageData,
    goToPage,
    nextPage,
    prevPage,
  };
};

// Hook for managing filters
export const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const clearFilter = useCallback((name) => {
    setFilters((prev) => {
      const { [name]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
  };
};

export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const loadInventory = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [inventoryData, statsData, lowStockData, transactionData] = await Promise.all([
        fetchInventory(),
        fetchInventoryStats(),
        fetchLowStockAlerts(),
        fetchTransactions(),
      ]);

      if (!mountedRef.current) {
        return;
      }

      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setStats(statsData || null);
      setLowStockAlerts(Array.isArray(lowStockData) ? lowStockData : []);
      setTransactions(Array.isArray(transactionData) ? transactionData : []);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(err.message || 'Failed to load inventory');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadInventory();

    return () => {
      mountedRef.current = false;
    };
  }, [loadInventory]);

  return {
    inventory,
    stats,
    lowStockAlerts,
    transactions,
    loading,
    error,
    refetch: loadInventory,
  };
};
