
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";
const PALE = "#DDF6E5";
const BLUE = "#1683FF";

const screenWidth = Dimensions.get("window").width;

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN");

function getReportData(transactions, period) {
  const now = new Date();
  const labels = [];
  const ranges = [];

  if (period === "Daily") {
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    for (let i = 6; i >= 0; i--) {
      const from = new Date(today);
      from.setDate(today.getDate() - i);

      const to = new Date(from);
      to.setDate(from.getDate() + 1);

      labels.push(
        from.toLocaleDateString("en-US", {
          weekday: "short",
        })
      );

      ranges.push([from, to]);
    }
  } else if (period === "Weekly") {
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const monday = new Date(today);
    monday.setDate(
      today.getDate() - ((today.getDay() + 6) % 7)
    );

    for (let i = 3; i >= 0; i--) {
      const from = new Date(monday);
      from.setDate(monday.getDate() - i * 7);

      const to = new Date(from);
      to.setDate(from.getDate() + 7);

      labels.push(
        from.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
        })
      );

      ranges.push([from, to]);
    }
  } else if (period === "Monthly") {
    for (let i = 5; i >= 0; i--) {
      const from = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const to = new Date(
        from.getFullYear(),
        from.getMonth() + 1,
        1
      );

      labels.push(
        from.toLocaleDateString("en-US", {
          month: "short",
        })
      );

      ranges.push([from, to]);
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const from = new Date(
        now.getFullYear() - i,
        0,
        1
      );

      const to = new Date(
        from.getFullYear() + 1,
        0,
        1
      );

      labels.push(String(from.getFullYear()));
      ranges.push([from, to]);
    }
  }

  const calculate = (type) =>
    ranges.map(([from, to]) =>
      transactions
        .filter((item) => {
          const date = new Date(item.date);

          return (
            item.type === type &&
            date >= from &&
            date < to
          );
        })
        .reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0
        )
    );

  return {
    labels,
    income: calculate("Income"),
    expense: calculate("Expense"),
  };
}

