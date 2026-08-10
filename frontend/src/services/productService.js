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

export const updateProduct = async (productId, payload) => {
  try {
    return await api.put(`/products/${productId}`, payload);
  } catch (error) {
    throw new Error(error.message || 'Failed to update product');
  }
};

export const deleteProduct = async (productId) => {
  try {
    return await api.del(`/products/${productId}`);
  } catch (error) {
    throw new Error(error.message || 'Failed to delete product');
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

export const fetchProductImages = async (productId) => {
  try {
    return await api.get(`/products/${productId}/images`);
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch photos');
  }
};

export const deleteProductImage = async (productId, imageId) => {
  try {
    return await api.del(`/products/${productId}/images/${imageId}`);
  } catch (error) {
    throw new Error(error.message || 'Failed to delete photo');
  }
};

export const setProductImagePrimary = async (productId, imageId) => {
  try {
    return await api.put(`/products/${productId}/images/${imageId}/primary`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to set primary photo');
  }
};

export default {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  fetchProductImages,
  deleteProductImage,
  setProductImagePrimary,
};