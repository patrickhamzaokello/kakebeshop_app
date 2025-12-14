import { scale, verticalScale } from "@/utils/styling";

export const colors = {
  primary: "#000",
  primaryLight: "#d9f99d",
  primaryDark: "#1C1A40",
  text: "#fff",
  textLight: "#e5e5e5",
  textLighter: "#d4d4d4",
  white: "#fff",
  black: "#000",
  rose: "#ef4444",
  green: "#16a34a",
  background: "rgba(255, 255, 255, 0.1)",
  divider: "rgba(255, 255, 255, 0.1)",
  surface: "rgba(255, 255, 255, 0.1)",
  border: "rgba(255, 255, 255, 0.1)",
  success: "#1DB954",
  error: "#F15E6C",
  warning: "#F7B633",
  info: "#3498DB",
  lineseparator: "#E5E7EB",
  neutral50: "#fafafa",
  neutral100: "#f5f5f5",
  neutral200: "#e5e5e5",
  neutral300: "#d4d4d4",
  neutral350: "#CCCCCC",
  neutral400: "#a3a3a3",
  neutral500: "#737373",
  neutral600: "#525252",
  neutral700: "#404040",
  neutral800: "#262626",
  neutral900: "#000",
  matteBlack: "#1C1C1C",
  secondary: "#FF6F61",
};

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
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(10),
};

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
  _15: verticalScale(15),
  _16: verticalScale(16),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60),
  _80: verticalScale(80),
  _140: verticalScale(140),
};

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
  _30: verticalScale(30),
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 30,
  headline: 40,
};

export const fontWeight = {
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
};