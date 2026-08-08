import { api } from './api';

export const fetchUsers = async () => {
  try {
    return await api.get('/users');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch users');
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    return await api.put(`/users/${userId}/role`, { role });
  } catch (error) {
    throw new Error(error.message || 'Failed to update user role');
  }
};

export default { fetchUsers, updateUserRole };