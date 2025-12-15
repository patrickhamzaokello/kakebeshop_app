import { colors } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import { BackButtonProps } from '@/utils/types/models'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'

const BackButton = ({
    style, iconSize = 26
}: BackButtonProps) => {
    const router = useRouter();
    return (
        <TouchableOpacity onPress={() => router.back()} style={[styles.button, style]}>
           <Ionicons name="chevron-back" size={verticalScale(iconSize)} color={colors.black} weight="bold" />
        </TouchableOpacity>
    )
}

export default BackButton

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    }
})