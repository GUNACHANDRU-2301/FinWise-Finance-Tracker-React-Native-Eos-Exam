
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../utils/notificationService";

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";
const PALE = "#DDF6E5";

const TABS = [
  {
    name: "Home",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    name: "Analysis",
    icon: "stats-chart-outline",
    activeIcon: "stats-chart",
  },
  {
    name: "Transactions",
    icon: "swap-horizontal-outline",
    activeIcon: "swap-horizontal",
  },
  {
    name: "Categories",
    icon: "grid-outline",
    activeIcon: "grid",
  },
  {
    name: "Profile",
    icon: "person-outline",
    activeIcon: "person",
  },
];

const getNotificationIcon = (type) => {
  switch (type) {
    case "income":
      return "trending-up-outline";
    case "expense":
      return "trending-down-outline";
    case "delete":
      return "trash-outline";
    case "security":
      return "shield-checkmark-outline";
    default:
      return "notifications-outline";
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case "income":
      return "#00A982";
    case "expense":
      return "#E65A5A";
    case "delete":
      return "#F4A340";
    case "security":
      return "#1683FF";
    default:
      return GREEN;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationScreen({
  route,
  navigation,
}) {
  const session = route?.params?.session;
  const email = session?.email || "guest";
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(email);
      setNotifications(data);
    } catch (error) {
      console.log("Notification load error:", error);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  // Navigate to the actual Bottom Tab navigator
  // inside the Drawer navigator.
  const goToTab = (tabName) => {
    navigation.navigate("MainTabs", {
      screen: tabName,
    });
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      goToTab("Home");
    }
  };

  const handleRead = async (id) => {
    try {
      const updated = await markNotificationAsRead(
        email,
        id
      );
      setNotifications(updated);
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to update notification"
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const updated = await markAllNotificationsAsRead(
        email
      );
      setNotifications(updated);
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to mark notifications as read"
      );
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Notification",
      "Do you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updated =
                await deleteNotification(email, id);

              setNotifications(updated);
            } catch (error) {
              Alert.alert(
                "Error",
                "Unable to delete notification"
              );
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear Notifications",
      "Are you sure you want to delete all notifications?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllNotifications(email);
              setNotifications([]);
            } catch (error) {
              Alert.alert(
                "Error",
                "Unable to clear notifications"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={DARK}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Notifications
            </Text>

            <Text style={styles.headerSubtitle}>
              Stay updated with your finances
            </Text>
          </View>

          <View style={styles.bellContainer}>
            <Ionicons
              name="notifications-outline"
              size={27}
              color={DARK}
            />

            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* RECENT ACTIVITY */}
      <View style={styles.actionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>
            Recent Activity
          </Text>

          <Text style={styles.unreadText}>
            {unreadCount} unread notifications
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
          >
            <Text style={styles.markAllText}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* NOTIFICATION LIST */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={GREEN}
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="notifications-off-outline"
                  size={50}
                  color={GREEN}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Notifications Yet
              </Text>

              <Text style={styles.emptyText}>
                Your transaction updates and financial
                alerts will appear here.
              </Text>
            </View>
          ) : (
            <>
              {notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notificationCard,
                    !item.isRead && styles.unreadCard,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleRead(item.id)}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor:
                          getNotificationColor(
                            item.type
                          ) + "18",
                      },
                    ]}
                  >
                    <Ionicons
                      name={getNotificationIcon(
                        item.type
                      )}
                      size={23}
                      color={getNotificationColor(
                        item.type
                      )}
                    />
                  </View>

                  <View
                    style={styles.notificationContent}
                  >
                    <View style={styles.titleRow}>
                      <Text
                        style={styles.notificationTitle}
                      >
                        {item.title}
                      </Text>

                      {!item.isRead && (
                        <View
                          style={styles.unreadDot}
                        />
                      )}
                    </View>

                    <Text
                      style={styles.notificationMessage}
                    >
                      {item.message}
                    </Text>

                    <Text
                      style={styles.notificationDate}
                    >
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      handleDelete(item.id)
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color="#E65A5A"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <Ionicons
                  name="trash-bin-outline"
                  size={18}
                  color="#E65A5A"
                />

                <Text style={styles.clearText}>
                  Clear All Notifications
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* BOTTOM NAVIGATION */}
      <View
        style={[
          styles.bottomNavigation,
          {
            paddingBottom: Math.max(
              insets.bottom,
              10
            ),
          },
        ]}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            activeOpacity={0.7}
            onPress={() => goToTab(tab.name)}
          >
            <Ionicons
              name={tab.icon}
              size={23}
              color="#789287"
            />

            <Text style={styles.tabLabel}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },

  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 23,
    paddingTop: 18,
    paddingBottom: 30,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 12,
    gap: 7,
  },

  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: DARK,
  },

  headerSubtitle: {
    fontSize: 12,
    color: DARK,
    marginTop: 7,
  },

  bellContainer: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: PALE,
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E65A5A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 23,
    paddingBottom: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
  },

  unreadText: {
    fontSize: 12,
    color: "#789287",
    marginTop: 5,
  },

  markAllText: {
    fontSize: 12,
    color: "#00A982",
    fontWeight: "bold",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    borderWidth: 1,
    borderColor: "#EDF3EF",
  },

  unreadCard: {
    borderColor: GREEN,
    backgroundColor: "#F7FFFA",
  },

  iconContainer: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  notificationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
    flex: 1,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
    marginLeft: 8,
  },

  notificationMessage: {
    fontSize: 12,
    color: "#56766A",
    lineHeight: 19,
    marginTop: 7,
  },

  notificationDate: {
    fontSize: 10,
    color: "#93A79C",
    marginTop: 10,
  },

  deleteButton: {
    padding: 5,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: PALE,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: DARK,
    marginTop: 20,
  },

  emptyText: {
    fontSize: 13,
    color: "#789287",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
  },

  clearButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    gap: 9,
  },

  clearText: {
    color: "#E65A5A",
    fontWeight: "600",
    fontSize: 13,
  },

  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DCEDE2",
    paddingTop: 11,
    paddingHorizontal: 4,
    elevation: 8,
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 5,
  },

  tabLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#789287",
    textAlign: "center",
  },
});
