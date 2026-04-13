import React from "react";
import { TextInput as RNTextInput, TextInputProps, StyleSheet } from "react-native";

const weightToFamily: Record<string, string> = {
  "100": "BeVietnamPro_400Regular",
  "200": "BeVietnamPro_400Regular",
  "300": "BeVietnamPro_400Regular",
  "400": "BeVietnamPro_400Regular",
  "500": "BeVietnamPro_500Medium",
  "600": "BeVietnamPro_600SemiBold",
  "700": "BeVietnamPro_700Bold",
  "800": "BeVietnamPro_800ExtraBold",
  "900": "BeVietnamPro_800ExtraBold",
  normal: "BeVietnamPro_400Regular",
  bold: "BeVietnamPro_700Bold",
};

const TextInput = React.forwardRef<RNTextInput, TextInputProps>((props, ref) => {
  const flat = (StyleSheet.flatten(props.style) ?? {}) as any;
  const { fontWeight, fontFamily: existingFamily, ...restStyle } = flat;
  const resolvedFamily =
    existingFamily ??
    weightToFamily[String(fontWeight ?? "400")] ??
    "BeVietnamPro_400Regular";

  return (
    <RNTextInput
      {...props}
      ref={ref}
      style={{ ...restStyle, fontFamily: resolvedFamily }}
    />
  );
});

TextInput.displayName = "TextInput";
export { TextInput };
export default TextInput;
