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

export default { registerCustomer, fetchMyOrders, placeOrder, cancelOrder };