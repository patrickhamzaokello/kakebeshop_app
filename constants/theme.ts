import { Dimensions, PixelRatio, TextStyle, ViewStyle } from "react-native";

// =============================================================================
// RESPONSIVE SCALING UTILITIES
// =============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const [shortDimension, longDimension] =
  SCREEN_WIDTH < SCREEN_HEIGHT
    ? [SCREEN_WIDTH, SCREEN_HEIGHT]
    : [SCREEN_HEIGHT, SCREEN_WIDTH];

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) =>
  Math.round(
    PixelRatio.roundToNearestPixel((shortDimension / guidelineBaseWidth) * size)
  );

export const verticalScale = (size: number) =>
  Math.round(
    PixelRatio.roundToNearestPixel(
      (longDimension / guidelineBaseHeight) * size
    )
  );

export const moderateScale = (size: number, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

// =============================================================================
// COLOR PALETTE
// =============================================================================

// Light Theme Colors
export const lightColors = {
  // Brand Colors - Vibrant Red Accent
  primary: "#d00000",
  primaryLight: "#ff5400",
  primaryDark: "#B8003A",
  primarySoft: "#344e41",

  // Secondary Accent
  secondary: "#FF6B6B",
  secondaryLight: "#FF8E8E",
  secondaryDark: "#E64545",

  // Text Colors - Strong Black-based hierarchy
  text: "#1A1A1A",
  textPrimary: "#1A1A1A",
  textSecondary: "#4A4A4A",
  textMuted: "#6B6B6B",
  textPlaceholder: "#9A9A9A",
  textInverse: "#FFFFFF",

  // Background Colors - Clean White base
  background: "#FFFFFF",
  backgroundSecondary: "#F8F8F8",
  backgroundTertiary: "#F0F0F0",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",

  // Core Colors
  white: "#FFFFFF",
  black: "#000000",

  // Gray Scale - More contrast, less faint
  gray50: "#FAFAFA",
  gray100: "#F5F5F5",
  gray200: "#EEEEEE",
  gray300: "#E0E0E0",
  gray400: "#BDBDBD",
  gray500: "#9E9E9E",
  gray600: "#757575",
  gray700: "#616161",
  gray800: "#424242",
  gray900: "#212121",

  // Neutral Scale (legacy support)
  neutral50: "#FAFAFA",
  neutral100: "#F5F5F5",
  neutral200: "#EEEEEE",
  neutral300: "#E0E0E0",
  neutral350: "#D0D0D0",
  neutral400: "#BDBDBD",
  neutral500: "#9E9E9E",
  neutral600: "#757575",
  neutral700: "#616161",
  neutral800: "#424242",
  neutral900: "#212121",

  // Semantic Colors - Vibrant & Clear
  success: "#00C853",
  successLight: "#E8F5E9",
  successDark: "#00A844",

  error: "#FF3D3D",
  errorLight: "#FFEBEE",
  errorDark: "#D32F2F",

  warning: "#FFB300",
  warningLight: "#FFF8E1",
  warningDark: "#FF8F00",

  info: "#2196F3",
  infoLight: "#E3F2FD",
  infoDark: "#1976D2",

  // UI Elements
  border: "#E8E8E8",
  borderLight: "#F0F0F0",
  borderDark: "#D0D0D0",
  divider: "#EEEEEE",
  separator: "#E8E8E8",

  // Interactive States
  ripple: "rgba(230, 5, 73, 0.12)",
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.3)",
  backdrop: "rgba(0, 0, 0, 0.6)",

  // Special Colors
  star: "#FFB800",
  heart: "#d00000",
  verified: "#2196F3",
  online: "#00C853",
  offline: "#9E9E9E",

  // Legacy aliases
  rose: "#FF3D3D",
  green: "#00C853",
  matteBlack: "#1A1A1A",
  lineseparator: "#EEEEEE",

  // Card & Input specific
  card: "#FFFFFF",
  cardBorder: "#E8E8E8",
  inputBackground: "#FFFFFF",
  inputBorder: "#E8E8E8",
  iconColor: "#000000",
  iconColorMuted: "#6B6B6B",

  // Tab Bar
  tabBarBackground: "#FFFFFF",
  tabBarBorder: "#E8E8E8",
  tabBarActive: "#d00000",
  tabBarInactive: "#000000",

};

