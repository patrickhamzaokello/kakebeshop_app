import React from 'react';
import { Text } from "@/components/Text";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface CartSummaryProps {
  totalItems: number;
  totalPrice: string;
  onCheckout: () => void;
  loading?: boolean;
  disabled?: boolean;
  isSyncing?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  totalItems,
  totalPrice,
  onCheckout,
  loading = false,
  disabled = false,
  isSyncing = false,
}) => {
  const { colors } = useTheme();
  const total = parseFloat(totalPrice) || 0;
  const canCheckout = !disabled && !loading;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>

      {/* Background sync indicator */}
      {isSyncing && (
        <View style={[styles.syncRow, { backgroundColor: colors.backgroundSecondary }]}>
          <ActivityIndicator size="small" color={colors.textMuted} />
          <Text style={[styles.syncText, { color: colors.textMuted }]}>Syncing with server…</Text>
        </View>
      )}

      {/* Price + checkout */}
      <View style={styles.mainRow}>
        <View style={styles.priceBlock}>
          <Text style={[styles.itemCountLabel, { color: colors.textSecondary }]}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Text>
          <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>
            UGX {total.toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            { backgroundColor: canCheckout ? '#E60549' : colors.border },
          ]}
          onPress={onCheckout}
          disabled={!canCheckout}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={[styles.checkoutBtnText, { opacity: canCheckout ? 1 : 0.5 }]}>
                Checkout
              </Text>
              {canCheckout && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </>
          )}
        </TouchableOpacity>
      </View>

      {disabled && !loading && (
        <Text style={[styles.helperText, { color: colors.textMuted }]}>
          Add items to your cart to proceed
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncText: {
    fontSize: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBlock: {
    gap: 2,
  },
  itemCountLabel: {
    fontSize: 13,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  checkoutBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
