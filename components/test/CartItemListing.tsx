import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ListingImage } from '@/components/test/common/ListingImage';
import { CartItem } from '@/utils/types/models';

interface CartItemsProps {
  items: CartItem[] | null;
  loading: boolean;
  onItemPress?: (item: CartItem) => void;
  onQuantityChange?: (itemId: string, newQuantity: number) => Promise<boolean>;
  onRemoveItem?: (itemId: string) => Promise<boolean>;
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
};

const CartItemCard: React.FC<{
  item: CartItem;
  onPress?: (item: CartItem) => void;
  onQuantityChange?: (itemId: string, newQuantity: number) => Promise<boolean>;
  onRemove?: (itemId: string) => Promise<boolean>;
}> = ({ item, onPress, onQuantityChange, onRemove }) => {
  const [updating, setUpdating] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  // Sync local quantity with prop changes
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || !onQuantityChange) return;

    setUpdating(true);
    const previousQuantity = localQuantity;
    setLocalQuantity(newQuantity);

    try {
      const success = await onQuantityChange(item.id, newQuantity);
      if (!success) {
        setLocalQuantity(previousQuantity);
        Alert.alert('Error', 'Failed to update quantity');
      }
    } catch (error) {
      setLocalQuantity(previousQuantity);
      Alert.alert('Error', 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = () => {
    if (!onRemove) return;

    Alert.alert(
      'Remove Item',
      `Remove "${item.listing.title}" from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const success = await onRemove(item.id);
              if (!success) {
                Alert.alert('Error', 'Failed to remove item');
                setUpdating(false);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item');
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.cartCard, updating && styles.cardUpdating]}>
      {/* Image and Main Info */}
      <TouchableOpacity
        style={styles.cardMain}
        activeOpacity={0.7}
        onPress={() => onPress?.(item)}
        disabled={updating}
      >
        <ListingImage
          primaryImage={item.listing.primary_image}
          style={styles.image}
          fallbackSource={require('@/assets/images/placeholder.png')}
        />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.listing.title}
          </Text>

          <Text style={styles.price}>
            UGX {parseFloat(item.listing.price).toLocaleString()}
          </Text>

          <Text style={styles.subtotal}>
            UGX {parseFloat(item.subtotal).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Quantity Controls */}
      <View style={styles.controls}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              (localQuantity <= 1 || updating) && styles.quantityButtonDisabled,
            ]}
            onPress={() => handleQuantityChange(localQuantity - 1)}
            disabled={localQuantity <= 1 || updating}
          >
            <Ionicons
              name="remove"
              size={18}
              color={localQuantity <= 1 || updating ? '#ccc' : '#000'}
            />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{localQuantity}</Text>

          <TouchableOpacity
            style={[styles.quantityButton, updating && styles.quantityButtonDisabled]}
            onPress={() => handleQuantityChange(localQuantity + 1)}
            disabled={updating}
          >
            <Ionicons
              name="add"
              size={18}
              color={updating ? '#ccc' : '#000'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          disabled={updating}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={updating ? '#ccc' : '#FF3B30'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const CartItems: React.FC<CartItemsProps> = ({
  items,
  loading,
  onItemPress,
  onQuantityChange,
  onRemoveItem,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((key) => (
          <View key={key} style={styles.cartCard}>
            <View style={styles.cardMain}>
              <ShimmerPlaceholder style={styles.imageShimmer} />
              <View style={styles.content}>
                <ShimmerPlaceholder style={styles.lineLarge} />
                <ShimmerPlaceholder style={styles.lineSmall} />
                <ShimmerPlaceholder style={styles.lineSmall} />
              </View>
            </View>
            <View style={styles.controls}>
              <ShimmerPlaceholder style={styles.controlsShimmer} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>
            Add items to get started
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onPress={onItemPress}
            onQuantityChange={onQuantityChange}
            onRemove={onRemoveItem}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },

  /* Card */
  cartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  cardUpdating: {
    opacity: 0.6,
  },

  cardMain: {
    flexDirection: 'row',
  },

  /* Image */
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },

  imageShimmer: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },

  /* Content */
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },

  price: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },

  subtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  /* Controls */
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 4,
  },

  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },

  quantityButtonDisabled: {
    opacity: 0.4,
  },

  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },

  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },

  /* Shimmer lines */
  lineLarge: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },

  lineSmall: {
    width: '50%',
    height: 12,
    borderRadius: 4,
    marginBottom: 6,
  },

  controlsShimmer: {
    width: '100%',
    height: 36,
    borderRadius: 8,
  },
});