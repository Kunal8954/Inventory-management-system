import { api } from './api';

export const fetchSuppliers = async () => {
  try {
    return await api.get('/suppliers');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch suppliers');
  }
};

export const createSupplier = async (payload) => {
  try {
    return await api.post('/suppliers', payload);
  } catch (error) {
    throw new Error(error.message || 'Failed to create supplier');
  }
};

export default { fetchSuppliers, createSupplier };