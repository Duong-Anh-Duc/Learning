// frontend/app/(tabs)/index.tsx
import AllCourses from "@/components/courses/all.courses";
import Header from "@/components/header/header";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={["#009990", "#F6F7F9"]}
      style={{ flex: 1, paddingTop: 50 }}
    >
      <Header />
      <AllCourses />
    </LinearGradient>
  );
}

export const styles = StyleSheet.create({});