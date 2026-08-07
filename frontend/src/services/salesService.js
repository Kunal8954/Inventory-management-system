import { api } from './api';

export const fetchOrders = async () => {
  try {
    return await api.get('/orders');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch orders');
  }
};

export default { fetchOrders };
