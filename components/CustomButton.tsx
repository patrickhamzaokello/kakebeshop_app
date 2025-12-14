import { colors, radius } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { CustomButtonProps } from "@/utils/types";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";

const CustomButton = ({
    style, onPress, loading = false, children
}: CustomButtonProps) => {

    return (
        <TouchableOpacity
            onPress={!loading ? onPress : undefined}
            style={[styles.button, style, loading && styles.disabledButton]}
            disabled={loading}
        >
            {loading ? <ActivityIndicator size="small" color={colors.white} /> : children}
        </TouchableOpacity>
    )
}

export default CustomButton;

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        borderRadius: radius._17,
        borderCurve: 'continuous',
        height: verticalScale(52),
        justifyContent: 'center',
        alignItems: 'center'

    },
    disabledButton: {
        backgroundColor: colors.primaryDark,
    }
})