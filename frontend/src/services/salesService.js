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

export const fetchRefundRequests = async () => {
  try {
    return await api.get('/refund-requests');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch refund requests');
  }
};

export const approveRefundRequest = async (requestId) => {
  try {
    return await api.put(`/refund-requests/${requestId}/approve`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to approve refund');
  }
};

export const rejectRefundRequest = async (requestId, staffNote) => {
  try {
    return await api.put(`/refund-requests/${requestId}/reject`, { staff_note: staffNote });
  } catch (error) {
    throw new Error(error.message || 'Failed to reject refund request');
  }
};

export const completeOrder = async (orderId) => {
  try {
    return await api.put(`/orders/${orderId}/complete`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to complete order');
  }
};

export default { fetchOrders, createOrder, updateOrderPayment, approveOrder, completeOrder, fetchRefundRequests, approveRefundRequest, rejectRefundRequest };