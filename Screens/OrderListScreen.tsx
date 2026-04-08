import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { cartService } from "@/utils/services/cartService";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  order_number: string;
  merchant_name: string;
  total_amount: string;
  status: string;
  created_at: string;
  items: Array<any>;
  order_group_number?: string;
}

interface Filters {
  date_from: string;
  date_to: string;
  min_amount: string;
  max_amount: string;
}

const EMPTY_FILTERS: Filters = { date_from: "", date_to: "", min_amount: "", max_amount: "" };

const TABS = [
  { key: "all",       label: "All" },
  { key: "NEW",       label: "New" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Done" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  NEW: "#2196F3",
  CONTACTED: "#FF9800",
  CONFIRMED: "#4CAF50",
  COMPLETED: "#8BC34A",
  CANCELLED: "#F44336",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function filtersActive(filters: Filters) {
  return !!(filters.date_from || filters.date_to || filters.min_amount || filters.max_amount);
}

function filterCount(filters: Filters) {
  return [filters.date_from, filters.date_to, filters.min_amount, filters.max_amount].filter(Boolean).length;
}

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

interface FilterSheetProps {
  visible: boolean;
  filters: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
  colors: any;
}

function FilterSheet({ visible, filters, onApply, onClose, colors }: FilterSheetProps) {
  const [draft, setDraft] = useState<Filters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const field = (label: string, key: keyof Filters, placeholder: string, keyboard: any = "default") => (
    <View style={fs.field}>
      <Text style={[fs.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[fs.input, { backgroundColor: colors.backgroundSecondary, color: colors.textPrimary, borderColor: colors.border }]}
        value={draft[key]}
        onChangeText={(v) => setDraft((p) => ({ ...p, [key]: v }))}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboard}
        autoCorrect={false}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={fs.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[fs.sheet, { backgroundColor: colors.surface }]}>
          <View style={[fs.handle, { backgroundColor: colors.border }]} />
          <Text style={[fs.title, { color: colors.textPrimary }]}>Filters</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[fs.section, { color: colors.textMuted }]}>DATE RANGE</Text>
            <View style={fs.row}>
              {field("From", "date_from", "YYYY-MM-DD")}
              {field("To", "date_to", "YYYY-MM-DD")}
            </View>

            <Text style={[fs.section, { color: colors.textMuted }]}>AMOUNT RANGE (UGX)</Text>
            <View style={fs.row}>
              {field("Min", "min_amount", "e.g. 10000", "numeric")}
              {field("Max", "max_amount", "e.g. 500000", "numeric")}
            </View>
          </ScrollView>

          <View style={fs.actions}>
            <TouchableOpacity
              style={[fs.btn, { borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => { setDraft(EMPTY_FILTERS); onApply(EMPTY_FILTERS); onClose(); }}
            >
              <Text style={[fs.btnText, { color: colors.textSecondary }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[fs.btn, { backgroundColor: "#E60549" }]}
              onPress={() => { onApply(draft); onClose(); }}
            >
              <Text style={[fs.btnText, { color: "#fff" }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const fs = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: "70%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "700", marginBottom: 16 },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  field: { flex: 1 },
  label: { fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "600" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OrdersListScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine whether to use the search API
  const inSearchMode = searchText.trim().length > 0 || filtersActive(filters);

  const fetchOrders = useCallback(async (q: string, tab: string, f: Filters) => {
    const isSearch = q.trim().length > 0 || filtersActive(f);
    const status = tab === "all" ? undefined : tab;

    if (isSearch) {
      setIsSearching(true);
      const results = await cartService.buyerOrderSearch({
        q: q.trim() || undefined,
        status,
        date_from: f.date_from || undefined,
        date_to: f.date_to || undefined,
        min_amount: f.min_amount || undefined,
        max_amount: f.max_amount || undefined,
      });
      setOrders(results);
      setIsSearching(false);
    } else {
      const data = await cartService.getOrders();
      // Apply status client-side when using the regular list endpoint
      const filtered = status ? data.filter((o: Order) => o.status === status) : data;
      setOrders(filtered);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders(searchText, activeTab, filters).finally(() => setLoading(false));
    }, [])
  );

  // Debounced search as user types
  const onSearchChange = (text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOrders(text, activeTab, filters);
    }, 400);
  };

  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchOrders(searchText, tab, filters);
  };

  const onApplyFilters = (f: Filters) => {
    setFilters(f);
    fetchOrders(searchText, activeTab, f);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(searchText, activeTab, filters);
    setRefreshing(false);
  };

  const clearSearch = () => {
    setSearchText("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchOrders("", activeTab, filters);
  };

  const clearAll = () => {
    setSearchText("");
    setFilters(EMPTY_FILTERS);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchOrders("", activeTab, EMPTY_FILTERS);
  };

  const activeFilterCount = filterCount(filters);

  // ─── Row ───────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Order }) => {
    const statusColor = STATUS_COLORS[item.status] ?? "#666";
    const itemCount = item.items?.length ?? 0;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/orderDetails/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>{item.order_number}</Text>
            <View style={styles.merchantRow}>
              <Ionicons name="storefront-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.merchantName, { color: colors.textSecondary }]}>{item.merchant_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
              <Ionicons name="cube-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>

          <View style={styles.cardRight}>
            <Text style={[styles.amount, { color: "#E60549" }]}>
              UGX {parseFloat(item.total_amount).toLocaleString()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status === "NEW" ? "New"
                  : item.status === "CONTACTED" ? "Contacted"
                  : item.status === "CONFIRMED" ? "Confirmed"
                  : item.status === "COMPLETED" ? "Delivered"
                  : "Cancelled"}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.viewText, { color: colors.primary }]}>View details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Empty ─────────────────────────────────────────────────────────────────

  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name={inSearchMode ? "search-outline" : "receipt-outline"} size={52} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {inSearchMode ? "No results found" : "No Orders Yet"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        {inSearchMode
          ? "Try adjusting your search or filters"
          : "Your orders will appear here once you make a purchase"}
      </Text>
      {inSearchMode && (
        <TouchableOpacity style={[styles.clearBtn, { backgroundColor: "#E60549" }]} onPress={clearAll}>
          <Text style={styles.clearBtnText}>Clear search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FilterSheet
        visible={filterSheetOpen}
        filters={filters}
        onApply={onApplyFilters}
        onClose={() => setFilterSheetOpen(false)}
        colors={colors}
      />

      {/* Search bar */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundSecondary }]}>
          {isSearching
            ? <ActivityIndicator size="small" color="#E60549" style={{ marginRight: 6 }} />
            : <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 6 }} />
          }
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by order no. or merchant…"
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={onSearchChange}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: activeFilterCount > 0 ? "#E60549" : colors.backgroundSecondary }]}
          onPress={() => setFilterSheetOpen(true)}
        >
          <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? "#fff" : colors.textPrimary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Status tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabChange(tab.key)}>
              <Text style={[styles.tabText, { color: active ? "#E60549" : colors.textMuted }, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {active && <View style={[styles.tabIndicator, { backgroundColor: "#E60549" }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, orders.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E60549" />
        }
        ListEmptyComponent={<EmptyState />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E60549",
  },
  filterBadgeText: { fontSize: 10, fontWeight: "700", color: "#E60549" },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 13 },
  tabTextActive: { fontWeight: "700" },
  tabIndicator: { height: 2, width: "60%", borderRadius: 1, marginTop: 4 },

  list: { padding: 16, gap: 10 },
  listEmpty: { flex: 1 },

  card: { borderRadius: 14, overflow: "hidden" },
  cardTop: { padding: 14, flexDirection: "row", gap: 12 },
  cardLeft: { flex: 1, gap: 5 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  orderNumber: { fontSize: 15, fontWeight: "700" },
  merchantRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  merchantName: { fontSize: 13, fontWeight: "500" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12 },
  amount: { fontSize: 15, fontWeight: "700" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  viewText: { fontSize: 13, fontWeight: "600" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20, color: "#888" },
  clearBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  clearBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
