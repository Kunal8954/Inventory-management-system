import { api } from './api';

export const fetchOrders = async () => {
  try {
    return await api.get('/orders');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch orders');
  }
};

export const createOrder = async (payload) => {
  try {
    return await api.post('/orders', payload);
  } catch (error) {
    throw new Error(error.message || 'Failed to create order');
  }
};

export const updateOrderPayment = async (orderId, paymentStatus = 'Paid') => {
  try {
    return await api.put(`/orders/${orderId}/payment`, { payment_status: paymentStatus });
  } catch (error) {
    throw new Error(error.message || 'Failed to update payment status');
  }
};

export const approveOrder = async (orderId) => {
  try {
    return await api.put(`/orders/${orderId}/approve`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to approve order');
  }
};

export default { fetchOrders, createOrder, updateOrderPayment, approveOrder };