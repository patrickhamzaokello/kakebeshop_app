import { colors } from "@/constants/theme";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import Typo from "./Typo";

const { width: screenWidth } = Dimensions.get("window");
const ITEM_WIDTH = screenWidth * 0.9;
const SIDE_PEEK = (screenWidth - ITEM_WIDTH) / 2;

interface CarouselProps {
  data: { imageUrl: string }[];
}

export const  Carousel: React.FC<CarouselProps> = ({ data }) => {
  const flatListRef = useRef<FlatList>(null);

  const renderItem = ({ item }: { item: { imageUrl: string } }) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      {/* "New" Tag */}
      <View style={styles.newTag}>
        <Typo size={12} fontWeight={"700"} color={colors.white}>
          New
        </Typo>
      </View>
      <View style={styles.feature_carousel_text}>
        <Typo
          size={20}
          fontWeight={"700"}
          color={colors.white}
          style={styles.titleText}
        >
          Inside President Museveni - Jane Acilo State House Meeting.
        </Typo>
        <Typo
          size={15}
          fontWeight={"300"}
          color={colors.white}
          style={styles.subtitleText}
        >
          Read Now
        </Typo>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_PEEK }}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  itemContainer: {
    width: ITEM_WIDTH,
  },
  image: {
    width: ITEM_WIDTH - 15,
    height: 180,
    resizeMode: "cover",
    borderRadius: 8,
  },
  feature_carousel_text: {
    gap: 10,
    paddingVertical: 20,
    width: ITEM_WIDTH - 20,
  },
  titleText: {
    textAlign: "left",
  },
  subtitleText: {
    textAlign: "left",
  },
  
  newTag: {
    position: "absolute",
    top: 10,
    left: 20,
    backgroundColor: colors.primary, // Replace with your desired color
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
});
