// hooks/useCart.ts
import { useCartStore } from '@/utils/stores/useCartStore';
import { useCallback } from 'react';
import { Alert } from 'react-native';

/**
 * Custom hook for cart operations with built-in error handling
 */
export const useCart = () => {
  const {
    cart,
    cartCount,
    isLoading,
    isUpdating,
    fetchCart,
    fetchCartCount,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
  } = useCartStore();

  /**
   * Add item to cart with user feedback
   */
  const handleAddToCart = useCallback(
    async (listingId: string, quantity: number = 1) => {
      try {
        const success = await addToCart(listingId, quantity);
        
        if (success) {
          Alert.alert('Success', 'Item added to cart');
          return true;
        } else {
          Alert.alert('Error', 'Failed to add item to cart');
          return false;
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong');
        return false;
      }
    },
    [addToCart]
  );

  /**
   * Update item quantity with error handling
   */
  const handleUpdateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) {
        Alert.alert('Invalid Quantity', 'Quantity must be at least 1');
        return false;
      }

      try {
        const success = await updateCartItemQuantity(itemId, quantity);
        
        if (!success) {
          Alert.alert('Error', 'Failed to update quantity');
        }
        
        return success;
      } catch (error) {
        Alert.alert('Error', 'Something went wrong');
        return false;
      }
    },
    [updateCartItemQuantity]
  );

  /**
   * Remove item with confirmation
   */
  const handleRemoveItem = useCallback(
    async (itemId: string, itemTitle?: string) => {
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Remove Item',
          itemTitle ? `Remove "${itemTitle}" from cart?` : 'Remove this item from cart?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  const success = await removeCartItem(itemId);
                  if (!success) {
                    Alert.alert('Error', 'Failed to remove item');
                  }
                  resolve(success);
                } catch (error) {
                  Alert.alert('Error', 'Something went wrong');
                  resolve(false);
                }
              },
            },
          ]
        );
      });
    },
    [removeCartItem]
  );

  /**
   * Clear entire cart with confirmation
   */
  const handleClearCart = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Clear Cart',
        'Are you sure you want to remove all items from your cart?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              try {
                await clearCart();
                resolve(true);
              } catch (error) {
                Alert.alert('Error', 'Failed to clear cart');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  }, [clearCart]);

  /**
   * Refresh cart data
   */
  const refreshCart = useCallback(async () => {
    try {
      await fetchCart();
    } catch (error) {
      console.error('Failed to refresh cart:', error);
    }
  }, [fetchCart]);

  return {
    // State
    cart,
    cartCount,
    isLoading,
    isUpdating,
    items: cart?.items || [],
    totalItems: cart?.total_items || 0,
    totalPrice: cart?.total_price || '0',
    isEmpty: !cart || cart.items.length === 0,

    // Actions with built-in feedback
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    clearCart: handleClearCart,
    refreshCart,

    // Raw actions (without UI feedback)
    rawAddToCart: addToCart,
    rawUpdateQuantity: updateCartItemQuantity,
    rawRemoveItem: removeCartItem,
    rawClearCart: clearCart,
    
    // Utilities
    fetchCart,
    fetchCartCount,
  };
};

// Example usage:
/*
import { useCart } from '@/hooks/useCart';

const MyComponent = () => {
  const { 
    cart, 
    cartCount, 
    isLoading, 
    addToCart, 
    updateQuantity,
    removeItem,
    refreshCart 
  } = useCart();

  return (
    <View>
      <Text>Cart Items: {cartCount}</Text>
      <Button 
        title="Add to Cart" 
        onPress={() => addToCart('listing-123', 1)} 
      />
    </View>
  );
};
*/