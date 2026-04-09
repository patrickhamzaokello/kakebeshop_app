import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";

const weightToFamily: Record<string, string> = {
  "100": "SpaceGrotesk_400Regular",
  "200": "SpaceGrotesk_400Regular",
  "300": "SpaceGrotesk_400Regular",
  "400": "SpaceGrotesk_400Regular",
  "500": "SpaceGrotesk_500Medium",
  "600": "SpaceGrotesk_600SemiBold",
  "700": "SpaceGrotesk_700Bold",
  "800": "SpaceGrotesk_700Bold",
  "900": "SpaceGrotesk_700Bold",
  normal: "SpaceGrotesk_400Regular",
  bold: "SpaceGrotesk_700Bold",
};

const Text = React.forwardRef<RNText, TextProps>((props, ref) => {
  const flat = (StyleSheet.flatten(props.style) ?? {}) as any;
  const { fontWeight, fontFamily: existingFamily, ...restStyle } = flat;
  const resolvedFamily =
    existingFamily ??
    weightToFamily[String(fontWeight ?? "400")] ??
    "SpaceGrotesk_400Regular";

  return (
    <RNText
      {...props}
      ref={ref}
      style={{ ...restStyle, fontFamily: resolvedFamily }}
    />
  );
});

Text.displayName = "Text";
export { Text };
export default Text;
