import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CartSummaryProps {
  totalItems: number;
  totalPrice: string;
  onCheckout: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  totalItems,
  totalPrice,
  onCheckout,
  loading = false,
  disabled = false,
}) => {
  const priceValue = parseFloat(totalPrice);

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        {/* Items Count */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Ionicons name="cart-outline" size={16} color="#666" />
            <Text style={styles.label}>Items</Text>
          </View>
          <Text style={styles.value}>{totalItems}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Total Price */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            UGX {priceValue.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity
        style={[
          styles.checkoutButton,
          (disabled || loading) && styles.disabledButton,
        ]}
        activeOpacity={0.8}
        onPress={onCheckout}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      {/* Helper Text */}
      {disabled && (
        <Text style={styles.helperText}>
          Add items to your cart to checkout
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  summaryCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  disabledButton: {
    backgroundColor: '#ccc',
  },

  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  helperText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});