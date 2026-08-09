import { api } from './api';

export const fetchPendingPayments = async () => {
  try {
    return await api.get('/payments/pending');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch pending payments');
  }
};

export const setCustomerReminderInterval = async (customerId, days) => {
  try {
    return await api.put(`/customers/${customerId}/reminder-interval`, { reminder_interval_days: days });
  } catch (error) {
    throw new Error(error.message || 'Failed to update reminder interval');
  }
};

export const setSupplierReminderInterval = async (supplierId, days) => {
  try {
    return await api.put(`/suppliers/${supplierId}/reminder-interval`, { reminder_interval_days: days });
  } catch (error) {
    throw new Error(error.message || 'Failed to update reminder interval');
  }
};

export const sendCustomerPaymentReminder = async (orderId) => {
  try {
    return await api.post(`/orders/${orderId}/send-payment-reminder`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to send reminder');
  }
};

export const sendVendorPaymentReminder = async (purchaseOrderId) => {
  try {
    return await api.post(`/purchase-orders/${purchaseOrderId}/send-payment-reminder`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to send reminder');
  }
};

export default {
  fetchPendingPayments,
  setCustomerReminderInterval,
  setSupplierReminderInterval,
  sendCustomerPaymentReminder,
  sendVendorPaymentReminder,
};