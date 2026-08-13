import { api } from './api';

export const registerCustomer = async (name, email, password, phone) => {
  try {
    return await api.post('/shop/register', { name, email, password, phone }, { auth: false });
  } catch (error) {
    return { success: false, error: error.message || 'Registration failed' };
  }
};

export const fetchMyOrders = async () => {
  try {
    return await api.get('/shop/orders');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch your orders');
  }
};

export const placeOrder = async (items, extra = {}) => {
  try {
    return await api.post('/shop/orders', { items, ...extra });
  } catch (error) {
    throw new Error(error.message || 'Failed to place order');
  }
};

export const cancelOrder = async (orderId) => {
  try {
    return await api.put(`/shop/orders/${orderId}/cancel`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to cancel order');
  }
};

export const createOrderPayment = async (orderId) => {
  try {
    return await api.post(`/shop/orders/${orderId}/create-payment`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to start payment');
  }
};

export const verifyOrderPayment = async (orderId, paymentData) => {
  try {
    return await api.post(`/shop/orders/${orderId}/verify-payment`, paymentData);
  } catch (error) {
    throw new Error(error.message || 'Payment verification failed');
  }
};

export const requestRefund = async (orderId, reason) => {
  try {
    return await api.post(`/shop/orders/${orderId}/request-refund`, { reason });
  } catch (error) {
    throw new Error(error.message || 'Failed to submit refund request');
  }
};

export const submitProductReview = async (productId, rating, comment) => {
  try {
    return await api.post(`/shop/products/${productId}/reviews`, { rating, comment });
  } catch (error) {
    throw new Error(error.message || 'Failed to submit review');
  }
};

export const fetchMyProfile = async () => {
  try {
    return await api.get('/shop/profile');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch your profile');
  }
};

export const updateMyProfile = async (profile) => {
  try {
    return await api.put('/shop/profile', profile);
  } catch (error) {
    throw new Error(error.message || 'Failed to update your profile');
  }
};

export default { registerCustomer, fetchMyOrders, placeOrder, cancelOrder, createOrderPayment, verifyOrderPayment, requestRefund, submitProductReview, fetchMyProfile, updateMyProfile };