// Dark Theme Colors
export const darkColors: typeof lightColors = {
  // Brand Colors - Keep primary vibrant
  primary: "#ff5400",
  primaryLight: "#FF6B8E",
  primaryDark: "#d00000",
  primarySoft: "#344e41",

  // Secondary Accent
  secondary: "#FF8E8E",
  secondaryLight: "#FFA5A5",
  secondaryDark: "#FF6B6B",

  // Text Colors - Light text on dark backgrounds
  text: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textMuted: "#808080",
  textPlaceholder: "#606060",
  textInverse: "#1A1A1A",

  // Background Colors - Dark base
  background: "#121212",
  backgroundSecondary: "#1E1E1E",
  backgroundTertiary: "#2A2A2A",
  surface: "#1E1E1E",
  surfaceElevated: "#2A2A2A",

  // Core Colors (swapped for dark mode context)
  white: "#121212",
  black: "#FFFFFF",

  // Gray Scale - Inverted for dark mode
  gray50: "#212121",
  gray100: "#2A2A2A",
  gray200: "#333333",
  gray300: "#424242",
  gray400: "#616161",
  gray500: "#757575",
  gray600: "#9E9E9E",
  gray700: "#BDBDBD",
  gray800: "#E0E0E0",
  gray900: "#F5F5F5",

  // Neutral Scale (inverted)
  neutral50: "#212121",
  neutral100: "#2A2A2A",
  neutral200: "#333333",
  neutral300: "#424242",
  neutral350: "#4A4A4A",
  neutral400: "#616161",
  neutral500: "#757575",
  neutral600: "#9E9E9E",
  neutral700: "#BDBDBD",
  neutral800: "#E0E0E0",
  neutral900: "#F5F5F5",

  // Semantic Colors - Slightly brighter for dark mode
  success: "#4ADE80",
  successLight: "#1A3D2A",
  successDark: "#22C55E",

  error: "#F87171",
  errorLight: "#3D1A1A",
  errorDark: "#EF4444",

  warning: "#FBBF24",
  warningLight: "#3D3010",
  warningDark: "#F59E0B",

  info: "#60A5FA",
  infoLight: "#1A2A3D",
  infoDark: "#3B82F6",

  // UI Elements
  border: "#333333",
  borderLight: "#2A2A2A",
  borderDark: "#424242",
  divider: "#333333",
  separator: "#333333",

  // Interactive States
  ripple: "rgba(255, 77, 122, 0.2)",
  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.5)",
  backdrop: "rgba(0, 0, 0, 0.8)",

  // Special Colors
  star: "#FBBF24",
  heart: "#ff5400",
  verified: "#60A5FA",
  online: "#4ADE80",
  offline: "#757575",

  // Legacy aliases
  rose: "#F87171",
  green: "#4ADE80",
  matteBlack: "#FFFFFF",
  lineseparator: "#333333",

  // Card & Input specific
  card: "#1E1E1E",
  cardBorder: "#333333",
  inputBackground: "#2A2A2A",
  inputBorder: "#424242",
  iconColor: "#FFFFFF",
  iconColorMuted: "#9E9E9E",

  // Tab Bar
  tabBarBackground: "#1E1E1E",
  tabBarBorder: "#333333",
  tabBarActive: "#ff5400",
  tabBarInactive: "#9E9E9E",

};

// Default export (light colors for backward compatibility)
export const colors = lightColors;

// Type for theme colors
export type ThemeColors = typeof lightColors;

// =============================================================================
// SPACING SYSTEM
// =============================================================================

export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
} as const;

export const spacingX = {
  _2: scale(2),
  _3: scale(3),
  _4: scale(4),
  _5: scale(5),
  _6: scale(6),
  _7: scale(7),
  _8: scale(8),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _16: scale(16),
  _20: scale(20),
  _24: scale(24),
  _25: scale(25),
  _30: scale(30),
  _32: scale(32),
  _35: scale(35),
  _40: scale(40),
} as const;

