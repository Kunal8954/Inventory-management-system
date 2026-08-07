import { api } from './api';

export const fetchCustomers = async () => {
  try {
    return await api.get('/customers');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch customers');
  }
};

export const createCustomer = async (payload) => {
  try {
    return await api.post('/customers', payload);
  } catch (error) {
    throw new Error(error.message || 'Failed to create customer');
  }
};

export default { fetchCustomers, createCustomer };