function FinanceChart({ data }) {
  const width = Math.max(260, screenWidth - 85);
  const height = 190;
  const chartHeight = 135;
  const left = 12;
  const bottom = 155;

  const maximum = Math.max(
    ...data.income,
    ...data.expense,
    1
  );

  const groupWidth =
    (width - 25) / data.labels.length;

  const barWidth = Math.min(
    13,
    groupWidth * 0.25
  );

  return (
    <Svg width={width} height={height}>
      {[0, 1, 2, 3, 4].map((index) => {
        const y =
          bottom -
          (index / 4) * chartHeight;

        return (
          <Line
            key={index}
            x1={left}
            y1={y}
            x2={width}
            y2={y}
            stroke="#C8E8D5"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        );
      })}

      {data.labels.map((label, index) => {
        const center =
          left + groupWidth * (index + 0.5);

        const incomeHeight =
          (data.income[index] / maximum) *
          chartHeight;

        const expenseHeight =
          (data.expense[index] / maximum) *
          chartHeight;

        return (
          <React.Fragment key={`${label}-${index}`}>
            <Rect
              x={center - barWidth - 2}
              y={bottom - incomeHeight}
              width={barWidth}
              height={incomeHeight}
              fill={GREEN}
              rx={2}
            />

            <Rect
              x={center + 2}
              y={bottom - expenseHeight}
              width={barWidth}
              height={expenseHeight}
              fill={BLUE}
              rx={2}
            />

            <SvgText
              x={center}
              y={bottom + 17}
              fontSize={9}
              fill={DARK}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function AnalysisScreen({ route }) {
  const [period, setPeriod] = useState("Monthly");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const session = route?.params?.session;
  const email = session?.email || "guest";
  const isAdmin = session?.role === "Admin";

  const storageKey =
    `finwise_transactions_${email}`;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadTransactions = async () => {
        try {
          const saved =
            await AsyncStorage.getItem(storageKey);

          const parsed = saved
            ? JSON.parse(saved)
            : [];

          if (active) {
            setTransactions(
              Array.isArray(parsed) ? parsed : []
            );
          }
        } catch (error) {
          console.log(
            "Analysis load error:",
            error
          );

          if (active) {
            setTransactions([]);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      loadTransactions();

      return () => {
        active = false;
      };
    }, [storageKey])
  );

  const data = getReportData(
    transactions,
    period
  );

  const totalIncome = data.income.reduce(
    (sum, amount) => sum + amount,
    0
  );

  const totalExpense = data.expense.reduce(
    (sum, amount) => sum + amount,
    0
  );

  const netBalance =
    totalIncome - totalExpense;

  const spentPercent =
    totalIncome > 0
      ? (totalExpense / totalIncome) * 100
      : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Analysis
        </Text>

        <Text style={styles.roleText}>
          {isAdmin
            ? "Admin Overview"
            : "My Financial Analysis"}
        </Text>

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>
              Net Balance
            </Text>

            <Text style={styles.balanceAmount}>
              {money(netBalance)}
            </Text>
          </View>

          <View>
            <Text style={styles.balanceLabel}>
              Total Expense
            </Text>

            <Text style={styles.balanceAmount}>
              {money(totalExpense)}
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  Math.min(
                    100,
                    spentPercent
                  )
                }%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {totalIncome > 0
            ? `${Math.round(
                spentPercent
              )}% of income spent`
            : "Add income to track spending"}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.filterRow}>
          {[
            "Daily",
            "Weekly",
            "Monthly",
            "Yearly",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() =>
                setPeriod(item)
              }
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
          ))}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>
              Income & Expenses
            </Text>

            <Ionicons
              name="stats-chart"
              size={21}
              color={GREEN}
            />
          </View>

          <Text style={styles.chartSubtitle}>
            {period} financial overview
          </Text>

          {loading ? (
            <Text style={styles.emptyText}>
              Loading transactions...
            </Text>
          ) : (
            <FinanceChart data={data} />
          )}

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: GREEN,
                  },
                ]}
              />

              <Text style={styles.legendText}>
                Income
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: BLUE,
                  },
                ]}
              />

              <Text style={styles.legendText}>
                Expense
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons
              name="trending-up-outline"
              size={24}
              color={GREEN}
            />

            <Text style={styles.summaryLabel}>
              Income
            </Text>

            <Text style={styles.incomeText}>
              {money(totalIncome)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons
              name="trending-down-outline"
              size={24}
              color={BLUE}
            />

            <Text style={styles.summaryLabel}>
              Expenses
            </Text>

            <Text style={styles.expenseText}>
              {money(totalExpense)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Savings Overview
        </Text>

        <View style={styles.targetCard}>
          <Text style={styles.targetTitle}>
            Estimated Savings
          </Text>

          <Text style={styles.targetAmount}>
            {money(
              Math.max(0, netBalance)
            )}
          </Text>

          <Text style={styles.targetSubtitle}>
            Based on the selected{" "}
            {period.toLowerCase()} report
          </Text>
        </View>

        <Text style={styles.note}>
          Reports are calculated from your
          saved income and expense
          transactions.
        </Text>
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
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 35,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: DARK,
    textAlign: "center",
  },

  roleText: {
    fontSize: 12,
    color: DARK,
    textAlign: "center",
    marginTop: 7,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },

  balanceLabel: {
    fontSize: 11,
    color: DARK,
  },

  balanceAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 5,
  },

  progressTrack: {
    backgroundColor: "#FFFFFF",
    height: 11,
    borderRadius: 20,
    marginTop: 22,
    overflow: "hidden",
  },

  progressFill: {
    backgroundColor: DARK,
    height: "100%",
    borderRadius: 20,
  },

  progressText: {
    fontSize: 11,
    color: DARK,
    marginTop: 9,
  },

  body: {
    backgroundColor: LIGHT,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginTop: -20,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 35,
  },

  filterRow: {
    flexDirection: "row",
    backgroundColor: PALE,
    borderRadius: 25,
    padding: 5,
    justifyContent: "space-between",
    marginBottom: 22,
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
    fontSize: 11,
    fontWeight: "600",
    color: DARK,
  },

  chartCard: {
    backgroundColor: PALE,
    borderRadius: 25,
    padding: 15,
    marginBottom: 20,
    overflow: "hidden",
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 8,
  },

  chartSubtitle: {
    fontSize: 11,
    color: "#66867A",
    marginBottom: 12,
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 22,
    marginTop: 4,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendText: {
    fontSize: 11,
    color: DARK,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 25,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 10,
  },

  incomeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#009C78",
    marginTop: 6,
  },

  expenseText: {
    fontSize: 16,
    fontWeight: "bold",
    color: BLUE,
    marginTop: 6,
  },

  targetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
  },

  targetTitle: {
    fontSize: 14,
    color: DARK,
    fontWeight: "bold",
  },

  targetAmount: {
    fontSize: 23,
    color: GREEN,
    fontWeight: "bold",
    marginTop: 10,
  },

  targetSubtitle: {
    fontSize: 11,
    color: "#777",
    marginTop: 8,
  },

  note: {
    fontSize: 11,
    color: "#777",
    textAlign: "center",
    marginTop: 18,
  },

  emptyText: {
    fontSize: 13,
    color: DARK,
    textAlign: "center",
    paddingVertical: 35,
  },
});
