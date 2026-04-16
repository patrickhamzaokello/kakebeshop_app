import { colors } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import { BackButtonProps } from '@/utils/types/models'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'

const BackButton = ({
    style, iconSize = 24
}: BackButtonProps) => {
    const router = useRouter();
    return (
        <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.button, style]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Ionicons name="chevron-back" size={verticalScale(iconSize)} color={colors.black} />
        </TouchableOpacity>
    )
}

export default BackButton

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f2f2f2',
        justifyContent: "center",
        alignItems: "center",
    }
})