import { verticalScale } from "@/utils/styling";
import { TypoProps } from "@/utils/types/models";
import React, { PropsWithChildren } from "react";
import { Text } from "@/components/Text";
import { TextStyle } from "react-native";

const fontFamilyMap: Record<string, string> = {
  "400": "BeVietnamPro_400Regular",
  "500": "BeVietnamPro_500Medium",
  "600": "BeVietnamPro_600SemiBold",
  "700": "BeVietnamPro_700Bold",
  "800": "BeVietnamPro_800ExtraBold",
  "bold": "BeVietnamPro_700Bold",
  "normal": "BeVietnamPro_400Regular",
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
    fontFamily: fontFamilyMap[String(fontWeight)] ?? "BeVietnamPro_400Regular",
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