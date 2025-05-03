// styles/common/common.styles.ts
import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  title: {
    fontSize: 24,
    textAlign: "center",
    color: "#333",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#575757",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    position: "absolute",
  },
});