const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchOrders = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch orders: ${res.status} ${res.statusText} ${text}`);
    }

    return await res.json();
  } catch (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
};
