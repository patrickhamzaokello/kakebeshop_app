import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { cartService } from "@/utils/services/cartService";

interface UserAddress {
  id: string;
  label: string;
  region: string;
  district: string;
  area: string;
  landmark: string;
  is_default: boolean;
}

export default function AddressSelectionScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Auto-refresh when screen comes into focus (after returning from add/edit address)
  useFocusEffect(
    useCallback(() => {
      // Refresh addresses every time the screen is focused
      fetchAddresses();
    }, [])
  );

  const fetchAddresses = async () => {
    try {
      const data = await cartService.getAddresses();
      setAddresses(data);
      
      // Auto-select default address if no address is currently selected
      if (!selectedAddress) {
        const defaultAddr = data.find((addr: UserAddress) => addr.is_default);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr.id);
        } else if (data.length > 0) {
          // If no default, select the first address
          setSelectedAddress(data[0].id);
        }
      } else {
        // Check if the currently selected address still exists
        const stillExists = data.find((addr: UserAddress) => addr.id === selectedAddress);
        if (!stillExists && data.length > 0) {
          // If selected address was deleted, select default or first address
          const defaultAddr = data.find((addr: UserAddress) => addr.is_default);
          setSelectedAddress(defaultAddr ? defaultAddr.id : data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedAddress) {
      router.push({
        pathname: "/checkout/confirm-order",
        params: { addressId: selectedAddress },
      });
    }
  };

  const renderAddressItem = ({ item }: { item: UserAddress }) => (
    <TouchableOpacity
      style={[
        styles.addressCard,
        selectedAddress === item.id && styles.selectedCard,
      ]}
      onPress={() => setSelectedAddress(item.id)}
    >
      <View style={styles.radioContainer}>
        <View
          style={[
            styles.radio,
            selectedAddress === item.id && styles.radioSelected,
          ]}
        >
          {selectedAddress === item.id && <View style={styles.radioDot} />}
        </View>
      </View>
      
      <View style={styles.addressInfo}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{item.label}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.address}>
          {item.landmark}, {item.area}
        </Text>
        <Text style={styles.location}>
          {item.district}, {item.region}
        </Text>
      </View>
  
      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/addresses/${item.id}`);
        }}
      >
        <Ionicons name="pencil" size={20} color="#E60549" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Addresses Yet</Text>
      <Text style={styles.emptyText}>
        Add a delivery address to continue with your order
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push("/checkout/new-address")}
      >
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text style={styles.emptyButtonText}>Add Your First Address</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  // Show empty state if no addresses
  if (addresses.length === 0) {
    return <View style={styles.container}>{renderEmptyState()}</View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        renderItem={renderAddressItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/checkout/new-address")}
          >
            <Ionicons name="add-circle-outline" size={24} color="#E60549" />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>
        }
      />
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedAddress && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedAddress}
        >
          <Text style={styles.continueButtonText}>Continue to Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "#E60549",
  },
  radioContainer: {
    marginRight: 12,
    justifyContent: "center",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: "#E60549",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E60549",
  },
  addressInfo: {
    flex: 1,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#E60549",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  address: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: "#666",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#E60549",
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E60549",
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  continueButton: {
    backgroundColor: "#E60549",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCC",
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E60549",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});