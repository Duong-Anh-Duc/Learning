import { StyleSheet } from "react-native";

export const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    textAlign: "center",
    marginBottom: 15,
  },
  modalCourseList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  modalCourseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
  },
  modalCourseName: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
  },
  modalCoursePrice: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
  },
  modalTotal: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    backgroundColor: "#FF6347",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
  },
  modalConfirmButton: {
    backgroundColor: "#009990",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
  },
});
