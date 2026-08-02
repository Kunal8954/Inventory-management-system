const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchCustomers = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch customers: ${res.status} ${res.statusText} ${text}`);
    }

    return await res.json();
  } catch (error) {
    throw new Error(`Failed to fetch customers: ${error.message}`);
  }
};

export const createCustomer = async (payload) => {
  try {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create customer: ${res.status} ${res.statusText} ${text}`);
    }

    return await res.json();
  } catch (error) {
    throw new Error(`Failed to create customer: ${error.message}`);
  }
};
