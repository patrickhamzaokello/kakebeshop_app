import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';


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
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        {/* Items Count */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Ionicons name="cart-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.label, {color: colors.textSecondary}]}>Items</Text>
          </View>
          <Text style={[styles.value, {color: colors.textPrimary}]}>{totalItems}</Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, {backgroundColor: colors.border}]} />

        {/* Total Price */}
        <View style={[styles.totalRow, ]}>
          <Text style={[styles.totalLabel, {color: colors.textSecondary}]}>Total</Text>
          <Text style={[styles.totalValue, {color: colors.textPrimary}]}>
            UGX {priceValue.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity
        style={[
          styles.checkoutButton, { backgroundColor: disabled || loading ? colors.primarySoft + '80' : colors.primary },
        ]}
        activeOpacity={0.8}
        onPress={onCheckout}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={[styles.checkoutText, {color: colors.black}]}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.black} />
          </>
        )}
      </TouchableOpacity>

      {/* Helper Text */}
      {disabled && (
        <Text style={[styles.helperText, {color: colors.textSecondary}]}>
          Add items to your cart to checkout
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  summaryCard: {
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
    fontWeight: '500',
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
  },

  divider: {
    height: 1,
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
  },

  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },

  checkoutButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  disabledButton: {
  },

  checkoutText: {
    fontSize: 16,
    fontWeight: '600',
  },

  helperText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});