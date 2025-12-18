import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

import { CartItem } from '@/utils/types/models';
import { ListingImage } from '@/components/test/common/ListingImage';

interface CartItemsProps {
  items: CartItem[] | null;
  loading: boolean;
  onItemPress?: (item: CartItem) => void;
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

export const CartItems: React.FC<CartItemsProps> = ({
  items,
  loading,
  onItemPress,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>

        {[1, 2, 3].map((key) => (
          <View key={key} style={styles.cartCard}>
            <ShimmerPlaceholder style={styles.imageShimmer} />
            <View style={styles.content}>
              <ShimmerPlaceholder style={styles.lineLarge} />
              <ShimmerPlaceholder style={styles.lineSmall} />
              <ShimmerPlaceholder style={styles.lineSmall} />
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
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.cartCard}
            activeOpacity={0.7}
            onPress={() => onItemPress?.(item)}
          >
            <ListingImage
              primaryImage={item.listing.primary_image}
              style={styles.image}
              fallbackSource={require('@/assets/images/placeholder.png')}
            />

            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {item.listing.title}
              </Text>

              <Text style={styles.price}>
                UGX {parseFloat(item.listing.price).toLocaleString()}
              </Text>

              <Text style={styles.meta}>
                Qty: {item.quantity}
              </Text>

              <Text style={styles.subtotal}>
                Subtotal: UGX {parseFloat(item.subtotal).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },

  /* Card */
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },

  /* Image */
  image: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },

  imageShimmer: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },

  /* Content */
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  price: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },

  meta: {
    fontSize: 12,
    color: '#666',
  },

  subtotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },

  /* Shimmer lines */
  lineLarge: {
    width: '80%',
    height: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  lineSmall: {
    width: '50%',
    height: 10,
    borderRadius: 4,
    marginBottom: 6,
  },
});
