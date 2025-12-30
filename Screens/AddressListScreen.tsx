import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import apiService from "@/utils/apiBase";

interface Address {
  id: string;
  user: string;
  label: string;
  region: string;
  district: string;
  area: string;
  landmark: string;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
  created_at: string;
}

interface AddressResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Address[];
}

export default function AddressListScreen() {
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses(1);
    }, [])
  );

  const fetchAddresses = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiService.get<AddressResponse>(
        `/api/v1/addresses/?page=${page}`
      );

      if (response.success && response.data) {
        const data = response.data;
        
        if (append) {
          setAddresses(prev => [...prev, ...data.results]);
        } else {
          setAddresses(data.results);
        }
        
        setTotalCount(data.count);
        setHasMore(!!data.next);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Alert.alert("Error", "Failed to load addresses. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAddresses(1);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchAddresses(currentPage + 1, true);
    }
  };

  const handleAddNew = () => {
    router.push("/checkout/new-address" as any);
  };

  const handleEdit = (addressId: string) => {
    router.push(`/addresses/${addressId}` as any);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await apiService.patch(
        `/api/v1/addresses/${addressId}/set-default/`
      );

      if (response.success) {
        // Update local state
        setAddresses(prev =>
          prev.map(addr => ({
            ...addr,
            is_default: addr.id === addressId,
          }))
        );
        Alert.alert("Success", "Default address updated");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      Alert.alert("Error", "Failed to update default address");
    }
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAddress(addressId),
        },
      ]
    );
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const response = await apiService.delete(`/api/v1/addresses/${addressId}/`);

      if (response.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        setTotalCount(prev => prev - 1);
        Alert.alert("Success", "Address deleted successfully");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete address");
    }
  };

  const renderAddressCard = ({ item }: { item: Address }) => {
    return (
      <View style={styles.addressCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[
              styles.labelBadge,
              item.is_default && styles.labelBadgeDefault
            ]}>
              <Ionicons
                name={
                  item.label === "HOME"
                    ? "home"
                    : item.label === "WORK"
                    ? "briefcase"
                    : "location"
                }
                size={14}
                color={item.is_default ? "#E60549" : "#666"}
              />
              <Text style={[
                styles.labelText,
                item.is_default && styles.labelTextDefault
              ]}>
                {item.label}
              </Text>
            </View>
            
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={18} color="#E60549" />
          </TouchableOpacity>
        </View>

        {/* Address Details */}
        <View style={styles.addressDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#999" />
            <Text style={styles.detailText}>
              {item.area}, {item.district}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={16} color="#999" />
            <Text style={styles.detailText}>{item.region} Region</Text>
          </View>

          {item.landmark && (
            <View style={styles.detailRow}>
              <Ionicons name="flag-outline" size={16} color="#999" />
              <Text style={styles.detailText}>{item.landmark}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          {!item.is_default && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Set as Default</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="location-outline" size={80} color="#CCC" />
        </View>
        
        <Text style={styles.emptyTitle}>No Addresses Yet</Text>
        <Text style={styles.emptyText}>
          Add your delivery addresses to make checkout faster and easier
        </Text>

        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleAddNew}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={styles.emptyButtonText}>Add Your First Address</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E60549" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (addresses.length === 0) return null;

    return (
      <View style={styles.listHeader}>
        <Text style={styles.countText}>
          {totalCount} {totalCount === 1 ? "Address" : "Addresses"}
        </Text>
        
        <TouchableOpacity
          style={styles.addNewButton}
          onPress={handleAddNew}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={20} color="#E60549" />
          <Text style={styles.addNewText}>Add New</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        renderItem={renderAddressCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E60549"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },
  listContent: {
    paddingVertical: 16,
  },

  // List Header
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  countText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFE5ED",
  },
  addNewText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E60549",
  },

  // Address Card
  addressCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  labelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
  },
  labelBadgeDefault: {
    backgroundColor: "#FFE5ED",
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  labelTextDefault: {
    color: "#E60549",
  },
  defaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#E8F5E9",
  },
  defaultText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4CAF50",
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFE5ED",
    justifyContent: "center",
    alignItems: "center",
  },

  // Address Details
  addressDetails: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  // Card Actions
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
  },
  deleteButtonText: {
    color: "#F44336",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: "#E60549",
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },

  // Footer Loader
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    color: "#999",
  },
});