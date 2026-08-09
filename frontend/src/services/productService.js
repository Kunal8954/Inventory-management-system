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

export const uploadProductImage = async (productId, file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    return await api.post(`/products/${productId}/image`, formData);
  } catch (error) {
    throw new Error(error.message || 'Failed to upload image');
  }
};

export default { fetchProducts, createProduct, uploadProductImage };