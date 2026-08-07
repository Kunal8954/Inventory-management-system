import { api } from './api';

export const fetchCategories = async () => {
  try {
    return await api.get('/categories');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch categories');
  }
};

export const createCategory = async (payload) => {
  try {
    return await api.post('/categories', payload);
  } catch (error) {
    throw new Error(error.message || 'Failed to create category');
  }
};

export default { fetchCategories, createCategory };