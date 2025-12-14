import Header from "@/components/header/Header";
import NewsFeed from "@/components/NewsFeed";
import ScreenWrapper from "@/components/ScreenWrapper";

import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { ScrollView, StyleSheet, View } from "react-native";

export default function Index() {
  return (
    <>
      <Header statusBarStyle="dark-content" />
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <NewsFeed />
      </View>
    </>
  );
}
