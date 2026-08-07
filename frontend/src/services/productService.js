import { api } from './api';

export const fetchProducts = async () => {
  try {
    return await api.get('/products');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch products');
  }
};

export const createProduct = async (payload) => {
  try {
    return await api.post('/products', payload);
  } catch (error) {
    throw new Error(error.message || 'Failed to create product');
  }
};