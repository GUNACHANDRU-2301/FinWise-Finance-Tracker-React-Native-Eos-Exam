
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";
const PALE = "#DDF6E5";

function MenuItem({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color={DARK} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>

        {!!subtitle && (
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#78948A"
      />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({
  route,
  navigation,
  onUpdateProfile,
  onRefreshAccounts,
}) {
  const session = route?.params?.session;
  const email = session?.email || "guest";
  const storageKey = `finwise_profile_${email}`;

  const [page, setPage] = useState("Profile");

  const [name, setName] = useState(session?.name || "");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  const [notifications, setNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);

  // Load saved profile whenever this screen receives focus.
  const loadProfile = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(storageKey);

      if (saved) {
        const data = JSON.parse(saved);

        setName(data.name || session?.name || "");
        setPhone(data.phone || "");
        setDob(data.dob || "");
        setNotifications(data.notifications !== false);
        setSecurityAlerts(data.securityAlerts !== false);
      } else {
        setName(session?.name || "");
        setPhone("");
        setDob("");
        setNotifications(true);
        setSecurityAlerts(true);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to load profile");
    }
  }, [storageKey, session?.name]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // FIX 1: Save profile AND update App.js session.
  const saveProfile = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanDob = dob.trim();

    if (cleanName.length < 2) {
      Alert.alert("Validation", "Enter a valid full name");
      return;
    }

    if (cleanPhone && !/^[0-9]{10}$/.test(cleanPhone)) {
      Alert.alert(
        "Validation",
        "Enter a valid 10-digit phone number"
      );
      return;
    }

    if (
      cleanDob &&
      !/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDob)
    ) {
      Alert.alert("Validation", "Use DOB format DD/MM/YYYY");
      return;
    }

    if (saving) return;

    try {
      setSaving(true);

      // Keep the original profile storage.
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          dob: cleanDob,
          notifications,
          securityAlerts,
        })
      );

      // NEW: Sync updated name with account and session.
      if (typeof onUpdateProfile === "function") {
        await onUpdateProfile(cleanName);
      }

      setName(cleanName);
      setPhone(cleanPhone);
      setDob(cleanDob);

      Alert.alert(
        "Success",
        "Profile updated successfully"
      );

      setPage("Profile");
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to sync profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (
    nextNotifications,
    nextSecurityAlerts
  ) => {
    try {
      // Preserve other saved profile fields.
      const saved = await AsyncStorage.getItem(storageKey);
      const existing = saved ? JSON.parse(saved) : {};

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          ...existing,
          name: existing.name || name,
          phone: existing.phone ?? phone,
          dob: existing.dob ?? dob,
          notifications: nextNotifications,
          securityAlerts: nextSecurityAlerts,
        })
      );
    } catch (error) {
      Alert.alert("Error", "Unable to save settings");
    }
  };

  // FIX 2: Save password AND refresh accounts.
  const changePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(
        "Validation",
        "Please fill all password fields"
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Validation",
        "New password must contain at least 6 characters"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Validation",
        "New passwords do not match"
      );
      return;
    }

    if (saving) return;

    try {
      setSaving(true);

      const saved = await AsyncStorage.getItem(
        "finwise_accounts"
      );

      const accounts = saved ? JSON.parse(saved) : [];

      const index = accounts.findIndex(
        (user) =>
          user.email?.toLowerCase() === email.toLowerCase()
      );

      if (index === -1) {
        Alert.alert("Error", "Account not found");
        return;
      }

      if (accounts[index].password !== oldPassword) {
        Alert.alert(
          "Error",
          "Current password is incorrect"
        );
        return;
      }

      // Update customer password.
      accounts[index] = {
        ...accounts[index],
        password: newPassword,
      };

      await AsyncStorage.setItem(
        "finwise_accounts",
        JSON.stringify(accounts)
      );

      // NEW: Refresh accounts in App.js.
      if (typeof onRefreshAccounts === "function") {
        await onRefreshAccounts();
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Success",
        "Password changed successfully"
      );

      setPage("Profile");
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to update password. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const Header = ({ title }) => (
    <View style={styles.header}>
      {page !== "Profile" && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setPage("Profile")}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={DARK}
          />
        </TouchableOpacity>
      )}

      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );

  // ---------------- EDIT PROFILE ----------------

  if (page === "Edit") {
    return (
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Header title="Edit Profile" />

        <View style={styles.body}>
          <Text style={styles.fieldLabel}>Full Name</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>
            Email Address
          </Text>

          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false}
          />

          <Text style={styles.fieldLabel}>
            Phone Number
          </Text>

          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="10-digit mobile number"
          />

          <Text style={styles.fieldLabel}>
            Date of Birth
          </Text>

          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="DD/MM/YYYY"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={saveProfile}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ---------------- SETTINGS ----------------

  if (page === "Settings") {
    return (
      <ScrollView style={styles.container}>
        <Header title="Settings" />

        <View style={styles.body}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>
                Push Notifications
              </Text>

              <Text style={styles.menuSubtitle}>
                Enable transaction notifications
              </Text>
            </View>

            <Switch
              value={notifications}
              onValueChange={(value) => {
                setNotifications(value);
                saveSettings(value, securityAlerts);
              }}
              trackColor={{ true: GREEN }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>
                Security Alerts
              </Text>

              <Text style={styles.menuSubtitle}>
                Enable security reminders
              </Text>
            </View>

            <Switch
              value={securityAlerts}
              onValueChange={(value) => {
                setSecurityAlerts(value);
                saveSettings(notifications, value);
              }}
              trackColor={{ true: GREEN }}
            />
          </View>

          <MenuItem
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => setPage("Password")}
          />

          <MenuItem
            icon="information-circle-outline"
            title="About FinWise"
            subtitle="Finance Budget Tracker"
            onPress={() =>
              Alert.alert(
                "FinWise",
                "Personal Finance Budget Tracker\nVersion 1.0"
              )
            }
          />
        </View>
      </ScrollView>
    );
  }

  // ---------------- CHANGE PASSWORD ----------------

  if (page === "Password") {
    return (
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Header title="Change Password" />

        <View style={styles.body}>
          <Text style={styles.fieldLabel}>
            Current Password
          </Text>

          <TextInput
            style={styles.input}
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="Current Password"
          />

          <Text style={styles.fieldLabel}>
            New Password
          </Text>

          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New Password"
          />

          <Text style={styles.fieldLabel}>
            Confirm New Password
          </Text>

          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm New Password"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={changePassword}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Updating..." : "Update Password"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ---------------- PROFILE HOME ----------------

  return (
    <ScrollView style={styles.container}>
      <Header title="My Profile" />

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={46}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.profileName}>
          {session?.name || name}
        </Text>

        <Text style={styles.profileEmail}>
          {email}
        </Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {session?.role || "Customer"}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <MenuItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Update your personal information"
          onPress={() => setPage("Edit")}
        />

        <MenuItem
          icon="settings-outline"
          title="Settings"
          subtitle="Notifications and security"
          onPress={() => setPage("Settings")}
        />

        <MenuItem
          icon="shield-checkmark-outline"
          title="Security"
          subtitle="Change your password"
          onPress={() => setPage("Password")}
        />

        <Text
          style={[
            styles.sectionTitle,
            { marginTop: 25 },
          ]}
        >
          Support
        </Text>

        <MenuItem
          icon="help-circle-outline"
          title="Help & FAQ"
          subtitle="Frequently asked questions"
          onPress={() =>
            Alert.alert(
              "Help & FAQ",
              "FinWise helps you track income, expenses, categories, and financial reports."
            )
          }
        />

        <MenuItem
          icon="chatbubble-ellipses-outline"
          title="Online Support"
          subtitle="Contact support"
          onPress={() =>
            Alert.alert(
              "Online Support",
              "Demo mode: Live support is not connected."
            )
          }
        />

        <Text style={styles.footer}>
          FinWise • Version 1.0
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },

  header: {
    backgroundColor: GREEN,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 22,
    alignItems: "center",
  },

  backButton: {
    position: "absolute",
    left: 20,
    top: 25,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
  },

  profileHeader: {
    backgroundColor: GREEN,
    alignItems: "center",
    paddingBottom: 40,
  },

  avatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#1683FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },

  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: DARK,
    marginTop: 13,
  },

  profileEmail: {
    fontSize: 13,
    color: DARK,
    marginTop: 5,
  },

  roleBadge: {
    backgroundColor: PALE,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 13,
  },

  roleText: {
    fontSize: 12,
    color: DARK,
    fontWeight: "bold",
  },

  body: {
    backgroundColor: LIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    padding: 22,
    paddingBottom: 45,
    minHeight: 400,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 15,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },

  menuIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: PALE,
    alignItems: "center",
    justifyContent: "center",
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
  },

  menuSubtitle: {
    fontSize: 11,
    color: "#777",
    marginTop: 5,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 9,
  },

  input: {
    height: 53,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#D9EDE1",
    color: DARK,
  },

  disabledInput: {
    backgroundColor: "#E7F0E9",
    color: "#777",
  },

  primaryButton: {
    backgroundColor: GREEN,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: DARK,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 17,
    marginBottom: 14,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#888",
    marginTop: 30,
  },
});
