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

export default { fetchOrders, createOrder };