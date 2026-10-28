
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";

const COLORS = [
  "#00C99A",
  "#1683FF",
  "#F4A340",
  "#A78BFA",
  "#EF6C80",
  "#38BDB2",
  "#8DBA53",
  "#64748B",
  "#C47EBE",
];

const formatMoney = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

export default function AdminAnalysisScreen() {
  const [categories, setCategories] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAnalysis = useCallback(async () => {
    try {
      const savedAccounts = await AsyncStorage.getItem(
        "finwise_accounts"
      );

      const accounts = savedAccounts
        ? JSON.parse(savedAccounts)
        : [];

      const emails = [
        ...new Set(
          accounts
            .filter(
              (user) =>
                String(
                  user.role || "Customer"
                ).toLowerCase() === "customer"
            )
            .map((user) => user.email?.toLowerCase())
            .filter(Boolean)
        ),
      ];

      const allTransactionGroups = await Promise.all(
        emails.map(async (email) => {
          const saved = await AsyncStorage.getItem(
            `finwise_transactions_${email}`
          );
          return saved ? JSON.parse(saved) : [];
        })
      );

      const allTransactions = allTransactionGroups.flat();

      const expenses = allTransactions.filter(
        (item) => item.type === "Expense"
      );

      const grouped = {};

      expenses.forEach((item) => {
        const category = String(
          item.category || "Others"
        ).trim() || "Others";

        grouped[category] =
          (grouped[category] || 0) +
          Number(item.amount || 0);
      });

      const total = Object.values(grouped).reduce(
        (sum, amount) => sum + amount,
        0
      );

      const sortedCategories = Object.entries(grouped)
        .map(([name, amount], index) => ({
          name,
          amount,
          percentage:
            total > 0 ? (amount / total) * 100 : 0,
          color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount)
        .map((item, index) => ({
          ...item,
          color: COLORS[index % COLORS.length],
        }));

      setCategories(sortedCategories);
      setTotalExpenses(total);
    } catch (error) {
      console.log("Admin analysis error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAnalysis();
    }, [loadAnalysis])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>
          Category Analysis
        </Text>

        <Text style={styles.subtitle}>
          Expenses from all customers
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={GREEN}
          style={{ marginTop: 40 }}
        />
      ) : (
        <>
          <View style={styles.totalCard}>
            <Ionicons
              name="pie-chart"
              size={32}
              color={GREEN}
            />

            <Text style={styles.totalLabel}>
              Total Customer Expenses
            </Text>

            <Text style={styles.totalAmount}>
              {formatMoney(totalExpenses)}
            </Text>

            <Text style={styles.totalSubtext}>
              All-time category-wise spending
            </Text>
          </View>

          {categories.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="bar-chart-outline"
                size={52}
                color={GREEN}
              />

              <Text style={styles.emptyTitle}>
                No expense data yet
              </Text>

              <Text style={styles.emptyText}>
                Customer expenses will appear here
                after transactions are added.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.chartCard}>
                <Text style={styles.sectionTitle}>
                  Spending Distribution
                </Text>

                <View style={styles.stackedBar}>
                  {categories.map((item) => (
                    <View
                      key={item.name}
                      style={{
                        flex: item.amount,
                        backgroundColor: item.color,
                      }}
                    />
                  ))}
                </View>

                <Text style={styles.chartHint}>
                  Percentage of total expenses
                </Text>
              </View>

              <Text style={styles.sectionTitleOutside}>
                Category Breakdown
              </Text>

              {categories.map((item) => (
                <View
                  key={item.name}
                  style={styles.categoryCard}
                >
                  <View style={styles.categoryTop}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryDot,
                          {
                            backgroundColor: item.color,
                          },
                        ]}
                      />

                      <Text style={styles.categoryName}>
                        {item.name}
                      </Text>
                    </View>

                    <Text style={styles.categoryAmount}>
                      {formatMoney(item.amount)}
                    </Text>
                  </View>

                  <View style={styles.progressBackground}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.percentage}>
                    {item.percentage.toFixed(1)}%
                    of total expenses
                  </Text>
                </View>
              ))}
            </>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setLoading(true);
              loadAnalysis();
            }}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color={DARK}
            />

            <Text style={styles.refreshText}>
              Refresh Analysis
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
    padding: 25,
    paddingVertical: 32,
  },
  heading: {
    fontSize: 25,
    fontWeight: "bold",
    color: DARK,
  },
  subtitle: {
    color: DARK,
    fontSize: 13,
    marginTop: 8,
  },
  totalCard: {
    backgroundColor: DARK,
    borderRadius: 22,
    margin: 18,
    padding: 25,
    alignItems: "center",
  },
  totalLabel: {
    color: "#B9E4D6",
    fontSize: 14,
    marginTop: 12,
  },
  totalAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 12,
  },
  totalSubtext: {
    color: "#B9E4D6",
    fontSize: 11,
    marginTop: 10,
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    padding: 20,
    borderRadius: 20,
    marginBottom: 23,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 20,
  },
  stackedBar: {
    flexDirection: "row",
    height: 25,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E4EDE8",
  },
  chartHint: {
    textAlign: "center",
    color: "#82958C",
    fontSize: 12,
    marginTop: 15,
  },
  sectionTitleOutside: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginHorizontal: 20,
    marginBottom: 13,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 13,
  },
  categoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: DARK,
  },
  progressBackground: {
    height: 9,
    borderRadius: 10,
    backgroundColor: "#E9F1EC",
    overflow: "hidden",
    marginTop: 18,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  percentage: {
    fontSize: 11,
    color: "#789287",
    marginTop: 9,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    margin: 18,
    padding: 35,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: DARK,
    marginTop: 15,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 12,
    color: "#789287",
    marginTop: 10,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
    padding: 15,
  },
  refreshText: {
    color: DARK,
    fontWeight: "bold",
  },
});
