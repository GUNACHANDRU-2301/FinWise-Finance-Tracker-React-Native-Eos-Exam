
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";
const PALE = "#DDF6E5";

const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

const startOfDay = (date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

function inPeriod(dateString, period) {
  const date = new Date(dateString);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return false;

  if (period === "Daily") {
    return (
      startOfDay(date).getTime() ===
      startOfDay(now).getTime()
    );
  }

  if (period === "Weekly") {
    const today = startOfDay(now);
    const day = (today.getDay() + 6) % 7;

    const monday = new Date(today);
    monday.setDate(today.getDate() - day);

    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    return date >= monday && date < nextMonday;
  }

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default function HomeScreen({ route }) {
  const session = route?.params?.session;

  const name =
    session?.name || route?.params?.name || "User";

  const email = session?.email || "guest";

  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState("Monthly");

  const loadData = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(
        `finwise_transactions_${email}`
      );

      const parsed = saved ? JSON.parse(saved) : [];

      setTransactions(
        Array.isArray(parsed) ? parsed : []
      );
    } catch (error) {
      console.log("Home load error:", error);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const sum = (items, type) =>
    items
      .filter((item) => item.type === type)
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

  const totalIncome = sum(transactions, "Income");
  const totalExpense = sum(transactions, "Expense");
  const balance = totalIncome - totalExpense;

  const reportTransactions = transactions.filter(
    (item) => inPeriod(item.date, period)
  );

  const reportIncome = sum(
    reportTransactions,
    "Income"
  );

  const reportExpense = sum(
    reportTransactions,
    "Expense"
  );

  const reportBalance = reportIncome - reportExpense;

  const recent = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    )
    .slice(0, 5);

  const spentPercent =
    totalIncome > 0
      ? Math.min(
          100,
          (totalExpense / totalIncome) * 100
        )
      : 0;

  return (
    <ScrollView style={styles.container}>
      {/* WELCOME HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcome}>
              Hi, Welcome Back
            </Text>

            <Text style={styles.name}>
              {name}
            </Text>
          </View>
        </View>

        {/* BALANCE CARD */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            Total Balance
          </Text>

          <Text style={styles.balance}>
            {money(balance)}
          </Text>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>
                Total Income
              </Text>

              <Text style={styles.summaryAmount}>
                {money(totalIncome)}
              </Text>
            </View>

            <View>
              <Text style={styles.summaryLabel}>
                Total Expense
              </Text>

              <Text style={styles.summaryAmount}>
                {money(totalExpense)}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${spentPercent}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {Math.round(spentPercent)}% of income spent
          </Text>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>
          Financial Report
        </Text>

        {/* DAILY / WEEKLY / MONTHLY */}
        <View style={styles.filterRow}>
          {["Daily", "Weekly", "Monthly"].map(
            (item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setPeriod(item)}
                style={[
                  styles.filterButton,
                  period === item &&
                    styles.activeFilter,
                ]}
              >
                <Text style={styles.filterText}>
                  {item}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* REPORT CARD */}
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>
            {period} Report
          </Text>

          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>
              Income
            </Text>

            <Text style={styles.income}>
              +{money(reportIncome)}
            </Text>
          </View>

          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>
              Expense
            </Text>

            <Text style={styles.expense}>
              -{money(reportExpense)}
            </Text>
          </View>

          <View style={styles.reportDivider} />

          <View style={styles.reportRow}>
            <Text style={styles.reportBalanceLabel}>
              Net Amount
            </Text>

            <Text style={styles.netAmount}>
              {money(reportBalance)}
            </Text>
          </View>
        </View>

        {/* RECENT TRANSACTIONS */}
        <Text style={styles.sectionTitle}>
          Recent Transactions
        </Text>

        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="receipt-outline"
              size={40}
              color="#9ABAAF"
            />

            <Text style={styles.emptyText}>
              No transactions yet. Add your first
              income or expense.
            </Text>
          </View>
        ) : (
          recent.map((item) => (
            <View
              key={item.id}
              style={styles.transaction}
            >
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={
                    item.type === "Income"
                      ? "arrow-down-outline"
                      : "arrow-up-outline"
                  }
                  size={22}
                  color="#FFFFFF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.transactionTitle}>
                  {item.title}
                </Text>

                <Text style={styles.transactionDate}>
                  {item.category} •{" "}
                  {new Date(
                    item.date
                  ).toLocaleDateString("en-IN")}
                </Text>
              </View>

              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color:
                      item.type === "Income"
                        ? "#009C78"
                        : "#1683FF",
                  },
                ]}
              >
                {item.type === "Income"
                  ? "+"
                  : "-"}
                {money(item.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },

  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 45,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  welcomeContainer: {
    flex: 1,
    paddingRight: 12,
  },

  welcome: {
    color: DARK,
    fontSize: 13,
  },

  name: {
    color: DARK,
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 5,
  },

  // BALANCE CARD
  balanceCard: {
    backgroundColor: DARK,
    borderRadius: 24,
    padding: 20,
    marginTop: 22,
  },

  balanceLabel: {
    color: "#BFECE0",
    fontSize: 13,
  },

  balance: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "bold",
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: "#41736E",
    marginVertical: 18,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryLabel: {
    color: "#BFECE0",
    fontSize: 11,
  },

  summaryAmount: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
  },

  progressTrack: {
    height: 9,
    backgroundColor: "#44736F",
    borderRadius: 10,
    marginTop: 22,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: GREEN,
    borderRadius: 10,
  },

  progressText: {
    color: "#BFECE0",
    fontSize: 11,
    marginTop: 9,
  },

  // MAIN BODY
  body: {
    backgroundColor: LIGHT,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    padding: 20,
    paddingBottom: 45,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 17,
    marginTop: 8,
  },

  filterRow: {
    flexDirection: "row",
    backgroundColor: PALE,
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },

  filterButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 20,
  },

  activeFilter: {
    backgroundColor: GREEN,
  },

  filterText: {
    color: DARK,
    fontSize: 12,
    fontWeight: "600",
  },

  // REPORT CARD
  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 27,
  },

  reportTitle: {
    color: DARK,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 18,
  },

  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  reportLabel: {
    color: "#777",
    fontSize: 13,
  },

  income: {
    color: "#009C78",
    fontWeight: "bold",
    fontSize: 15,
  },

  expense: {
    color: "#1683FF",
    fontWeight: "bold",
    fontSize: 15,
  },

  reportDivider: {
    height: 1,
    backgroundColor: "#E4EEE8",
    marginBottom: 15,
  },

  reportBalanceLabel: {
    color: DARK,
    fontWeight: "bold",
  },

  netAmount: {
    color: DARK,
    fontSize: 17,
    fontWeight: "bold",
  },

  // RECENT TRANSACTIONS
  transaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#DDEDE3",
  },

  transactionIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#1683FF",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  transactionTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: "bold",
  },

  transactionDate: {
    color: "#777",
    fontSize: 11,
    marginTop: 5,
  },

  transactionAmount: {
    fontSize: 13,
    fontWeight: "bold",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  emptyText: {
    color: "#777",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
