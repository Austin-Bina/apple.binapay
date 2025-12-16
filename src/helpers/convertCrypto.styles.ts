import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  
  container: { flex: 1, backgroundColor: "#ffffffff", padding: 16 },

stickyTop: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  paddingVertical: 10,
  backgroundColor: "#fff",
  zIndex: 1000,
},


  card: {
  backgroundColor: "#fff",
  borderRadius: 20,
  padding: 20,
  marginVertical: 12,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 3,
},



  stickyButtonContainer: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: 20,
  backgroundColor: "#fff",
  borderTopLeftRadius: 24,
   paddingTop: 32,
    paddingBottom: 32,
  borderTopRightRadius: 24,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 12,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
},


   rateBanner: {
  backgroundColor: "#F0F9FF",
  paddingVertical: 6,
  paddingHorizontal: 14,
  borderRadius: 12,
  marginTop: 6,
  alignSelf: "center",
},

  rateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#00796B",
  },

title: {
  fontSize: 20,
  fontWeight: "600",
  color: "#111827",
  marginBottom: 4,
},
  subtitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  backBtn: { marginBottom: 12 },
  backText: { color: "#007bff", fontSize: 16 },
label: {
  fontSize: 13,
  fontWeight: "500",
  color: "#4b5563",
  marginTop: 14,
  marginBottom: 6,
},
  selector: { width: "100%", justifyContent: "center" },
  input: {
  backgroundColor: "#F3F4F6",
  borderRadius: 14,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: 16,
},

swapIcon: {
  alignSelf: "center",
  marginVertical: 10,
  backgroundColor: "#f3f4f6",
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#1807b4ff",
  shadowOpacity: 0.05,
  shadowRadius: 4,
},

  estimate: { marginTop: 8, fontSize: 14, color: "gray" },
 primaryBtn: {
  backgroundColor: "#2563eb",
  paddingVertical: 16,
  alignItems: "center",
  borderRadius: 14,
  shadowColor: "#2563eb",
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
},

  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: "#007bff",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  outlineText: { color: "#007bff", fontWeight: "600" },
  row: { flexDirection: "row", marginTop: 16 },
  countdown: { textAlign: "center", marginTop: 10, color: "gray" },

  picker: {
  height: 50,
  width: "100%",
  backgroundColor: "#f8f9fa",
  borderRadius: 10,
  marginTop: 8,
},


stepTwoContainer: {
  backgroundColor: "#f9fafb",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  marginTop: 10,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
},

summaryCard: {
  backgroundColor: "#fff",
  borderRadius: 10,
  padding: 16,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 1,
},

summaryTitle: {
  fontSize: 18,
  fontWeight: "600",
  color: "#374151",
  marginBottom: 8,
},

summaryText: {
  fontSize: 14,
  color: "#111827",
  marginBottom: 4,
},

summaryLabel: {
  fontWeight: "600",
  color: "#374151",
},

countdownRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
},

pinLabel: {
  fontSize: 15,
  fontWeight: "600",
  color: "#374151",
},

countdownText: {
  fontSize: 13,
  fontWeight: "500",
},

pinInput: {
  borderWidth: 1,
  borderRadius: 10,
  paddingVertical: 10,
  paddingHorizontal: 12,
  textAlign: "center",
  fontSize: 18,
  fontFamily: "monospace",
  marginBottom: 16,
},

pinInputActive: {
  borderColor: "#2563eb",
  backgroundColor: "#fff",
},

pinInputDisabled: {
  borderColor: "#d1d5db",
  backgroundColor: "#f3f4f6",
},

buttonRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 4,
},

backButton: {
  flex: 1,
  borderWidth: 1,
  borderColor: "#2563eb",
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: "center",
  marginRight: 10,
},


backButtonText: {
  color: "#2563eb",
  fontWeight: "600",
  fontSize: 15,
},

confirmButton: {
  flex: 1,
  backgroundColor: "#2563eb",
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: "center",
},


confirmButtonText: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 15,
},

disabledButton: {
  backgroundColor: "#9ca3af",
},

amountRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f3f4f6",
  borderColor: "#d1d5db",
  borderWidth: 1,
  borderRadius: 12,
  height: 50,
  paddingHorizontal: 10,
  marginBottom: 10,
},

amountInput: {
  flex: 1,
  fontSize: 16,
  height: "100%",
},

maxButton: {
  paddingHorizontal: 10,
  paddingVertical: 6,
  backgroundColor: "#115aecff",
  borderRadius: 8,
},

maxText: {
  fontWeight: "bold",
  color: "#eeeeeeff",
}


});
