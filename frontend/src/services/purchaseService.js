import { api } from './api';

export const fetchPurchaseOrders = async () => {
  try {
    return await api.get('/purchase-orders');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch purchase orders');
  }
};

export const createPurchaseOrder = async (payload) => {
  try {
    return await api.post('/purchase-orders', payload);
  } catch (error) {
    throw new Error(error.message || 'Failed to create purchase order');
  }
};

export default { fetchPurchaseOrders, createPurchaseOrder };