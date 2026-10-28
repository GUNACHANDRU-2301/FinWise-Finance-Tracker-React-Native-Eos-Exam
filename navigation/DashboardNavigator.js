
import React, { useState, useCallback } from "react";

import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";

import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
  useFocusEffect,
} from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import {
  getUnreadCount,
} from "../utils/notificationService";

// Customer Screens
import HomeScreen from "../screens/HomeScreen";
import AnalysisScreen from "../screens/AnalysisScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationScreen from "../screens/NotificationScreen";

// Admin Screens
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import AdminAnalysisScreen from "../screens/AdminAnalysisScreen";

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";
const PALE = "#DDF6E5";

// ==========================================
// NOTIFICATION BELL
// ==========================================

function NotificationBell({ navigation, email }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadCount = async () => {
        try {
          const count = await getUnreadCount(email);

          if (active) {
            setUnreadCount(count);
          }
        } catch (error) {
          console.log(
            "Notification count error:",
            error
          );
        }
      };

      loadCount();

      return () => {
        active = false;
      };
    }, [email])
  );

  return (
    <TouchableOpacity
      style={styles.notificationButton}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate("Notifications")
      }
    >
      <Ionicons
        name="notifications-outline"
        size={24}
        color={DARK}
      />

      {unreadCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ==========================================
// CUSTOMER / ADMIN BOTTOM TABS
// ==========================================

function MainTabs({
  session,
  onUpdateProfile,
  onRefreshAccounts,
}) {
  const isAdmin =
    String(session?.role || "").toLowerCase() ===
    "admin";

  const screens = isAdmin
    ? [
        {
          name: "Home",
          component: AdminDashboardScreen,
          icon: "home-outline",
        },
        {
          name: "Analysis",
          component: AdminAnalysisScreen,
          icon: "pie-chart-outline",
        },
      ]
    : [
        {
          name: "Home",
          component: HomeScreen,
          icon: "home-outline",
        },
        {
          name: "Analysis",
          component: AnalysisScreen,
          icon: "stats-chart-outline",
        },
        {
          name: "Transactions",
          component: TransactionsScreen,
          icon: "swap-horizontal-outline",
        },
        {
          name: "Categories",
          component: CategoriesScreen,
          icon: "grid-outline",
        },
        {
          name: "Profile",
          component: ProfileScreen,
          icon: "person-outline",
        },
      ];

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => {
        const current = screens.find(
          (item) => item.name === route.name
        );

        return {
          headerShown: false,

          tabBarActiveTintColor: DARK,
          tabBarInactiveTintColor: "#77968B",

          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            height: 65,
            paddingBottom: 8,
            paddingTop: 7,
          },

          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
          },

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? current?.icon?.replace(
                      "-outline",
                      ""
                    ) || "ellipse"
                  : current?.icon ||
                    "ellipse-outline"
              }
              size={size}
              color={color}
            />
          ),
        };
      }}
    >
      {screens.map((item) => (
        <Tab.Screen
          key={item.name}
          name={item.name}
        >
          {(props) => {
            const ScreenComponent = item.component;

            return (
              <ScreenComponent
                {...props}
                onUpdateProfile={onUpdateProfile}
                onRefreshAccounts={onRefreshAccounts}
                route={{
                  ...props.route,
                  params: {
                    ...props.route.params,
                    name: session?.name,
                    session,
                  },
                }}
              />
            );
          }}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}

// ==========================================
// ABOUT SCREEN
// ==========================================

function AboutScreen() {
  return (
    <View style={styles.aboutContainer}>
      <Ionicons
        name="wallet-outline"
        size={65}
        color={GREEN}
      />

      <Text style={styles.aboutTitle}>
        FinWise
      </Text>

      <Text style={styles.aboutText}>
        Smart Finance & Budget Tracker
      </Text>

      <Text style={styles.aboutText}>
        Track income, manage expenses,
        analyze spending, and improve
        your financial habits.
      </Text>

      <Text style={styles.version}>
        Version 1.0
      </Text>
    </View>
  );
}

// ==========================================
// CUSTOM DRAWER CONTENT
// ==========================================

function CustomDrawerContent({
  navigation,
  session,
  onLogout,
  ...props
}) {
  const [logoutVisible, setLogoutVisible] =
    useState(false);

  const isAdmin =
    String(session?.role || "").toLowerCase() ===
    "admin";

  const handleLogout = () => {
    setLogoutVisible(false);

    if (typeof onLogout === "function") {
      onLogout();
    }
  };

  const navigateToTab = (screen) => {
    navigation.navigate("MainTabs", {
      screen,
    });

    navigation.closeDrawer();
  };

  return (
    <>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          flexGrow: 1,
        }}
      >
        <View style={styles.drawerHeader}>
          <Ionicons
            name={
              isAdmin
                ? "shield-checkmark-outline"
                : "person-circle-outline"
            }
            size={65}
            color={DARK}
          />

          <Text style={styles.drawerName}>
            {session?.name || "User"}
          </Text>

          <Text style={styles.drawerEmail}>
            {session?.email || ""}
          </Text>

          <Text style={styles.drawerRole}>
            {isAdmin ? "Admin" : "Customer"}
          </Text>
        </View>

        <DrawerItem
          label={
            isAdmin
              ? "Admin Dashboard"
              : "Dashboard"
          }
          icon={({ color, size }) => (
            <Ionicons
              name="home-outline"
              color={color}
              size={size}
            />
          )}
          onPress={() =>
            navigateToTab("Home")
          }
        />

        <DrawerItem
          label={
            isAdmin
              ? "Category Analysis"
              : "Analysis"
          }
          icon={({ color, size }) => (
            <Ionicons
              name="pie-chart-outline"
              color={color}
              size={size}
            />
          )}
          onPress={() =>
            navigateToTab("Analysis")
          }
        />

        {!isAdmin && (
          <>
            <DrawerItem
              label="Transactions"
              icon={({ color, size }) => (
                <Ionicons
                  name="swap-horizontal-outline"
                  color={color}
                  size={size}
                />
              )}
              onPress={() =>
                navigateToTab("Transactions")
              }
            />

            <DrawerItem
              label="Categories"
              icon={({ color, size }) => (
                <Ionicons
                  name="grid-outline"
                  color={color}
                  size={size}
                />
              )}
              onPress={() =>
                navigateToTab("Categories")
              }
            />

            <DrawerItem
              label="Profile"
              icon={({ color, size }) => (
                <Ionicons
                  name="person-outline"
                  color={color}
                  size={size}
                />
              )}
              onPress={() =>
                navigateToTab("Profile")
              }
            />

            <DrawerItem
              label="Notifications"
              icon={({ color, size }) => (
                <Ionicons
                  name="notifications-outline"
                  color={color}
                  size={size}
                />
              )}
              onPress={() => {
                navigation.navigate(
                  "Notifications"
                );

                navigation.closeDrawer();
              }}
            />
          </>
        )}

        <DrawerItem
          label="About FinWise"
          icon={({ color, size }) => (
            <Ionicons
              name="information-circle-outline"
              color={color}
              size={size}
            />
          )}
          onPress={() => {
            navigation.navigate("About");
            navigation.closeDrawer();
          }}
        />

        <View style={{ flex: 1 }} />

        <DrawerItem
          label="Logout"
          labelStyle={{
            color: "#D64545",
          }}
          icon={() => (
            <Ionicons
              name="log-out-outline"
              color="#D64545"
              size={23}
            />
          )}
          onPress={() =>
            setLogoutVisible(true)
          }
        />
      </DrawerContentScrollView>

      {/* LOGOUT CONFIRMATION */}
      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setLogoutVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>
              End Session
            </Text>

            <Text style={styles.popupMessage}>
              Are you sure you want to
              log out?
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>
                Yes, End Session
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                setLogoutVisible(false)
              }
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ==========================================
// MAIN DASHBOARD NAVIGATOR
// ==========================================

export default function DashboardNavigator({
  session,
  onLogout,
  onUpdateProfile,
  onRefreshAccounts,
}) {
  const isAdmin =
    String(session?.role || "").toLowerCase() ===
    "admin";

  return (
    <Drawer.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: true,

        headerStyle: {
          backgroundColor: GREEN,
        },

        headerTintColor: DARK,

        headerTitleStyle: {
          fontWeight: "bold",
        },

        drawerActiveTintColor: DARK,
        drawerActiveBackgroundColor: LIGHT,
      }}
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          session={session}
          onLogout={onLogout}
        />
      )}
    >
      {/* MAIN TABS */}
      <Drawer.Screen
        name="MainTabs"
        options={({ navigation }) => ({
          title: isAdmin
            ? "FinWise Admin"
            : "FinWise",

          headerRight: () =>
            !isAdmin ? (
              <NotificationBell
                navigation={navigation}
                email={session?.email}
              />
            ) : null,
        })}
      >
        {() => (
          <MainTabs
            session={session}
            onUpdateProfile={onUpdateProfile}
            onRefreshAccounts={onRefreshAccounts}
          />
        )}
      </Drawer.Screen>

      {/* NOTIFICATION SCREEN */}
      {!isAdmin && (
        <Drawer.Screen
          name="Notifications"
          options={({ navigation }) => ({
            title: "Notifications",

            headerLeft: () => (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() =>
                  navigation.navigate(
                    "MainTabs"
                  )
                }
              >
                <Ionicons
                  name="arrow-back"
                  size={25}
                  color={DARK}
                />
              </TouchableOpacity>
            ),
          })}
        >
          {(props) => (
            <NotificationScreen
              {...props}
              route={{
                ...props.route,
                params: {
                  ...props.route.params,
                  session,
                },
              }}
            />
          )}
        </Drawer.Screen>
      )}

      {/* ABOUT SCREEN */}
      <Drawer.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: "About FinWise",
        }}
      />
    </Drawer.Navigator>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  notificationButton: {
    marginRight: 16,
    width: 43,
    height: 43,
    backgroundColor: PALE,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#E65A5A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },

  headerBackButton: {
    marginLeft: 17,
    padding: 8,
  },

  drawerHeader: {
    backgroundColor: GREEN,
    padding: 20,
    paddingTop: 35,
    marginBottom: 10,
  },

  drawerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK,
    marginTop: 10,
  },

  drawerEmail: {
    fontSize: 12,
    color: DARK,
    marginTop: 5,
  },

  drawerRole: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },

  aboutContainer: {
    flex: 1,
    backgroundColor: LIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  aboutTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: DARK,
    marginTop: 15,
  },

  aboutText: {
    fontSize: 14,
    color: "#56766A",
    textAlign: "center",
    marginTop: 15,
    lineHeight: 23,
  },

  version: {
    fontSize: 12,
    color: "#888",
    marginTop: 30,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  popup: {
    width: "100%",
    maxWidth: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 25,
    alignItems: "center",
    elevation: 12,
  },

  popupTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 14,
  },

  popupMessage: {
    fontSize: 12,
    color: "#444444",
    textAlign: "center",
    marginBottom: 28,
  },

  confirmButton: {
    backgroundColor: GREEN,
    width: "100%",
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },

  confirmText: {
    color: DARK,
    fontSize: 13,
    fontWeight: "600",
  },

  cancelButton: {
    backgroundColor: PALE,
    width: "100%",
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: "center",
  },

  cancelText: {
    color: DARK,
    fontSize: 13,
    fontWeight: "500",
  },
});
