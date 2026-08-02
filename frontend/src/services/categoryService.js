const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText} ${text}`);
    }

    return await res.json();
  } catch (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
};
