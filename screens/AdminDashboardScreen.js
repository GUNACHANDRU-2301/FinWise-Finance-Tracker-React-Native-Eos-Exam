
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";

const formatMoney = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

async function getAdminData() {
  const rawAccounts = await AsyncStorage.getItem(
    "finwise_accounts"
  );

  const accounts = rawAccounts ? JSON.parse(rawAccounts) : [];

  const customers = accounts.filter(
    (account) =>
      String(account.role || "Customer").toLowerCase() ===
      "customer"
  );

  const uniqueEmails = [
    ...new Set(
      customers
        .map((customer) => customer.email?.toLowerCase())
        .filter(Boolean)
    ),
  ];

  const storedTransactions = await Promise.all(
    uniqueEmails.map(async (email) => {
      const saved = await AsyncStorage.getItem(
        `finwise_transactions_${email}`
      );
      return saved ? JSON.parse(saved) : [];
    })
  );

  const transactions = storedTransactions.flat();

  const totalIncome = transactions
    .filter((item) => item.type === "Income")
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const totalExpenses = transactions
    .filter((item) => item.type === "Expense")
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  return {
    customers: uniqueEmails.length,
    transactions: transactions.length,
    totalIncome,
    totalExpenses,
  };
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={24}
          color={color || DARK}
        />
      </View>

      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({
  navigation,
  route,
}) {
  const [data, setData] = useState({
    customers: 0,
    transactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await getAdminData();
      setData(result);
    } catch (error) {
      console.log("Admin dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>
            Welcome, Administrator
          </Text>
          <Text style={styles.title}>
            Admin Dashboard
          </Text>
          <Text style={styles.subtitle}>
            FinWise financial overview
          </Text>
        </View>

        <Ionicons
          name="shield-checkmark"
          size={37}
          color={DARK}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={GREEN}
          style={{ marginTop: 40 }}
        />
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard
              icon="people-outline"
              label="Total Customers"
              value={data.customers}
            />

            <StatCard
              icon="trending-down-outline"
              label="Total Expenses"
              value={formatMoney(data.totalExpenses)}
              color="#E65A5A"
            />

            <StatCard
              icon="trending-up-outline"
              label="Total Income"
              value={formatMoney(data.totalIncome)}
              color="#00A982"
            />

            <StatCard
              icon="receipt-outline"
              label="Transactions"
              value={data.transactions}
            />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Overall Balance
            </Text>

            <Text style={styles.balance}>
              {formatMoney(
                data.totalIncome - data.totalExpenses
              )}
            </Text>

            <Text style={styles.summarySubtitle}>
              Combined balance of all customers
            </Text>
          </View>

          <TouchableOpacity
            style={styles.analysisButton}
            onPress={() =>
              navigation.navigate("Analysis")
            }
          >
            <Ionicons
              name="pie-chart-outline"
              size={23}
              color={DARK}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.analysisTitle}>
                Category-wise Analysis
              </Text>

              <Text style={styles.analysisSubtitle}>
                View all customer expenses by category
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color={DARK}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color={DARK}
            />
            <Text style={styles.refreshText}>
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: GREEN,
    padding: 24,
    paddingVertical: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcome: {
    fontSize: 13,
    color: DARK,
    marginBottom: 7,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: DARK,
  },
  subtitle: {
    fontSize: 12,
    color: DARK,
    marginTop: 7,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 19,
    marginBottom: 15,
    minHeight: 145,
  },
  iconBox: {
    backgroundColor: "#DDF6E5",
    width: 43,
    height: 43,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#72877D",
    marginTop: 13,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK,
    marginTop: 7,
  },
  summaryCard: {
    backgroundColor: DARK,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 18,
    marginTop: 8,
  },
  summaryTitle: {
    color: "#B6E4D6",
    fontSize: 14,
  },
  balance: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "bold",
    marginTop: 12,
  },
  summarySubtitle: {
    color: "#B6E4D6",
    fontSize: 12,
    marginTop: 9,
  },
  analysisButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    gap: 13,
  },
  analysisTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: DARK,
  },
  analysisSubtitle: {
    fontSize: 11,
    color: "#789287",
    marginTop: 6,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: 15,
    marginTop: 14,
  },
  refreshText: {
    color: DARK,
    fontWeight: "600",
  },
});
