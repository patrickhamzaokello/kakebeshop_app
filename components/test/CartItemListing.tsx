import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ListingImage } from '@/components/test/common/ListingImage';
import { CartItem } from '@/utils/types/models';
import { useTheme } from '@/contexts/ThemeContext';

interface CartItemsProps {
  items: CartItem[] | null;
  loading: boolean;
  onItemPress?: (item: CartItem) => void;
  onQuantityChange?: (itemId: string, newQuantity: number) => Promise<boolean>;
  onRemoveItem?: (itemId: string) => Promise<boolean>;
}

// ─── Shimmer skeleton ────────────────────────────────────────────────────────

const ShimmerCard: React.FC = () => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] });
  const bg = colors.backgroundSecondary;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardMain}>
        <Animated.View style={[styles.shimmerImage, { backgroundColor: bg, opacity }]} />
        <View style={styles.cardContent}>
          <Animated.View style={[styles.shimmerLine, { width: '75%', backgroundColor: bg, opacity }]} />
          <Animated.View style={[styles.shimmerLine, { width: '50%', backgroundColor: bg, opacity }]} />
          <Animated.View style={[styles.shimmerLine, { width: '55%', backgroundColor: bg, opacity }]} />
        </View>
      </View>
      <Animated.View style={[styles.shimmerFooter, { backgroundColor: bg, opacity }]} />
    </View>
  );
};

// ─── Swipe delete action ──────────────────────────────────────────────────────

const SwipeDeleteAction: React.FC<{
  onDelete: () => void;
  progress: Animated.AnimatedInterpolation<number>;
}> = ({ onDelete, progress }) => {
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
    extrapolate: 'clamp',
  });

  return (
    <TouchableOpacity style={styles.deleteAction} onPress={onDelete} activeOpacity={0.85}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <Ionicons name="trash" size={22} color="#fff" />
        <Text style={styles.deleteActionText}>Remove</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Cart item card ───────────────────────────────────────────────────────────

const CartItemCard: React.FC<{
  item: CartItem;
  onPress?: (item: CartItem) => void;
  onQuantityChange?: (itemId: string, newQuantity: number) => Promise<boolean>;
  onRemove?: (itemId: string) => Promise<boolean>;
}> = ({ item, onPress, onQuantityChange, onRemove }) => {
  const { colors } = useTheme();
  const [localQty, setLocalQty] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);
  const swipeRef = useRef<Swipeable>(null);

  useEffect(() => {
    setLocalQty(item.quantity);
  }, [item.quantity]);

  const handleQty = async (delta: number) => {
    const next = localQty + delta;
    if (next < 1 || !onQuantityChange || updating) return;
    setUpdating(true);
    const prev = localQty;
    setLocalQty(next);
    const ok = await onQuantityChange(item.id, next);
    if (!ok) setLocalQty(prev);
    setUpdating(false);
  };

  const handleRemove = useCallback(() => {
    swipeRef.current?.close();
    onRemove?.(item.id);
  }, [item.id, onRemove]);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>
  ) => <SwipeDeleteAction onDelete={handleRemove} progress={progress} />;

  const isInactive = !item.listing.is_active || item.listing.status !== 'ACTIVE';
  const subtotal = parseFloat(item.subtotal);

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
      overshootRight={false}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isInactive ? 'rgba(255,59,48,0.2)' : colors.border,
            opacity: updating ? 0.65 : 1,
          },
        ]}
      >
        {isInactive && (
          <View style={styles.inactiveBanner}>
            <Ionicons name="warning-outline" size={12} color="#FF3B30" />
            <Text style={styles.inactiveBannerText}>Item no longer available</Text>
          </View>
        )}

        {/* Main content row */}
        <TouchableOpacity
          style={styles.cardMain}
          onPress={() => onPress?.(item)}
          activeOpacity={0.75}
          disabled={updating}
        >
          <View style={styles.imageWrap}>
            <ListingImage primaryImage={item.listing.primary_image} style={styles.image} />
            {isInactive && <View style={styles.imageOverlay} />}
          </View>

          <View style={styles.cardContent}>
            <Text
              style={[styles.itemTitle, { color: isInactive ? colors.textMuted : colors.textPrimary }]}
              numberOfLines={2}
            >
              {item.listing.title}
            </Text>
            <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>
              UGX {parseFloat(item.listing.price).toLocaleString()} / item
            </Text>
            <Text style={[styles.subtotalText, { color: colors.primary }]}>
              UGX {subtotal.toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Qty + remove row */}
        <View style={[styles.qtyRow, { borderTopColor: colors.border }]}>
          <View style={[styles.stepper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.stepBtn, (localQty <= 1 || updating) && styles.stepBtnDisabled]}
              onPress={() => handleQty(-1)}
              disabled={localQty <= 1 || updating}
            >
              <Ionicons name="remove" size={16} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{localQty}</Text>

            <TouchableOpacity
              style={[styles.stepBtn, updating && styles.stepBtnDisabled]}
              onPress={() => handleQty(1)}
              disabled={updating}
            >
              <Ionicons name="add" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={handleRemove}
            disabled={updating}
          >
            <Ionicons name="trash-outline" size={15} color="#FF3B30" />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const CartItems: React.FC<CartItemsProps> = ({
  items,
  loading,
  onItemPress,
  onQuantityChange,
  onRemoveItem,
}) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.listContainer}>
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="cart-outline" size={44} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Browse the marketplace and add items to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.listHeaderText, { color: colors.textSecondary }]}>
          {items.length} {items.length === 1 ? 'item' : 'items'} · Swipe left to remove
        </Text>
      </View>

      {items.map((item) => (
        <CartItemCard
          key={item.id}
          item={item}
          onPress={onItemPress}
          onQuantityChange={onQuantityChange}
          onRemove={onRemoveItem}
        />
      ))}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContainer: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  listHeader: {
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
  listHeaderText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Card
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  unitPrice: {
    fontSize: 12,
  },
  subtotalText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Inactive banner
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,59,48,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  inactiveBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF3B30',
  },

  // Qty row
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,59,48,0.08)',
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },

  // Swipe delete
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 14,
    marginLeft: 6,
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  // Shimmer
  shimmerImage: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  shimmerLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  shimmerFooter: {
    height: 44,
    margin: 12,
    borderRadius: 8,
  },

  // Empty state
  emptyContainer: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
