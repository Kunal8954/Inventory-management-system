import { api } from './api';

export const fetchFinancialSummary = async () => {
  try {
    return await api.get('/dashboard/financial-summary');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch financial summary');
  }
};

export default { fetchFinancialSummary };