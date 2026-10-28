
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

import { addNotification } from "../utils/notificationService";

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";
const PALE = "#DDF6E5";
const BLUE = "#1683FF";

const categories = [
  "Food",
  "Transport",
  "Medicine",
  "Groceries",
  "Rent",
  "Gifts",
  "Savings",
  "Entertainment",
  "Salary",
  "Others",
];

const formatMoney = (amount) =>
  "₹" + Number(amount || 0).toLocaleString("en-IN");

export default function TransactionsScreen({ route }) {
  const session = route?.params?.session;
  const userName = session?.name || "User";
  const email = session?.email || "guest";

  const storageKey = `finwise_transactions_${email}`;

  const [transactions, setTransactions] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState("All");

  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType] = useState("Expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadTransactions();
    }
  }, [isFocused, storageKey]);

  const loadTransactions = async () => {
    try {
      const saved = await AsyncStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];

      setTransactions(
        Array.isArray(parsed) ? parsed : []
      );
    } catch (error) {
      Alert.alert("Error", "Unable to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction) => {
    const date = new Date(year, month + direction, 1);

    setMonth(date.getMonth());
    setYear(date.getFullYear());
  };

  const saveTransaction = async () => {
    if (saving) return;

    const numericAmount = Number(amount);

    if (!title.trim() || !amount.trim()) {
      Alert.alert("Validation", "Enter title and amount");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        "Validation",
        "Enter a valid positive amount"
      );
      return;
    }

    const newTransaction = {
      id:
        Date.now().toString() +
        Math.random().toString(36).slice(2, 7),
      title: title.trim(),
      amount: numericAmount,
      type: entryType,
      category:
        entryType === "Income" ? "Salary" : category,
      date: new Date().toISOString(),
    };

    setSaving(true);

    try {
      // Read latest saved data before updating
      const saved = await AsyncStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];

      const latestTransactions = Array.isArray(parsed)
        ? parsed
        : [];

      const updated = [
        newTransaction,
        ...latestTransactions,
      ];

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updated)
      );

      setTransactions(updated);
      setModalVisible(false);
      setTitle("");
      setAmount("");
      setCategory("Food");

      // Save personalized notification
      try {
        await addNotification({
          email,
          title:
            entryType === "Income"
              ? "Income Added"
              : "Expense Added",
          message:
            entryType === "Income"
              ? `Hi ${userName}! You received ${formatMoney(
                  numericAmount
                )} for "${newTransaction.title}".`
              : `Hi ${userName}! You spent ${formatMoney(
                  numericAmount
                )} on "${newTransaction.title}" (${newTransaction.category}).`,
          type:
            entryType === "Income"
              ? "income"
              : "expense",
        });
      } catch (notificationError) {
        console.log(
          "Notification save error:",
          notificationError
        );
      }

      Alert.alert(
        `Hi ${userName}!`,
        `${entryType} transaction "${newTransaction.title}" of ${formatMoney(
          numericAmount
        )} was added successfully.`
      );
    } catch (error) {
      console.log("Save transaction error:", error);

      Alert.alert(
        "Error",
        "Unable to save transaction"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = (item) => {
    Alert.alert(
      "Delete Transaction",
      `Delete "${item.title}"?`,
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
              const saved =
                await AsyncStorage.getItem(storageKey);

              const parsed = saved
                ? JSON.parse(saved)
                : [];

              const latestTransactions =
                Array.isArray(parsed) ? parsed : [];

              const updated = latestTransactions.filter(
                (transaction) =>
                  transaction.id !== item.id
              );

              await AsyncStorage.setItem(
                storageKey,
                JSON.stringify(updated)
              );

              setTransactions(updated);

              // Save delete notification
              try {
                await addNotification({
                  email,
                  title: "Transaction Deleted",
                  message: `Hi ${userName}! "${item.title}" (${formatMoney(
                    item.amount
                  )}) was removed from your transactions.`,
                  type: "delete",
                });
              } catch (notificationError) {
                console.log(
                  "Notification save error:",
                  notificationError
                );
              }

              Alert.alert(
                `Hi ${userName}!`,
                `"${item.title}" was removed from your transactions.`
              );
            } catch (error) {
              console.log(
                "Delete transaction error:",
                error
              );

              Alert.alert(
                "Error",
                "Unable to delete transaction"
              );
            }
          },
        },
      ]
    );
  };

  const filtered = transactions.filter((item) => {
    const date = new Date(item.date);

    return (
      date.getMonth() === month &&
      date.getFullYear() === year &&
      (type === "All" || item.type === type)
    );
  });

  const income = filtered
    .filter((item) => item.type === "Income")
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const expense = filtered
    .filter((item) => item.type === "Expense")
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const monthLabel = new Date(
    year,
    month,
    1
  ).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Transactions
          </Text>

          <Text style={styles.headerSubtitle}>
            Track your income and expenses
          </Text>

          <View style={styles.monthSelector}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
            >
              <Ionicons
                name="chevron-back-circle"
                size={30}
                color={DARK}
              />
            </TouchableOpacity>

            <Text style={styles.monthText}>
              {monthLabel}
            </Text>

            <TouchableOpacity
              onPress={() => changeMonth(1)}
            >
              <Ionicons
                name="chevron-forward-circle"
                size={30}
                color={DARK}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>
                Income
              </Text>

              <Text style={styles.summaryAmount}>
                {formatMoney(income)}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>
                Expense
              </Text>

              <Text style={styles.summaryAmount}>
                {formatMoney(expense)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.filterRow}>
            {["All", "Income", "Expense"].map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setType(item)}
                  style={[
                    styles.filterButton,
                    type === item &&
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

          <Text style={styles.sectionTitle}>
            {type === "All"
              ? "All Transactions"
              : type}
          </Text>

          {loading ? (
            <Text style={styles.emptyText}>
              Loading transactions...
            </Text>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={58}
                color="#9DBBB1"
              />

              <Text style={styles.emptyText}>
                No transactions found for {monthLabel}
              </Text>

              <Text style={styles.emptyHint}>
                Tap + to add your first transaction.
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
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

                  <Text
                    style={styles.transactionCategory}
                  >
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
                          ? "#009B78"
                          : BLUE,
                    },
                  ]}
                >
                  {item.type === "Income"
                    ? "+"
                    : "-"}
                  {formatMoney(item.amount)}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    deleteTransaction(item)
                  }
                  style={{ padding: 7 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={19}
                    color="#E45A65"
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ADD TRANSACTION BUTTON */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons
          name="add"
          size={30}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* ADD TRANSACTION MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Add Transaction
              </Text>

              <View style={styles.filterRow}>
                {["Expense", "Income"].map(
                  (item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() =>
                        setEntryType(item)
                      }
                      style={[
                        styles.filterButton,
                        entryType === item &&
                          styles.activeFilter,
                      ]}
                    >
                      <Text
                        style={styles.filterText}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Transaction title"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={styles.input}
                placeholder="Amount (₹)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />

              {entryType === "Expense" && (
                <>
                  <Text style={styles.fieldLabel}>
                    Select Category
                  </Text>

                  <View style={styles.categoryWrap}>
                    {categories
                      .filter(
                        (item) =>
                          item !== "Salary"
                      )
                      .map((item) => (
                        <TouchableOpacity
                          key={item}
                          onPress={() =>
                            setCategory(item)
                          }
                          style={[
                            styles.categoryChip,
                            category === item &&
                              styles.activeCategory,
                          ]}
                        >
                          <Text
                            style={styles.chipText}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.saveButton}
                disabled={saving}
                onPress={saveTransaction}
              >
                <Text style={styles.saveText}>
                  {saving
                    ? "Saving..."
                    : "Save Transaction"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT,
  },

  scrollContent: {
    paddingBottom: 95,
  },

  header: {
    backgroundColor: GREEN,
    padding: 22,
    paddingTop: 28,
    paddingBottom: 35,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
    textAlign: "center",
  },

  headerSubtitle: {
    fontSize: 12,
    color: DARK,
    textAlign: "center",
    marginTop: 7,
  },

  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 20,
  },

  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 17,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },

  summaryAmount: {
    fontSize: 17,
    fontWeight: "bold",
    color: DARK,
    marginTop: 7,
  },

  body: {
    marginTop: -20,
    padding: 20,
    backgroundColor: LIGHT,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: 350,
  },

  filterRow: {
    flexDirection: "row",
    backgroundColor: PALE,
    borderRadius: 25,
    padding: 5,
    marginBottom: 22,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 22,
  },

  activeFilter: {
    backgroundColor: GREEN,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: DARK,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 14,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 65,
  },

  emptyText: {
    fontSize: 14,
    color: DARK,
    textAlign: "center",
    marginTop: 15,
  },

  emptyHint: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
  },

  transaction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DCEDE2",
    gap: 10,
  },

  transactionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: BLUE,
    justifyContent: "center",
    alignItems: "center",
  },

  transactionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
  },

  transactionCategory: {
    fontSize: 11,
    color: "#777",
    marginTop: 5,
  },

  transactionAmount: {
    fontSize: 13,
    fontWeight: "bold",
  },

  floatingButton: {
    position: "absolute",
    bottom: 22,
    right: 22,
    width: 58,
    height: 58,
    backgroundColor: GREEN,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    backgroundColor: LIGHT,
    borderRadius: 25,
    padding: 22,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 22,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D9EDE1",
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 12,
  },

  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  categoryChip: {
    backgroundColor: PALE,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  activeCategory: {
    backgroundColor: GREEN,
  },

  chipText: {
    fontSize: 12,
    color: DARK,
  },

  saveButton: {
    backgroundColor: GREEN,
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
  },

  saveText: {
    fontWeight: "bold",
    color: DARK,
  },

  cancelText: {
    textAlign: "center",
    color: "#E45A65",
    marginTop: 18,
    fontWeight: "bold",
  },
});
