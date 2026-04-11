import React, { useEffect, useRef, useState } from "react";
import { Text } from "@/components/Text";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, Animated, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cartService } from "@/utils/services/cartService";
import { merchantBase } from "@/utils/services/merchantService";
import { useTheme } from "@/contexts/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Image Lightbox ───────────────────────────────────────────────────────────

interface LightboxProps {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const ImageLightbox: React.FC<LightboxProps> = ({ visible, images, initialIndex, onClose }) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: initialIndex * SCREEN_WIDTH, animated: false });
      }, 50);
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, initialIndex]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[lbStyles.root, { opacity: fadeAnim }]}>
        {/* Close */}
        <TouchableOpacity
          style={[lbStyles.closeBtn, { top: insets.top + 10 }]}
          onPress={onClose}
          activeOpacity={0.82}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Counter */}
        {images.length > 1 && (
          <View style={[lbStyles.counter, { top: insets.top + 14 }]}>
            <Text style={lbStyles.counterText}>{currentIndex + 1} / {images.length}</Text>
          </View>
        )}

        {/* Pager */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
          }}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {images.map((uri, i) => (
            <View key={i} style={lbStyles.imageWrap}>
              <Image source={{ uri }} style={lbStyles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        {images.length > 1 && (
          <View style={[lbStyles.dotsRow, { bottom: insets.bottom + 24 }]}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  lbStyles.dot,
                  { backgroundColor: i === currentIndex ? "#fff" : "rgba(255,255,255,0.35)", width: i === currentIndex ? 20 : 7 },
                ]}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const lbStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: { position: "absolute", left: 0, right: 0, zIndex: 10, alignItems: "center" },
  counterText: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" },
  imageWrap: { width: SCREEN_WIDTH, height: "100%", justifyContent: "center", alignItems: "center" },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  dotsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: { height: 7, borderRadius: 4 },
});

// ─── Order Item Card ──────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  listing: {
    id: string;
    title: string;
    price: string;
    primary_image: { image: string } | null;
  };
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface ItemCardProps {
  item: OrderItem;
  isLast: boolean;
  colors: any;
  onImagePress: (images: string[], index: number) => void;
}

const OrderItemCard: React.FC<ItemCardProps> = ({ item, isLast, colors, onImagePress }) => {
  const images = item.listing.primary_image ? [item.listing.primary_image.image] : [];

  return (
    <View style={[itemCardStyles.container, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      {/* Square thumbnail – tap to expand */}
      {images.length > 0 ? (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => onImagePress(images, 0)}
          style={itemCardStyles.thumbWrap}
        >
          <Image source={{ uri: images[0] }} style={itemCardStyles.thumb} resizeMode="cover" />
          <View style={itemCardStyles.expandBadge}>
            <Ionicons name="expand-outline" size={10} color="#fff" />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[itemCardStyles.thumbWrap, itemCardStyles.imagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="image-outline" size={22} color={colors.textMuted} />
        </View>
      )}

      {/* Info */}
      <View style={itemCardStyles.info}>
        <Text style={[itemCardStyles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.listing.title}
        </Text>
        <Text style={[itemCardStyles.unitPrice, { color: colors.textMuted }]}>
          UGX {parseFloat(item.unit_price).toLocaleString()} × {item.quantity}
        </Text>
        <Text style={[itemCardStyles.totalPrice, { color: "#E60549" }]}>
          UGX {parseFloat(item.total_price).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const itemCardStyles = StyleSheet.create({
  container: { paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
  },
  thumb: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  expandBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 4,
    padding: 3,
  },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  unitPrice: { fontSize: 12, marginTop: 2 },
  totalPrice: { fontSize: 14, fontWeight: "700" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface OrderDetail {
  id: string;
  order_number: string;
  merchant_name: string;
  total_amount: string;
  delivery_fee: string;
  status: string;
  created_at: string;
  notes?: string;
  items: OrderItem[];
  address: {
    label: string;
    landmark: string;
    area: string;
    district: string;
    region: string;
  };
  order_group_number?: string;
  buyer?: {
    name: string;
    phone: string | null;
    email: string;
  };
}

export default function OrderDetailScreen() {
  const { colors } = useTheme();
  const { id, isMerchant: isMerchantParam } = useLocalSearchParams();
  const isMerchant = isMerchantParam === "true";
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Lightbox state
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const data = await cartService.getOrderbyID(id as string);
      setOrder(data);
    } catch (error) {
      if (__DEV__) console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxVisible(true);
  };

  const getStatusColor = (status: string) => {
    const map: { [key: string]: string } = {
      NEW: "#2196F3",
      CONTACTED: "#FF9800",
      CONFIRMED: "#4CAF50",
      COMPLETED: "#8BC34A",
      CANCELLED: "#F44336",
    };
    return map[status] || "#666";
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      NEW: "New Order",
      CONTACTED: "Merchant Contacted",
      CONFIRMED: "Order Confirmed",
      COMPLETED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return texts[status] || status;
  };

  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await cartService.cancelOrder(id as string);
            Alert.alert("Success", "Order cancelled successfully");
            fetchOrderDetail();
          } catch (error) {
            Alert.alert("Error", "Failed to cancel order");
          }
        },
      },
    ]);
  };

  const handleConfirmOrder = () => {
    Alert.alert("Confirm Order", "Confirm that you have received this order and will fulfil it?", [
      { text: "Not yet", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setActionLoading(true);
          const ok = await merchantBase.confirmOrder(id as string);
          setActionLoading(false);
          if (ok) {
            Alert.alert("Done", "Order confirmed successfully");
            fetchOrderDetail();
          } else {
            Alert.alert("Error", "Failed to confirm order. Please try again.");
          }
        },
      },
    ]);
  };

  const handleCompleteOrder = () => {
    Alert.alert("Mark as Completed", "Mark this order as delivered and completed?", [
      { text: "Not yet", style: "cancel" },
      {
        text: "Mark Complete",
        onPress: async () => {
          setActionLoading(true);
          const ok = await merchantBase.completeOrder(id as string);
          setActionLoading(false);
          if (ok) {
            Alert.alert("Done", "Order marked as completed");
            fetchOrderDetail();
          } else {
            Alert.alert("Error", "Failed to update order. Please try again.");
          }
        },
      },
    ]);
  };

  const canCancelOrder = () => !isMerchant && order && ["NEW", "CONTACTED"].includes(order.status);

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageLightbox
        visible={lightboxVisible}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        {(() => {
          const statusColor = getStatusColor(order.status);
          const isCancelled = order.status === "CANCELLED";
          const steps = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED"];
          const currentStep = isCancelled ? -1 : steps.indexOf(order.status);
          const stepLabels = ["Placed", "Contacted", "Confirmed", "Delivered"];
          const stepIcons: Record<string, any> = {
            NEW: "bag-outline",
            CONTACTED: "call-outline",
            CONFIRMED: "checkmark-circle-outline",
            COMPLETED: "cube-outline",
          };

          return (
            <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Badge row */}
              <View style={styles.statusBadgeRow}>
                <Text style={[styles.statusCardLabel, { color: colors.textMuted }]}>ORDER STATUS</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>{getStatusText(order.status)}</Text>
                </View>
              </View>

              {/* Progress stepper */}
              {!isCancelled && (
                <View style={styles.stepper}>
                  {steps.map((step, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    const stepColor = done ? statusColor : colors.border;
                    return (
                      <View key={step} style={styles.stepItem}>
                        <View style={[
                          styles.stepCircle,
                          { borderColor: stepColor, backgroundColor: done ? stepColor : colors.background }
                        ]}>
                          {done ? (
                            <Ionicons name={active ? stepIcons[step] : "checkmark"} size={12} color="#fff" />
                          ) : (
                            <View style={[styles.stepDotInner, { backgroundColor: colors.border }]} />
                          )}
                        </View>
                        <Text style={[styles.stepLabel, { color: done ? statusColor : colors.textMuted }]}>
                          {stepLabels[i]}
                        </Text>
                        {i < steps.length - 1 && (
                          <View style={[styles.stepLine, { backgroundColor: i < currentStep ? statusColor : colors.border }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {isCancelled && (
                <View style={[styles.cancelledBanner, { backgroundColor: "#FFF0F0" }]}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.cancelledText}>This order has been cancelled</Text>
                </View>
              )}

              {/* Labeled info grid */}
              <View style={[styles.statusInfoGrid, { borderTopColor: colors.border }]}>
                <View style={[styles.statusInfoCell, { borderColor: colors.border }]}>
                  <Text style={[styles.statusInfoLabel, { color: colors.textMuted }]}>Order No.</Text>
                  <Text style={[styles.statusInfoValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                    {order.order_number}
                  </Text>
                </View>
                <View style={[styles.statusInfoCell, { borderColor: colors.border }]}>
                  <Text style={[styles.statusInfoLabel, { color: colors.textMuted }]}>Placed</Text>
                  <Text style={[styles.statusInfoValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
                {order.order_group_number && (
                  <View style={[styles.statusInfoCell, styles.statusInfoCellFull, { borderColor: colors.border }]}>
                    <Text style={[styles.statusInfoLabel, { color: colors.textMuted }]}>Group No.</Text>
                    <Text style={[styles.statusInfoValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                      {order.order_group_number}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })()}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.card}>
            {(order.items ?? []).map((item, index) => (
              <OrderItemCard
                key={item.id}
                item={item}
                isLast={index === (order.items?.length ?? 1) - 1}
                colors={colors}
                onImagePress={openLightbox}
              />
            ))}
          </View>
        </View>

        {/* Merchant Info — only shown to buyers */}
        {!isMerchant && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Merchant</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="storefront-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.infoText}>{order.merchant_name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Customer Contact — only shown to merchants */}
        {isMerchant && order.buyer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Contact</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{order.buyer.name}</Text>
                </View>
              </View>
              {order.buyer.phone && (
                <View style={[styles.infoRow, { marginTop: 12 }]}>
                  <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{order.buyer.phone}</Text>
                  </View>
                </View>
              )}
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{order.buyer.email}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Delivery Address */}
        {order.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.card}>
              <View style={styles.addressHeader}>
                <Ionicons name="location" size={20} color="#E60549" />
                <Text style={styles.addressLabel}>{order.address.label}</Text>
              </View>
              <Text style={styles.addressText}>{order.address.landmark}</Text>
              <Text style={styles.addressText}>
                {order.address.area}, {order.address.district}
              </Text>
              <Text style={styles.addressRegion}>{order.address.region}</Text>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                UGX{" "}
                {(parseFloat(order.total_amount ?? "0") - parseFloat(order.delivery_fee || "0")).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {!order.delivery_fee || order.delivery_fee === "0.00" || order.delivery_fee === "0"
                  ? "FREE"
                  : `UGX ${parseFloat(order.delivery_fee).toLocaleString()}`}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>UGX {parseFloat(order.total_amount ?? "0").toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.infoValue, { flex: 1 }]}>{order.notes}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Actions */}
      {isMerchant && order.status === "NEW" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={handleConfirmOrder}
            disabled={actionLoading}
            activeOpacity={0.7}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isMerchant && order.status === "CONFIRMED" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteOrder}
            disabled={actionLoading}
            activeOpacity={0.7}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="bag-check-outline" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Mark as Completed</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {canCancelOrder() && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder} activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={20} color="#F44336" />
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    errorText: { fontSize: 15, color: colors.textSecondary },
    scrollView: { flex: 1 },

    statusCard: {
      marginHorizontal: 20,
      marginTop: 16,
      borderRadius: 14,
      borderWidth: 1,
      overflow: "hidden",
    },
    statusBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
    },
    statusCardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusBadgeText: { fontSize: 12, fontWeight: "700" },

    stepper: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    stepItem: { flex: 1, alignItems: "center", position: "relative" },
    stepCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    stepDotInner: { width: 6, height: 6, borderRadius: 3 },
    stepLabel: { fontSize: 10, fontWeight: "600", marginTop: 5, textAlign: "center" },
    stepLine: {
      position: "absolute",
      top: 12,
      left: "50%",
      right: "-50%",
      height: 2,
      zIndex: 0,
    },

    cancelledBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
    },
    cancelledText: { fontSize: 13, fontWeight: "600", color: "#F44336" },

    statusInfoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    statusInfoCell: {
      width: "50%",
      paddingVertical: 11,
      paddingHorizontal: 14,
      gap: 3,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    statusInfoCellFull: { width: "100%", borderRightWidth: 0 },
    statusInfoLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
    statusInfoValue: { fontSize: 13, fontWeight: "600" },

    section: { marginTop: 16, paddingHorizontal: 20 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
    },

    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },

    infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    infoContent: { flex: 1 },
    infoText: { fontSize: 15, color: colors.textPrimary, fontWeight: "500" },
    infoLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
    infoValue: { fontSize: 14, color: colors.textPrimary },

    addressHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    addressLabel: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
    addressText: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
    addressRegion: { fontSize: 13, color: colors.textMuted },

    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    summaryLabel: { fontSize: 14, color: colors.textSecondary },
    summaryValue: { fontSize: 14, fontWeight: "500", color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 12 },
    totalLabel: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
    totalValue: { fontSize: 18, fontWeight: "700", color: "#E60549" },

    footer: {
      padding: 20,
      paddingBottom: 32,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 10,
      gap: 8,
    },
    confirmButton: { backgroundColor: "#4CAF50" },
    completeButton: { backgroundColor: "#E60549" },
    confirmButtonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
    cancelButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      backgroundColor: "#FFF5F5",
      borderRadius: 10,
      gap: 8,
    },
    cancelButtonText: { fontSize: 15, fontWeight: "600", color: "#F44336" },
  });
