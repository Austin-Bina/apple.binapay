import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getNavigate } from "@utils/navigation";
import { SCREENS } from "@constants/screens";
import { resetNavigationToDashboard } from "@utils/navigation";

const { width, height } = Dimensions.get("window");

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  onViewHistory?: () => void;
};

const TransactionSuccessModal: React.FC<Props> = ({
  visible,
  title = "Transaction Successful 🎉",
  message = "Your deposit/withdrawal was successful. You can view details in your Assets page.",
  onClose,
  onViewHistory,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible]);
  
const handleContinue = async () => {
  resetNavigationToDashboard();
};

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <Animated.View style={{ transform: [{ translateY: slideAnim }], flex: 1 }}>
        <ImageBackground
          source={require("@assets/images/background-with-logo.png")}
          style={styles.background}
        >
          <SafeAreaView style={styles.content}>
            <Ionicons name="checkmark-circle" size={100} color="#0056ff" />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.okButton} onPress={handleContinue}>
                <Text style={styles.okText}>Continue to Home</Text>
              </TouchableOpacity>

              {onViewHistory && (
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={async () => {
                    const { navigate } = await getNavigate();
                    navigate(SCREENS.MAIN, {
                      screen: SCREENS.HOME,
                      params: { screen: SCREENS.TRANSACTION_HISTORY },
                    });
                  }}
                >
                  <Text style={styles.historyText}>View History</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </Animated.View>
    </Modal>
  );
};

export default TransactionSuccessModal;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: "center",
   backgroundColor: "#fff",

  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#0056ff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  message: {
    color: "#4b5563",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  buttons: {
    width: "100%",
    marginTop: 40,
    gap: 12,
  },
  okButton: {
    backgroundColor: "#0056ff",
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#0056ff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  okText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  historyButton: {
    borderColor: "#0056ff",
    borderWidth: 1.5,
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
  },
  historyText: {
    color: "#0056ff",
    fontSize: 16,
    fontWeight: "600",
  },
});
