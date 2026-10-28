
import "react-native-gesture-handler";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import DashboardNavigator from "./navigation/DashboardNavigator";

const Stack = createNativeStackNavigator();

const GREEN = "#00C99A";
const LIGHT = "#F0FFF2";
const DARK = "#073F3D";
const PALE = "#DDF6E5";
const BLUE = "#1683FF";

const ACCOUNTS_KEY = "finwise_accounts";
const ONBOARDING_KEY = "finwise_onboarding_completed_v2";

const ADMIN = {
  name: "Administrator",
  email: "admin@gmail.com",
  password: "123456",
  role: "Admin",
};

const validEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

async function readAccounts() {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  const parsed = raw ? JSON.parse(raw) : [];
  return Array.isArray(parsed) ? parsed : [];
}

// =======================================
// REUSABLE COMPONENTS
// =======================================

function FinWiseLogo({ size = 75, color = GREEN }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontSize: size * 0.7,
          color,
          fontWeight: "bold",
        }}
      >
        ↗
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 5,
        }}
      >
        {[18, 30, 42, 55].map((height, index) => (
          <View
            key={index}
            style={{
              width: size * 0.12,
              height: height * (size / 75),
              borderWidth: 3,
              borderColor: color,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function AuthLayout({ title, children }) {
  return (
    <View style={styles.authRoot}>
      <StatusBar
        backgroundColor={GREEN}
        barStyle="dark-content"
      />

      <View style={styles.authTop}>
        <Text style={styles.authTopTitle}>
          {title}
        </Text>
      </View>

      <View style={styles.authPanel}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.authScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType = "default",
  autoCapitalize = "none",
  maxLength,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.authInput}
          placeholder={placeholder}
          placeholderTextColor="#8BA99B"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />

        {secure && (
          <TouchableOpacity
            onPress={() => setVisible(!visible)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={DARK}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AuthButton({
  title,
  onPress,
  secondary = false,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.authButton,
        secondary && styles.authButtonSecondary,
        disabled && { opacity: 0.6 },
      ]}
    >
      <Text style={styles.authButtonText}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// =======================================
// SPLASH SCREEN
// =======================================

function SplashScreen({ navigation, onboardingDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(
        onboardingDone ? "Welcome" : "Onboarding"
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, onboardingDone]);

  return (
    <View style={styles.splash}>
      <StatusBar
        backgroundColor={GREEN}
        barStyle="dark-content"
      />

      <FinWiseLogo size={85} color={DARK} />

      <Text style={styles.splashTitle}>
        FinWise
      </Text>
    </View>
  );
}

// =======================================
// ONBOARDING SCREENS
// =======================================

function OnboardingScreen({ navigation, onComplete }) {
  const [page, setPage] = useState(0);

  const slides = [
    {
      title: "Welcome To\nExpense Manager",
      icon: "cash-outline",
      subtitle: "Manage your money with confidence",
    },
    {
      title:
        "Are You Ready To\nTake Control Of\nYour Finances?",
      icon: "phone-portrait-outline",
      subtitle: "Track your income and expenses easily",
    },
  ];

  const next = async () => {
    if (page === 0) {
      setPage(1);
      return;
    }

    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (error) {
      console.log("Onboarding storage:", error);
    }

    onComplete();
    navigation.replace("Welcome");
  };

  return (
    <View style={styles.onboardingRoot}>
      <View style={styles.onboardingUpper}>
        <Text style={styles.onboardingTitle}>
          {slides[page].title}
        </Text>
      </View>

      <View style={styles.onboardingLower}>
        <View style={styles.onboardingIllustration}>
          <View style={styles.onboardingCircle}>
            <Ionicons
              name={slides[page].icon}
              size={100}
              color={GREEN}
            />

            <View style={styles.onboardingCoin}>
              <Ionicons
                name={
                  page === 0
                    ? "logo-usd"
                    : "checkmark-circle"
                }
                size={30}
                color="#F4B942"
              />
            </View>
          </View>
        </View>

        <Text style={styles.onboardingSubtitle}>
          {slides[page].subtitle}
        </Text>

        <TouchableOpacity
          style={styles.onboardingNext}
          onPress={next}
        >
          <Text style={styles.onboardingNextText}>
            {page === 0 ? "Next" : "Get Started"}
          </Text>

          <Ionicons
            name="arrow-forward"
            size={19}
            color={DARK}
          />
        </TouchableOpacity>

        <View style={styles.onboardingDots}>
          {[0, 1].map((index) => (
            <View
              key={index}
              style={[
                styles.onboardingDot,
                page === index && styles.onboardingDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// =======================================
// WELCOME SCREEN
// =======================================

function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.welcomeContainer}>
      <FinWiseLogo size={100} />

      <Text style={styles.appName}>
        FinWise
      </Text>

      <Text style={styles.description}>
        Manage your money, track expenses,
        {"\n"}and achieve your financial goals.
      </Text>

      <AuthButton
        title="Log In"
        onPress={() => navigation.navigate("Login")}
      />

      <AuthButton
        title="Sign Up"
        secondary
        onPress={() => navigation.navigate("Signup")}
      />
    </View>
  );
}

// =======================================
// FIGMA SIGN IN SCREEN
// =======================================

function LoginScreen({ navigation, onLogin }) {
  const [role, setRole] = useState("Customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!validEmail(normalizedEmail) || !password) {
      Alert.alert(
        "Validation",
        "Enter a valid email and password."
      );
      return;
    }

    if (role === "Admin") {
      if (
        normalizedEmail === ADMIN.email &&
        password === ADMIN.password
      ) {
        onLogin({
          name: ADMIN.name,
          email: ADMIN.email,
          role: "Admin",
        });
      } else {
        Alert.alert(
          "Login Failed",
          "Invalid admin credentials."
        );
      }
      return;
    }

    try {
      setBusy(true);

      const accounts = await readAccounts();

      const customer = accounts.find(
        (user) =>
          user.email?.toLowerCase() === normalizedEmail &&
          user.password === password
      );

      if (!customer) {
        Alert.alert(
          "Login Failed",
          "Invalid email or password."
        );
        return;
      }

      onLogin({
        name: customer.name,
        email: customer.email,
        role: "Customer",
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to load account details."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome">
      <View style={{ height: 30 }} />

      <View style={styles.roleRow}>
        {["Customer", "Admin"].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setRole(item)}
            style={[
              styles.roleButton,
              role === item && styles.selectedRole,
            ]}
          >
            <Text style={styles.roleText}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <AuthField
        label="Username Or Email"
        placeholder="example@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <AuthField
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secure
      />

      <View style={{ height: 28 }} />

      <AuthButton
        title={busy ? "Logging In..." : "Log In"}
        disabled={busy}
        onPress={handleLogin}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword")}
      >
        <Text style={styles.tinyLink}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <AuthButton
        title="Sign Up"
        secondary
        onPress={() => navigation.navigate("Signup")}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("Fingerprint")}
      >
        <Text style={styles.bioLink}>
          Use <Text style={styles.blueText}>Fingerprint</Text> To Access
        </Text>
      </TouchableOpacity>

      <Text style={styles.orText}>
        or sign up with
      </Text>

      <View style={styles.socialRow}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Demo",
              "Facebook login is not configured."
            )
          }
        >
          <Ionicons
            name="logo-facebook"
            size={26}
            color={DARK}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Demo",
              "Google login is not configured."
            )
          }
        >
          <Ionicons
            name="logo-google"
            size={26}
            color={DARK}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Text
          style={styles.blueText}
          onPress={() => navigation.navigate("Signup")}
        >
          Sign Up
        </Text>
      </Text>
    </AuthLayout>
  );
}

// =======================================
// FIGMA SIGN UP SCREEN
// =======================================

function SignupScreen({ navigation, onAccountsChanged }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (name.trim().length < 2) {
      Alert.alert("Validation", "Enter your full name.");
      return;
    }

    if (!validEmail(normalizedEmail)) {
      Alert.alert("Validation", "Enter a valid email.");
      return;
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      Alert.alert(
        "Validation",
        "Enter a 10-digit mobile number."
      );
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob.trim())) {
      Alert.alert(
        "Validation",
        "Enter DOB in DD/MM/YYYY format."
      );
      return;
    }

    const [day, month, year] = dob.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date > new Date()
    ) {
      Alert.alert("Validation", "Enter a valid date of birth.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Validation",
        "Password must have at least 6 characters."
      );
      return;
    }

    if (password !== confirm) {
      Alert.alert(
        "Validation",
        "Passwords do not match."
      );
      return;
    }

    try {
      setBusy(true);

      const accounts = await readAccounts();

      const exists =
        normalizedEmail === ADMIN.email ||
        accounts.some(
          (user) =>
            user.email?.toLowerCase() === normalizedEmail
        );

      if (exists) {
        Alert.alert(
          "Already Registered",
          "This email already has an account."
        );
        return;
      }

      const updated = [
        ...accounts,
        {
          name: name.trim(),
          email: normalizedEmail,
          mobile: mobile.trim(),
          dob: dob.trim(),
          password,
          role: "Customer",
        },
      ];

      await AsyncStorage.setItem(
        ACCOUNTS_KEY,
        JSON.stringify(updated)
      );

      await onAccountsChanged();

      Alert.alert(
        "Success",
        "Account created successfully. Please log in."
      );

      navigation.replace("Login");
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to create account."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create Account">
      <AuthField
        label="Full Name"
        placeholder="Your full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <AuthField
        label="Email"
        placeholder="example@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <AuthField
        label="Mobile Number"
        placeholder="9876543210"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        maxLength={10}
      />

      <AuthField
        label="Date Of Birth"
        placeholder="DD/MM/YYYY"
        value={dob}
        onChangeText={setDob}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      <AuthField
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secure
      />

      <AuthField
        label="Confirm Password"
        placeholder="••••••••"
        value={confirm}
        onChangeText={setConfirm}
        secure
      />

      <Text style={styles.termsText}>
        By continuing, you agree to the{"\n"}
        Terms of Use and Privacy Policy.
      </Text>

      <AuthButton
        title={busy ? "Creating..." : "Sign Up"}
        disabled={busy}
        onPress={handleSignup}
      />

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text
          style={styles.blueText}
          onPress={() => navigation.navigate("Login")}
        >
          Log In
        </Text>
      </Text>
    </AuthLayout>
  );
}

// =======================================
// FORGOT PASSWORD
// =======================================

function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");

  const handleNext = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!validEmail(normalizedEmail)) {
      Alert.alert(
        "Validation",
        "Enter a valid email address."
      );
      return;
    }

    try {
      const accounts = await readAccounts();

      const exists = accounts.some(
        (user) =>
          user.email?.toLowerCase() === normalizedEmail
      );

      if (!exists) {
        Alert.alert(
          "Not Found",
          "No customer account found."
        );
        return;
      }

      Alert.alert(
        "Demo Recovery",
        "This is a UI demonstration. No verification email or SMS is sent, and password reset is disabled.",
        [
          {
            text: "View PIN Demo",
            onPress: () =>
              navigation.navigate("SecurityPin"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to check account."
      );
    }
  };

  return (
    <AuthLayout title="Forgot Password">
      <Text style={styles.sectionTitle}>
        Reset Password?
      </Text>

      <Text style={styles.explanation}>
        Enter your registered email address to view the
        password recovery demonstration.
      </Text>

      <View style={{ height: 65 }} />

      <AuthField
        label="Enter Email Address"
        placeholder="example@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <View style={{ height: 20 }} />

      <AuthButton
        title="Next Step"
        onPress={handleNext}
      />

      <View style={{ height: 45 }} />

      <AuthButton
        title="Sign Up"
        secondary
        onPress={() => navigation.navigate("Signup")}
      />

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text
          style={styles.blueText}
          onPress={() => navigation.navigate("Login")}
        >
          Log In
        </Text>
      </Text>
    </AuthLayout>
  );
}

// =======================================
// SECURITY PIN - UI DEMO
// =======================================

function SecurityPinScreen({ navigation }) {
  const [pin, setPin] = useState("");

  const handleAccept = () => {
    if (pin !== "123456") {
      Alert.alert(
        "Demo PIN",
        "Enter 123456 to preview the next screen."
      );
      return;
    }

    navigation.navigate("NewPassword");
  };

  return (
    <AuthLayout title="Security Pin">
      <Text style={styles.sectionTitle}>
        Enter Security Pin
      </Text>

      <Text style={styles.explanation}>
        Demo PIN: 123456. This is not real identity verification.
      </Text>

      <View style={{ height: 45 }} />

      <TextInput
        style={styles.pinInput}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="• • • • • •"
        placeholderTextColor="#78AB9B"
        textAlign="center"
      />

      <View style={{ height: 35 }} />

      <AuthButton
        title="Accept"
        onPress={handleAccept}
      />

      <AuthButton
        title="Send Again"
        secondary
        onPress={() =>
          Alert.alert(
            "Demo",
            "Use PIN 123456. No message has been sent."
          )
        }
      />
    </AuthLayout>
  );
}

// =======================================
// NEW PASSWORD - UI DEMO
// =======================================

function NewPasswordScreen({ navigation }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleChange = () => {
    if (password.length < 6) {
      Alert.alert(
        "Validation",
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirm) {
      Alert.alert(
        "Validation",
        "Passwords do not match."
      );
      return;
    }

    Alert.alert(
      "Demo Only",
      "The password was not changed. Real verification is required before enabling account recovery.",
      [
        {
          text: "Preview Success Screen",
          onPress: () =>
            navigation.navigate("PasswordSuccess"),
        },
      ]
    );
  };

  return (
    <AuthLayout title="New Password">
      <View style={{ height: 45 }} />

      <AuthField
        label="New Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secure
      />

      <AuthField
        label="Confirm New Password"
        placeholder="••••••••"
        value={confirm}
        onChangeText={setConfirm}
        secure
      />

      <View style={{ height: 95 }} />

      <AuthButton
        title="Change Password (Demo)"
        onPress={handleChange}
      />
    </AuthLayout>
  );
}

// =======================================
// PASSWORD SUCCESS - UI DEMO
// =======================================

function PasswordSuccessScreen({ navigation }) {
  return (
    <View style={styles.successRoot}>
      <StatusBar
        backgroundColor={GREEN}
        barStyle="light-content"
      />

      <Ionicons
        name="checkmark-circle-outline"
        size={115}
        color="white"
      />

      <Text style={styles.successText}>
        Password Change{"\n"}Success Preview
      </Text>

      <Text style={styles.successNote}>
        Demo screen only. No account password was changed.
      </Text>

      <AuthButton
        title="Back to Login"
        secondary
        onPress={() => navigation.navigate("Login")}
      />
    </View>
  );
}

// =======================================
// FINGERPRINT - UI DEMO
// =======================================

function FingerprintScreen({ navigation }) {
  return (
    <AuthLayout title="Security Fingerprint">
      <View style={{ height: 65 }} />

      <View style={styles.fingerprintCircle}>
        <Ionicons
          name="finger-print-outline"
          size={83}
          color="white"
        />
      </View>

      <Text
        style={[
          styles.sectionTitle,
          { textAlign: "center", marginTop: 35 },
        ]}
      >
        Use Fingerprint To Access
      </Text>

      <Text
        style={[
          styles.explanation,
          { textAlign: "center" },
        ]}
      >
        Fingerprint authentication is a UI demo.
        Real biometric login is not configured.
      </Text>

      <View style={{ height: 45 }} />

      <AuthButton
        title="Use Touch ID"
        secondary
        onPress={() =>
          Alert.alert(
            "Demo",
            "Biometric authentication is not enabled."
          )
        }
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.tinyLink}>
          Or prefer use password?
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

// =======================================
// MAIN APP
// =======================================

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const done = await AsyncStorage.getItem(
          ONBOARDING_KEY
        );

        setOnboardingDone(done === "true");

        await readAccounts();
      } catch (error) {
        console.log("Initial storage error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const refreshAccounts = async () => {
    await readAccounts();
  };

  const loginUser = (user) => {
    setSession(user);
  };

  const logoutUser = () => {
    setSession(null);
  };

  const updateUserProfile = async (updatedName) => {
    if (!session || session.role !== "Customer") {
      return;
    }

    const cleanName = updatedName.trim();

    if (cleanName.length < 2) {
      throw new Error("Invalid profile name");
    }

    const accounts = await readAccounts();

    const updatedAccounts = accounts.map((user) =>
      user.email === session.email
        ? { ...user, name: cleanName }
        : user
    );

    await AsyncStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(updatedAccounts)
    );

    setSession((previous) =>
      previous
        ? { ...previous, name: cleanName }
        : previous
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={GREEN}
        />

        <Text style={{ color: DARK, marginTop: 15 }}>
          Loading FinWise...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          key={session ? "logged-in" : "logged-out"}
          initialRouteName={
            session ? "Dashboard" : "Splash"
          }
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: LIGHT,
            },
          }}
        >
          {session ? (
            <Stack.Screen name="Dashboard">
              {() => (
                <DashboardNavigator
                  session={session}
                  onLogout={logoutUser}
                  onUpdateProfile={updateUserProfile}
                  onRefreshAccounts={refreshAccounts}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Splash">
                {(props) => (
                  <SplashScreen
                    {...props}
                    onboardingDone={onboardingDone}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="Onboarding">
                {(props) => (
                  <OnboardingScreen
                    {...props}
                    onComplete={() =>
                      setOnboardingDone(true)
                    }
                  />
                )}
              </Stack.Screen>

              <Stack.Screen
                name="Welcome"
                component={WelcomeScreen}
              />

              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onLogin={loginUser}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="Signup">
                {(props) => (
                  <SignupScreen
                    {...props}
                    onAccountsChanged={refreshAccounts}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
              />

              <Stack.Screen
                name="SecurityPin"
                component={SecurityPinScreen}
              />

              <Stack.Screen
                name="NewPassword"
                component={NewPasswordScreen}
              />

              <Stack.Screen
                name="PasswordSuccess"
                component={PasswordSuccessScreen}
              />

              <Stack.Screen
                name="Fingerprint"
                component={FingerprintScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// =======================================
// STYLES
// =======================================

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },

  splashTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  welcomeContainer: {
    flex: 1,
    backgroundColor: LIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  appName: {
    fontSize: 38,
    fontWeight: "bold",
    color: GREEN,
    marginTop: 12,
  },

  description: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 35,
    lineHeight: 20,
  },

  authRoot: {
    flex: 1,
    backgroundColor: GREEN,
  },

  authTop: {
    height: "24%",
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },

  authTopTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: DARK,
    textAlign: "center",
  },

  authPanel: {
    flex: 1,
    backgroundColor: LIGHT,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    overflow: "hidden",
  },

  authScroll: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 38,
    paddingBottom: 35,
  },

  fieldGroup: {
    marginBottom: 17,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK,
    marginLeft: 10,
    marginBottom: 7,
  },

  inputWrap: {
    width: "100%",
    minHeight: 42,
    backgroundColor: PALE,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
  },

  authInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 20,
    paddingVertical: 8,
    fontSize: 14,
    color: DARK,
  },

  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },

  authButton: {
    width: "65%",
    minHeight: 42,
    borderRadius: 30,
    backgroundColor: GREEN,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 12,
  },

  authButtonSecondary: {
    backgroundColor: PALE,
  },

  authButtonText: {
    color: DARK,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },

  roleButton: {
    flex: 1,
    borderRadius: 25,
    paddingVertical: 10,
    backgroundColor: PALE,
    alignItems: "center",
  },

  selectedRole: {
    backgroundColor: GREEN,
  },

  roleText: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK,
  },

  tinyLink: {
    fontSize: 12,
    fontWeight: "600",
    color: DARK,
    textAlign: "center",
    marginTop: 13,
    marginBottom: 7,
  },

  bioLink: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK,
    textAlign: "center",
    marginTop: 24,
  },

  blueText: {
    color: BLUE,
    fontWeight: "600",
  },

  orText: {
    fontSize: 11,
    color: "#58756B",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 10,
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },

  footerText: {
    fontSize: 12,
    color: "#637F72",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 15,
  },

  termsText: {
    fontSize: 11,
    color: "#58756B",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: DARK,
    marginBottom: 10,
  },

  explanation: {
    fontSize: 12,
    color: "#55796B",
    lineHeight: 19,
  },

  pinInput: {
    height: 60,
    backgroundColor: PALE,
    borderRadius: 30,
    color: DARK,
    fontSize: 25,
    letterSpacing: 8,
  },

  fingerprintCircle: {
    width: 155,
    height: 155,
    borderRadius: 80,
    backgroundColor: GREEN,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  successRoot: {
    flex: 1,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  successText: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 15,
  },

  successNote: {
    fontSize: 12,
    color: "white",
    textAlign: "center",
    marginBottom: 30,
  },

  onboardingRoot: {
    flex: 1,
    backgroundColor: GREEN,
  },

  onboardingUpper: {
    flex: 0.36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  onboardingTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: DARK,
    textAlign: "center",
    lineHeight: 35,
  },

  onboardingLower: {
    flex: 0.64,
    backgroundColor: LIGHT,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  onboardingIllustration: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  onboardingCircle: {
    width: 205,
    height: 205,
    borderRadius: 103,
    backgroundColor: PALE,
    alignItems: "center",
    justifyContent: "center",
  },

  onboardingCoin: {
    position: "absolute",
    right: 20,
    bottom: 25,
    backgroundColor: "white",
    borderRadius: 30,
    padding: 10,
  },

  onboardingSubtitle: {
    fontSize: 13,
    color: "#56766A",
    textAlign: "center",
    marginBottom: 18,
  },

  onboardingNext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },

  onboardingNextText: {
    color: DARK,
    fontSize: 18,
    fontWeight: "700",
  },

  onboardingDots: {
    flexDirection: "row",
    gap: 7,
    paddingBottom: 38,
    paddingTop: 5,
  },

  onboardingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GREEN,
  },

  onboardingDotActive: {
    backgroundColor: GREEN,
  },
});
