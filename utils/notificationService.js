
import AsyncStorage from "@react-native-async-storage/async-storage";

const getNotificationKey = (email) => {
  const userEmail = String(email || "guest")
    .trim()
    .toLowerCase();

  return `finwise_notifications_${userEmail}`;
};

export const getNotifications = async (email) => {
  try {
    const key = getNotificationKey(email);
    const saved = await AsyncStorage.getItem(key);

    if (!saved) return [];

    const notifications = JSON.parse(saved);

    if (!Array.isArray(notifications)) {
      return [];
    }

    return notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.log("Get notifications error:", error);
    return [];
  }
};

export const addNotification = async ({
  email,
  title,
  message,
  type = "info",
}) => {
  try {
    const key = getNotificationKey(email);
    const notifications = await getNotifications(email);

    const notification = {
      id:
        Date.now().toString() +
        Math.random().toString(36).slice(2, 8),
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [notification, ...notifications];

    await AsyncStorage.setItem(
      key,
      JSON.stringify(updated)
    );

    return notification;
  } catch (error) {
    console.log("Add notification error:", error);
    return null;
  }
};

export const getUnreadCount = async (email) => {
  const notifications = await getNotifications(email);

  return notifications.filter(
    (notification) => !notification.isRead
  ).length;
};

export const markNotificationAsRead = async (
  email,
  notificationId
) => {
  const key = getNotificationKey(email);
  const notifications = await getNotifications(email);

  const updated = notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, isRead: true }
      : notification
  );

  await AsyncStorage.setItem(
    key,
    JSON.stringify(updated)
  );

  return updated;
};

export const markAllNotificationsAsRead = async (email) => {
  const key = getNotificationKey(email);
  const notifications = await getNotifications(email);

  const updated = notifications.map((notification) => ({
    ...notification,
    isRead: true,
  }));

  await AsyncStorage.setItem(
    key,
    JSON.stringify(updated)
  );

  return updated;
};

export const deleteNotification = async (
  email,
  notificationId
) => {
  const key = getNotificationKey(email);
  const notifications = await getNotifications(email);

  const updated = notifications.filter(
    (notification) =>
      notification.id !== notificationId
  );

  await AsyncStorage.setItem(
    key,
    JSON.stringify(updated)
  );

  return updated;
};

export const clearAllNotifications = async (email) => {
  const key = getNotificationKey(email);

  await AsyncStorage.setItem(
    key,
    JSON.stringify([])
  );

  return [];
};
