import { verticalScale } from "@/utils/styling";
import { TypoProps } from "@/utils/types/models";
import React, { PropsWithChildren } from "react";
import { Text } from "@/components/Text";
import { TextStyle } from "react-native";

// ─── Weight → Space Grotesk font family map ───────────────────────────────────
const fontFamilyMap: Record<string, string> = {
  "400": "SpaceGrotesk_400Regular",
  "500": "SpaceGrotesk_500Medium",
  "600": "SpaceGrotesk_600SemiBold",
  "700": "SpaceGrotesk_700Bold",
  "800": "SpaceGrotesk_700Bold", // fallback — no 800 in Space Grotesk
  "bold": "SpaceGrotesk_700Bold",
  "normal": "SpaceGrotesk_400Regular",
};

type ExtendedTypoProps = PropsWithChildren<
  TypoProps & {
    numberOfLines?: number;
    style?: TextStyle | TextStyle[];
  }
>;

const Typo = ({
  size,
  color = "#000",
  fontWeight = "400",
  children,
  style,
  numberOfLines,
  textProps = {},
}: ExtendedTypoProps) => {
  const textStyle: TextStyle = {
    fontSize: size ? verticalScale(size) : verticalScale(18),
    color,
    fontFamily: fontFamilyMap[String(fontWeight)] ?? "SpaceGrotesk_400Regular",
  };

  const combinedTextProps = {
    ...textProps,
    ...(numberOfLines && { numberOfLines }),
  };

  return (
    <Text style={[textStyle, style]} {...combinedTextProps}>
      {children}
    </Text>
  );
};

export default Typo;