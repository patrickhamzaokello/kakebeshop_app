// components/ListingImage.tsx
import React from 'react';
import { Image, View, StyleSheet, ImageStyle } from 'react-native';
import { ListingImageType as ListingImageType } from '@/utils/types/models';
import { useTheme } from '@/contexts/ThemeContext';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface ListingImageProps {
    primaryImage: ListingImageType | null;
    style?: ImageStyle;
}

// Themed SVG placeholder that looks like a product/image icon
const PlaceholderSvg: React.FC<{ size?: number }> = ({ size = 64 }) => {
    const { colors } = useTheme();

    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
            {/* Background rounded rectangle */}
            <Rect
                x="8"
                y="12"
                width="48"
                height="40"
                rx="4"
                stroke={colors.textPlaceholder}
                strokeWidth="2"
                fill="none"
            />
            {/* Mountain/landscape icon */}
            <Path
                d="M8 44 L24 28 L32 36 L44 24 L56 40 L56 48 C56 50.2 54.2 52 52 52 L12 52 C9.8 52 8 50.2 8 48 Z"
                fill={colors.textPlaceholder}
                opacity={0.3}
            />
            {/* Sun circle */}
            <Circle
                cx="46"
                cy="24"
                r="6"
                fill={colors.textPlaceholder}
                opacity={0.5}
            />
        </Svg>
    );
};

export const ListingImage: React.FC<ListingImageProps> = ({
    primaryImage,
    style,
}) => {
    const { colors } = useTheme();

    // Fallback component with themed SVG
    const renderFallback = () => (
        <View style={[styles.image, style, styles.fallbackContainer, { backgroundColor: colors.backgroundTertiary }]}>
            <PlaceholderSvg size={56} />
        </View>
    );

    // Handle null or empty images array
    if (!primaryImage || !primaryImage.image) {
        return renderFallback();
    }

    return (
        <Image
            source={{ uri: primaryImage.image }}
            style={[styles.image, style]}
            resizeMode="cover"
        />
    );
};

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 250,
        borderRadius: 8,
    },
    fallbackContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});