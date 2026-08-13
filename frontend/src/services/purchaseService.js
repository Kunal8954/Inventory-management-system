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

export const receivePurchaseOrder = async (purchaseOrderId) => {
  try {
    return await api.put(`/purchase-orders/${purchaseOrderId}/receive`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to mark purchase order received');
  }
};

export const updatePurchaseOrderPayment = async (purchaseOrderId, paymentStatus = 'Paid') => {
  try {
    return await api.put(`/purchase-orders/${purchaseOrderId}/payment`, { payment_status: paymentStatus });
  } catch (error) {
    throw new Error(error.message || 'Failed to update payment status');
  }
};

export default { fetchPurchaseOrders, createPurchaseOrder, receivePurchaseOrder, updatePurchaseOrderPayment };