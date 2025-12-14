import { LinearGradient } from "expo-linear-gradient";

export default function GradientBackground() {
  return (
    <LinearGradient
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: -1,
      }}
      colors={["#EACDD5", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />
  );
}