import React, { useState, useCallback, useRef, useEffect } from "react";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { merchantBase, MerchantOrderStatus } from "@/utils/services/merchantService";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MerchantOrder {
  id: string;
  order_number: string;
  buyer_name?: string;
  buyer?: { name: string; phone: string | null };
  total_amount: string;
  delivery_fee?: string;
  status: MerchantOrderStatus;
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

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MerchantOrderStatus, { label: string; color: string; bg: string }> = {
  NEW:       { label: "New",       color: "#2196F3", bg: "#2196F315" },
  CONTACTED: { label: "Contacted", color: "#FF9800", bg: "#FF980015" },
  CONFIRMED: { label: "Confirmed", color: "#4CAF50", bg: "#4CAF5015" },
  COMPLETED: { label: "Completed", color: "#8BC34A", bg: "#8BC34A15" },
  CANCELLED: { label: "Cancelled", color: "#F44336", bg: "#F4433615" },
};

const TABS: { key: "ALL" | MerchantOrderStatus; label: string }[] = [
  { key: "ALL",       label: "All" },
  { key: "NEW",       label: "New" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Done" },
  { key: "CANCELLED", label: "Cancelled" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function filtersActive(f: Filters) {
  return !!(f.date_from || f.date_to || f.min_amount || f.max_amount);
}

function filterCount(f: Filters) {
  return [f.date_from, f.date_to, f.min_amount, f.max_amount].filter(Boolean).length;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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
  }, [visible]);

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
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "600" },
});

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order, colors }: { order: MerchantOrder; colors: any }) {
  const status = STATUS_CONFIG[order.status];
  const itemCount = order.items?.length ?? 0;
  const buyerName = order.buyer_name ?? order.buyer?.name ?? "—";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push({ pathname: "/orderDetails/[id]", params: { id: order.id, isMerchant: "true" } })}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>{order.order_number}</Text>
          <Text style={[styles.orderMeta, { color: colors.textMuted }]}>
            {itemCount} {itemCount === 1 ? "item" : "items"} · {formatDate(order.created_at)}
          </Text>
          <View style={styles.buyerRow}>
            <Ionicons name="person-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.buyerName, { color: colors.textSecondary }]}>{buyerName}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.amount, { color: colors.textPrimary }]}>
            UGX {parseFloat(order.total_amount).toLocaleString()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.actionHint, { color: order.status === "NEW" || order.status === "CONFIRMED" ? colors.primary : colors.textMuted }]}>
          {order.status === "NEW" ? "Tap to confirm this order"
            : order.status === "CONFIRMED" ? "Tap to mark as complete"
            : "Tap to view details"}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MerchantOrdersScreen() {
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<"ALL" | MerchantOrderStatus>("ALL");
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inSearchMode = searchText.trim().length > 0 || filtersActive(filters);

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadOrders = useCallback(
    async (
      tab: "ALL" | MerchantOrderStatus,
      q: string,
      f: Filters,
      pageNum = 1,
      append = false
    ) => {
      const status = tab === "ALL" ? undefined : tab;
      const search = q.trim().length > 0 || filtersActive(f);

      if (search) {
        setIsSearching(true);
        const results = await merchantBase.merchantOrderSearch({
          q: q.trim() || undefined,
          status,
          date_from: f.date_from || undefined,
          date_to: f.date_to || undefined,
          min_amount: f.min_amount || undefined,
          max_amount: f.max_amount || undefined,
        });
        setOrders(results);
        setHasMore(false);
        setIsSearching(false);
      } else {
        const data = await merchantBase.getMerchantOrders(pageNum, status);
        if (!data) return;
        const results: MerchantOrder[] = data.results ?? data.data ?? data;
        setOrders((prev) => (append ? [...prev, ...results] : results));
        setHasMore(!!data.next);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      loadOrders(activeTab, searchText, filters, 1, false).finally(() => setLoading(false));
    }, [activeTab])
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const onSearchChange = (text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadOrders(activeTab, text, filters, 1, false);
    }, 400);
  };

  const onTabChange = (tab: "ALL" | MerchantOrderStatus) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setOrders([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    loadOrders(tab, searchText, filters, 1, false).finally(() => setLoading(false));
  };

  const onApplyFilters = (f: Filters) => {
    setFilters(f);
    loadOrders(activeTab, searchText, f, 1, false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadOrders(activeTab, searchText, filters, 1, false);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore || inSearchMode) return;
    setLoadingMore(true);
    const next = page + 1;
    await loadOrders(activeTab, searchText, filters, next, true);
    setPage(next);
    setLoadingMore(false);
  };

  const clearSearch = () => {
    setSearchText("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    loadOrders(activeTab, "", filters, 1, false);
  };

  const clearAll = () => {
    setSearchText("");
    setFilters(EMPTY_FILTERS);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    loadOrders(activeTab, "", EMPTY_FILTERS, 1, false);
  };

  const activeFilterCount = filterCount(filters);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <FilterSheet
        visible={filterSheetOpen}
        filters={filters}
        onApply={onApplyFilters}
        onClose={() => setFilterSheetOpen(false)}
        colors={colors}
      />

      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Orders</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {loading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={[styles.searchRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.searchBox, { backgroundColor: colors.backgroundSecondary }]}>
            {isSearching
              ? <ActivityIndicator size="small" color="#E60549" style={{ marginRight: 6 }} />
              : <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 6 }} />
            }
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search by order no., buyer name…"
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
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => onTabChange(tab.key)}
              >
                <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textMuted }, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} colors={colors} />}
          contentContainerStyle={[styles.list, orders.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.primary} style={styles.listFooter} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name={inSearchMode ? "search-outline" : "receipt-outline"} size={52} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {inSearchMode ? "No results found" : activeTab === "ALL" ? "No orders yet" : `No ${STATUS_CONFIG[activeTab as MerchantOrderStatus]?.label.toLowerCase()} orders`}
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
                {inSearchMode ? "Try adjusting your search or filters" : activeTab === "ALL" ? "When customers place orders, they'll appear here" : "Try another tab to see other orders"}
              </Text>
              {inSearchMode && (
                <TouchableOpacity style={[styles.clearBtn, { backgroundColor: colors.primary }]} onPress={clearAll}>
                  <Text style={styles.clearBtnText}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  headerSub: { fontSize: 12, textAlign: "center", marginTop: 1 },

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

  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  tabLabel: { fontSize: 13 },
  tabLabelActive: { fontWeight: "700" },

  list: { padding: 16, gap: 10 },
  listEmpty: { flex: 1 },
  listFooter: { paddingVertical: 16 },

  card: { borderRadius: 14, overflow: "hidden" },
  cardTop: { flexDirection: "row", padding: 14, gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  orderNumber: { fontSize: 15, fontWeight: "700" },
  orderMeta: { fontSize: 12 },
  buyerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  buyerName: { fontSize: 13, fontWeight: "500" },
  amount: { fontSize: 15, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionHint: { fontSize: 13 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyMessage: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  clearBtn: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  clearBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
