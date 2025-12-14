import { verticalScale } from "@/utils/styling";
import { TypoProps } from "@/utils/types";
import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";

interface ExtendedTypoProps extends TypoProps {
    numberOfLines?: number;
}

const Typo = ({
    size,
    color = "#000",
    fontWeight = "400",
    children,
    style,
    numberOfLines,
    textProps = {}
}: ExtendedTypoProps) => {

    const textStyle: TextStyle = {
        fontSize: size ? verticalScale(size) : verticalScale(18),
        color,
        fontWeight
    }

    const combinedTextProps = {
        ...textProps,
        ...(numberOfLines && { numberOfLines })
    };

    return (
        <Text style={[textStyle, style]} {...combinedTextProps}>{children}</Text>
    )
}

export default Typo;

const styles = StyleSheet.create({})