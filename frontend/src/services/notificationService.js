import { api } from './api';

export const fetchNotifications = async () => {
  try {
    return await api.get('/notifications');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch notifications');
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    return await api.put(`/notifications/${notificationId}/read`, {});
  } catch (error) {
    throw new Error(error.message || 'Failed to mark notification as read');
  }
};

export default { fetchNotifications, markNotificationRead };