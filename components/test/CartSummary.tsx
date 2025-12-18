import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface CartSummaryProps {
  totalItems: number;
  totalPrice: string; // keep as string to match API
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
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Items</Text>
        <Text style={styles.value}>{totalItems}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.total}>
          UGX {parseFloat(totalPrice).toLocaleString()}
        </Text>
      </View>

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
          <Text style={styles.checkoutText}>Checkout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  label: {
    fontSize: 13,
    color: '#666',
  },

  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },

  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },

  checkoutButton: {
    marginTop: 12,
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  checkoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