export const spacingY = {
  _1: verticalScale(1),
  _2: verticalScale(2),
  _3: verticalScale(3),
  _4: verticalScale(4),
  _5: verticalScale(5),
  _6: verticalScale(6),
  _7: verticalScale(7),
  _8: verticalScale(8),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _14: verticalScale(14),
  _15: verticalScale(15),
  _16: verticalScale(16),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _24: verticalScale(24),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _32: verticalScale(32),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _48: verticalScale(48),
  _50: verticalScale(50),
  _60: verticalScale(60),
  _80: verticalScale(80),
  _100: verticalScale(100),
  _140: verticalScale(140),
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const radius = {
  _3: verticalScale(3),
  _4: verticalScale(4),
  _6: verticalScale(6),
  _8: verticalScale(8),
  _9: verticalScale(9),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _14: verticalScale(14),
  _15: verticalScale(15),
  _16: verticalScale(16),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _24: verticalScale(24),
  _30: verticalScale(30),
  full: 9999,
} as const;

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 30,
  headline: 36,
  hero: 48,
} as const;

export const fontWeight = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Pre-defined text styles
export const typography = {
  hero: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: fontSize.hero * lineHeight.tight,
  } as TextStyle,

  headline: {
    fontSize: fontSize.headline,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: fontSize.headline * lineHeight.tight,
  } as TextStyle,

  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    lineHeight: fontSize.xxxl * lineHeight.tight,
  } as TextStyle,

  subtitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: fontSize.xl * lineHeight.normal,
  } as TextStyle,

  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.textPrimary,
    lineHeight: fontSize.lg * lineHeight.normal,
  } as TextStyle,

  bodySmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: fontSize.md * lineHeight.normal,
  } as TextStyle,

  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
    lineHeight: fontSize.sm * lineHeight.normal,
  } as TextStyle,

  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * lineHeight.normal,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as TextStyle,

  button: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    lineHeight: fontSize.lg * lineHeight.tight,
  } as TextStyle,

  price: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  } as TextStyle,

  priceSmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  } as TextStyle,
};

// =============================================================================
// SHADOWS
// =============================================================================

export const shadow = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,

  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,

  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,

  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  } as ViewStyle,

  // Colored shadows for primary elements
  primary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  // Card shadow
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,

  // Floating action button shadow
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
};

// =============================================================================
// COMMON COMPONENT STYLES
// =============================================================================

export const components = {
  // Card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  } as ViewStyle,

  cardElevated: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadow.md,
  } as ViewStyle,

  // Input styles
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  } as ViewStyle & TextStyle,

  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  } as ViewStyle,

  // Button base
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacingY._14,
    paddingHorizontal: spacingX._24,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,

  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacingY._14,
    paddingHorizontal: spacingX._24,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,

  buttonText: {
    backgroundColor: "transparent",
    paddingVertical: spacingY._8,
    paddingHorizontal: spacingX._16,
  } as ViewStyle,

  // Container styles
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  contentContainer: {
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._16,
  } as ViewStyle,

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  } as ViewStyle,

  dividerThick: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
  } as ViewStyle,

  // Badge
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacingX._8,
    paddingVertical: spacingY._2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,

  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  } as TextStyle,

  // Chip/Tag
  chip: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._6,
  } as ViewStyle,

  chipActive: {
    backgroundColor: colors.primary,
  } as ViewStyle,

  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  } as TextStyle,

  chipTextActive: {
    color: colors.white,
  } as TextStyle,

  // Icon button
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,

  iconButtonPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  } as ViewStyle,
};

// =============================================================================
// ANIMATION DURATIONS
// =============================================================================

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// =============================================================================
// Z-INDEX LEVELS
// =============================================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
} as const;

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

export const layout = {
  screenPadding: spacingX._16,
  cardPadding: spacingX._16,
  listItemHeight: verticalScale(56),
  headerHeight: verticalScale(56),
  tabBarHeight: verticalScale(60),
  buttonHeight: verticalScale(48),
  inputHeight: verticalScale(48),
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  },
} as const;

// =============================================================================
// THEME OBJECT (Combined export)
// =============================================================================

const theme = {
  colors,
  spacing,
  spacingX,
  spacingY,
  radius,
  borderRadius,
  fontSize,
  fontWeight,
  lineHeight,
  typography,
  shadow,
  components,
  animation,
  zIndex,
  layout,
  scale,
  verticalScale,
  moderateScale,
};

export default theme;
