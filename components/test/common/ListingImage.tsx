// components/ListingImage.tsx
import React from 'react';
import { Image, View, StyleSheet, ImageStyle } from 'react-native';
import { ListingImage as ListingImageType } from '@/utils/types/models';

interface ListingImageProps {
    images: ListingImageType[] | null;
    style?: ImageStyle;
    fallbackSource?: any; // Could be a local image or require()
}

export const ListingImage: React.FC<ListingImageProps> = ({
                                                              images,
                                                              style,
                                                              fallbackSource,
                                                          }) => {
    // Handle null or empty images array
    if (!images || images.length === 0) {
        return (
            <View style={[styles.image, style, styles.fallbackContainer]}>
                {fallbackSource ? (
                    <Image
                        source={fallbackSource}
                        style={[styles.image, style]}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.fallbackPlaceholder} />
                )}
            </View>
        );
    }

    // Find primary image first, then fall back to first image
    const getImageSource = () => {
        // Try to find primary image
        const primaryImage = images.find(img => img.is_primary);
        if (primaryImage?.image) {
            return primaryImage.image;
        }

        // Fall back to first image with valid URL
        const firstValidImage = images.find(img => img.image);
        return firstValidImage?.image || null;
    };

    const imageUri = getImageSource();

    if (!imageUri) {
        return (
            <View style={[styles.image, style, styles.fallbackContainer]}>
                {fallbackSource ? (
                    <Image
                        source={fallbackSource}
                        style={[styles.image, style]}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.fallbackPlaceholder} />
                )}
            </View>
        );
    }

    return (
        <Image
            source={{ uri: imageUri }}
            style={[styles.image, style]}
            resizeMode="cover"
            defaultSource={fallbackSource} // Optional: shows while loading
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
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackPlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: '#e0e0e0',
        borderRadius: 25,
    },
});