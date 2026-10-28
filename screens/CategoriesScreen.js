
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { addNotification } from "../utils/notificationService";

const GREEN = "#00C99A";
const DARK = "#073F3D";
const LIGHT = "#F0FFF2";
const PALE = "#DDF6E5";
const BLUE = "#1683FF";

const CATEGORIES = [
  { name: "Food", icon: "fast-food-outline" },
  { name: "Transport", icon: "car-outline" },
  { name: "Medicine", icon: "medkit-outline" },
  { name: "Groceries", icon: "basket-outline" },
  { name: "Rent", icon: "home-outline" },
  { name: "Gifts", icon: "gift-outline" },
  { name: "Savings", icon: "wallet-outline" },
  { name: "Entertainment", icon: "game-controller-outline" },
  { name: "Others", icon: "ellipsis-horizontal-circle-outline" },
];

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN");

export default function CategoriesScreen({ route }) {
  const session = route?.params?.session;
  const email = session?.email || "guest";
  const userName = session?.name || "User";
  const storageKey = `finwise_transactions_${email}`;

  const [transactions, setTransactions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];

      setTransactions(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.log("Categories load error:", error);
      Alert.alert("Error", "Unable to load categories");
    }
  }, [storageKey]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const expenses = transactions.filter(
    (item) => item.type === "Expense"
  );

  const getCategoryTransactions = (name) =>
    expenses.filter((item) => item.category === name);

  const getCategoryTotal = (name) =>
    getCategoryTransactions(name).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const totalExpense = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const saveExpense = async () => {
    if (saving) return;

    const numericAmount = Number(amount);

    if (!selectedCategory) {
      Alert.alert("Error", "Select a category first");
      return;
    }

    if (!title.trim() || !amount.trim()) {
      Alert.alert("Validation", "Enter title and amount");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
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
      type: "Expense",
      category: selectedCategory,
      message: message.trim(),
      date: new Date().toISOString(),
    };

    setSaving(true);

    try {
      const saved = await AsyncStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];

      const latestTransactions = Array.isArray(parsed)
        ? parsed
        : [];

      const updated = [newTransaction, ...latestTransactions];

      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(updated)
      );

      setTransactions(updated);
      setModalVisible(false);
      setTitle("");
      setAmount("");
      setMessage("");

      try {
        await addNotification({
          email,
          title: "Expense Added",
          message: `Hi ${userName}! You spent ${money(
            numericAmount
          )} on "${newTransaction.title}" (${selectedCategory}).`,
          type: "expense",
        });
      } catch (notificationError) {
        console.log(
          "Notification save error:",
          notificationError
        );
      }

      Alert.alert(
        `Hi ${userName}!`,
        `${money(numericAmount)} added to ${selectedCategory} expenses.`
      );
    } catch (error) {
      console.log("Save expense error:", error);
      Alert.alert("Error", "Unable to save expense");
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = (item) => {
    Alert.alert(
      "Delete Expense",
      `Remove "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const saved = await AsyncStorage.getItem(storageKey);
              const parsed = saved ? JSON.parse(saved) : [];

              const latestTransactions = Array.isArray(parsed)
                ? parsed
                : [];

              const updated = latestTransactions.filter(
                (transaction) => transaction.id !== item.id
              );

              await AsyncStorage.setItem(
                storageKey,
                JSON.stringify(updated)
              );

              setTransactions(updated);

              try {
                await addNotification({
                  email,
                  title: "Expense Deleted",
                  message: `Hi ${userName}! "${item.title}" (${money(
                    item.amount
                  )}) was removed from ${item.category} expenses.`,
                  type: "delete",
                });
              } catch (notificationError) {
                console.log(
                  "Notification save error:",
                  notificationError
                );
              }

              Alert.alert(
                "Expense Deleted",
                `"${item.title}" has been removed.`
              );
            } catch (error) {
              console.log("Delete expense error:", error);
              Alert.alert("Error", "Unable to delete expense");
            }
          },
        },
      ]
    );
  };

  if (selectedCategory) {
    const categoryInfo = CATEGORIES.find(
      (item) => item.name === selectedCategory
    );

    const categoryTransactions =
      getCategoryTransactions(selectedCategory);

    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedCategory(null)}
            >
              <Ionicons
                name="arrow-back"
                size={25}
                color={DARK}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {selectedCategory}
            </Text>

            <Text style={styles.headerSubtitle}>
              Category Details
            </Text>

            <View style={styles.detailIcon}>
              <Ionicons
                name={categoryInfo?.icon || "wallet-outline"}
                size={42}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.totalLabel}>
              Total Expenses
            </Text>

            <Text style={styles.totalAmount}>
              {money(getCategoryTotal(selectedCategory))}
            </Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.sectionTitle}>
              Expense History
            </Text>

            {categoryTransactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="receipt-outline"
                  size={55}
                  color="#9DBBB1"
                />

                <Text style={styles.emptyText}>
                  No expenses in {selectedCategory}
                </Text>
              </View>
            ) : (
              categoryTransactions.map((item) => (
                <View
                  key={item.id}
                  style={styles.transaction}
                >
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={
                        categoryInfo?.icon || "wallet-outline"
                      }
                      size={23}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.transactionTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.transactionDate}>
                      {new Date(item.date).toLocaleDateString(
                        "en-IN"
                      )}
                    </Text>

                    {!!item.message && (
                      <Text style={styles.transactionDate}>
                        {item.message}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.transactionAmount}>
                    -{money(item.amount)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => deleteExpense(item)}
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

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  Add {selectedCategory} Expense
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Expense title"
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

                <TextInput
                  style={[
                    styles.input,
                    {
                      height: 85,
                      textAlignVertical: "top",
                    },
                  ]}
                  placeholder="Message (optional)"
                  multiline
                  value={message}
                  onChangeText={setMessage}
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  disabled={saving}
                  onPress={saveExpense}
                >
                  <Text style={styles.saveText}>
                    {saving ? "Saving..." : "Save Expense"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Categories
        </Text>

        <Text style={styles.headerSubtitle}>
          Manage your spending by category
        </Text>

        <Text style={styles.totalLabel}>
          Overall Expenses
        </Text>

        <Text style={styles.totalAmount}>
          {money(totalExpense)}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>
          Overall Categories
        </Text>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.categoryCard}
              onPress={() =>
                setSelectedCategory(item.name)
              }
            >
              <View style={styles.categoryIcon}>
                <Ionicons
                  name={item.icon}
                  size={29}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.categoryName}>
                {item.name}
              </Text>

              <Text style={styles.categoryAmount}>
                {money(getCategoryTotal(item.name))}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Ionicons
            name="bulb-outline"
            size={24}
            color={DARK}
          />

          <Text style={styles.tipText}>
            Select a category to view its expenses and add
            new entries.
          </Text>
        </View>
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
    paddingBottom: 38,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: DARK,
  },

  headerSubtitle: {
    fontSize: 12,
    color: DARK,
    marginTop: 7,
  },

  totalLabel: {
    fontSize: 13,
    color: DARK,
    marginTop: 25,
  },

  totalAmount: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 7,
  },

  body: {
    backgroundColor: LIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    padding: 20,
    paddingBottom: 45,
    minHeight: 450,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 22,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
  },

  categoryCard: {
    width: "31%",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 17,
    paddingHorizontal: 3,
    minHeight: 135,
  },

  categoryIcon: {
    width: 58,
    height: 58,
    backgroundColor: BLUE,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  categoryName: {
    fontSize: 12,
    fontWeight: "bold",
    color: DARK,
    textAlign: "center",
  },

  categoryAmount: {
    fontSize: 11,
    color: "#777",
    marginTop: 5,
  },

  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: PALE,
    borderRadius: 20,
    padding: 18,
    marginTop: 30,
  },

  tipText: {
    flex: 1,
    fontSize: 12,
    color: DARK,
    lineHeight: 19,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 5,
  },

  detailIcon: {
    width: 80,
    height: 80,
    backgroundColor: BLUE,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 70,
  },

  emptyText: {
    fontSize: 14,
    color: "#777",
    marginTop: 15,
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
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },

  transactionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
  },

  transactionDate: {
    fontSize: 11,
    color: "#777",
    marginTop: 5,
  },

  transactionAmount: {
    fontSize: 13,
    fontWeight: "bold",
    color: BLUE,
  },

  floatingButton: {
    position: "absolute",
    bottom: 22,
    right: 22,
    width: 58,
    height: 58,
    backgroundColor: GREEN,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 21,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 22,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#FFFFFF",
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D9EDE1",
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
