import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Provider } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { calculateConversion, ConversionResult} from "../../helpers/crypto-conversion";
import { styles } from "../../helpers/convertCrypto.styles";
import { getPairRateDisplay } from "../../helpers/rate-display";
import { useNavigation } from "@react-navigation/native";
import API from "@lib/api";
import { routes } from "@constants/routes";
import DropDownPicker from "react-native-dropdown-picker";
import { useDispatch } from "react-redux";
import { authSliceActions } from "@store/slice/auth";
import { navigateToTransaction } from "@helpers/transaction";
import TransactionSuccessModal from "@components/ui/modals/TransactionSuccessModal";
import { formattedBalance } from "@utils/transactionutils";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SafeAreaView } from "react-native-safe-area-context";

type CryptoAsset = {
  id: number;
  name: string;
  symbol: string;
  price_usd?: number;
  conversion_enabled: boolean;
  min_conversion: number;
};

type PickerItem = { label: string; value: string };

type Props = {
  cryptoAssets: CryptoAsset[];
  adminNgnUsdtRate: { buy: number; sell: number } | null;
  spreadConfig?: { spreadType: "percent" | "flat"; spread: number }; // new
};

export default function ConvertCrypto({ cryptoAssets, adminNgnUsdtRate, spreadConfig }: Props) {
  const navigation = useNavigation();
  const user = useSelector(selectUser);

  // Map wallet balances from Redux
  const wallets: Record<string, number> = {};
  if (user?.wallet_balances) {
    Object.entries(user.wallet_balances).forEach(([slug, wallet]: any) => {
      const key = slug.toLowerCase() === "naira" ? "ngn" : slug.toLowerCase();
      wallets[key] = Number(wallet.balance);
    });
  }

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    fromSymbol: "ngn",
    toSymbol: "",
    amount: "",
    pin: "",
    
    
  });
  

  const [fromOpen, setFromOpen] = useState(false);
const [toOpen, setToOpen] = useState(false);

const [fromItems, setFromItems] = useState<PickerItem[]>([
  { label: "Naira (₦)", value: "ngn" },
  ...cryptoAssets.map(a => ({
    label: a.symbol.toUpperCase(),
    value: a.symbol.toLowerCase(),
  })),
]);


const [toItems, setToItems] = useState<PickerItem[]>([]);



  const [conversionResult, setConversionResult] = useState<ConversionResult>({ finalAmount: null, spreadApplied: null });
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState<number>(0);
const [rateExpired, setRateExpired] = useState(false);
const dispatch = useDispatch();
const [submitting, setSubmitting] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);
const [successMessage, setSuccessMessage] = useState("");

  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  /** Fetch only crypto prices now **/
  useEffect(() => {
  const fetchPricesSilently = async (showInitial = false) => {
    if (showInitial) setLoading(true);
    try {
      API.defaults.baseURL = BASE_URL;
      const res = await API.get<{ success: boolean; data: CryptoAsset[] }>(
        routes.api.v1.auth.cryptoprices
      );

      if (res.data.success) {
        const pricesMap: Record<string, number> = {};
        res.data.data.forEach((asset) => {
          if (asset.price_usd) pricesMap[asset.symbol.toUpperCase()] = asset.price_usd;
        });
        setLivePrices(pricesMap);
      }
    } catch (err) {
      console.log("Error fetching prices:", err);
    } finally {
      if (showInitial) setLoading(false);
    }
  };

  fetchPricesSilently(true); // only show loading on first mount
  const interval = setInterval(() => fetchPricesSilently(false), 180000); // silent update every 3 mins

  return () => clearInterval(interval);
}, []);


useEffect(() => {
  const from = data.fromSymbol.toLowerCase();

  let options = [];

  if (from === "ngn") {
    options = cryptoAssets.map(a => ({
      label: a.symbol.toUpperCase(),
      value: a.symbol.toLowerCase()
    }));
  } else {
    options = [{ label: "NGN", value: "ngn" }];
  }

  setToItems(options);

  // Auto-fix invalid selections
  if (from === "ngn" && data.toSymbol === "ngn") {
    setData(p => ({ ...p, toSymbol: "" }));
  }

  if (from !== "ngn" && data.toSymbol !== "ngn") {
    setData(p => ({ ...p, toSymbol: "ngn" }));
  }
}, [data.fromSymbol]);


useEffect(() => {
  const from = data.fromSymbol.toLowerCase();

  // If "from" is NGN, keep only crypto in "toSymbol"
  if (from === "ngn" && data.toSymbol === "ngn") {
    setData({ ...data, toSymbol: "" });
  }

  // If "from" is crypto, force "toSymbol" to NGN
  if (from !== "ngn" && data.toSymbol !== "ngn") {
    setData({ ...data, toSymbol: "ngn" });
  }
}, [data.fromSymbol]);



  /** Conversion calculation **/
  useEffect(() => {
    if (!data.amount || !data.toSymbol || !adminNgnUsdtRate) {
      setConversionResult({ finalAmount: null, spreadApplied: null });
      return;
    }

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      setConversionResult({ finalAmount: null, spreadApplied: null });
      return;
    }

    const result = calculateConversion(
      data.fromSymbol,
      data.toSymbol,
      amount,
      livePrices,
      adminNgnUsdtRate, // Use Redux rate directly
      spreadConfig
    );
    setConversionResult(result);
  }, [data.fromSymbol, data.toSymbol, data.amount, livePrices, adminNgnUsdtRate]);

  /** Wallet balance check **/
  const checkBalance = (): boolean => {
    const balance = wallets[data.fromSymbol] ?? 0;
    if (parseFloat(data.amount) > balance) {
      Alert.alert(
        "Insufficient Balance",
        `Your wallet has ${balance} ${data.fromSymbol.toUpperCase()}, which is less than the amount entered.`
      );
      return false;
    }
    return true;
  };
  
  /**
   * 
   * @returns handle preview swap
   */
const nextStep = () => {
  const amount = parseFloat(data.amount);

  if (!data.amount || isNaN(amount) || amount <= 0) {
    Alert.alert("Amount Required", "Please enter a valid amount before continuing.");
    return;
  }

  // ✅ Get the selected "from" asset
  const fromAsset = cryptoAssets.find(
    (asset) => asset.symbol.toLowerCase() === data.fromSymbol.toLowerCase()
  );

  // ✅ Case 1: Crypto → NGN (use dynamic min_conversion)
  if (fromAsset && data.fromSymbol.toLowerCase() !== "ngn") {
    const minConversion = Number(fromAsset.min_conversion ?? 0);

    if (amount < minConversion) {
      Alert.alert(
        "Below Minimum Conversion",
        `The minimum amount to convert ${fromAsset.symbol.toUpperCase()} is ${minConversion}.`
      );
      return;
    }
  }

  // ✅ Case 2: NGN → Crypto (hardcoded minimum)
  if (data.fromSymbol.toLowerCase() === "ngn" && data.toSymbol) {
    const NGN_MIN_CONVERSION = 1500;

    if (amount < NGN_MIN_CONVERSION) {
      Alert.alert(
        "Below Minimum Conversion",
        `The minimum amount to convert from NGN is ${NGN_MIN_CONVERSION}.`
      );
      return;
    }
  }

  // ✅ Check balance
  if (!checkBalance()) return;

  // ✅ Proceed
  setStep(2);
  setCountdown(30);
};


  //countdown
useEffect(() => {
  let timer: NodeJS.Timeout;

  if (step === 2 && countdown > 0) {
    // Start countdown
    timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return () => clearInterval(timer);
}, [step, countdown]);

// --- CLEAR PIN when leaving step 2 ---
useEffect(() => {
  if (step !== 2 && data.pin) {
    setData({ ...data, pin: "" });
  }
}, [step]);

// --- COUNTDOWN with auto reset like React version ---
useEffect(() => {
  let timer: NodeJS.Timeout;

  if (step === 2 && countdown > 0) {
    timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRateExpired(true); // trigger expiry
          setStep(1);
          setData({ fromSymbol: "ngn", toSymbol: "", amount: "", pin: "" });
          setConversionResult({ finalAmount: null, spreadApplied: null });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return () => clearInterval(timer);
}, [step, countdown]);

/**
 * HANDLE SUBMISSION
 */

  const handleSubmit = async () => {
    if (step === 2) {
      setSubmitting(true);
      try {
        API.defaults.baseURL = BASE_URL;

        const res = await API.post(routes.api.v1.auth.covertcrypto, {
          from: data.fromSymbol,
          to: data.toSymbol,
          amount: parseFloat(data.amount),
          pin: data.pin,
          livePrices,
          liveNgnUsdt: adminNgnUsdtRate, 
        });

        if (res.data.success) {
 const receivedAmount = res.data.conversion?.to_amount ?? conversionResult.finalAmount;
setSuccessMessage(`You received ${formattedBalance(receivedAmount ?? 0, data.toSymbol)}.`);
  setShowSuccess(true);
}

        else {
          Alert.alert("Conversion Failed", res.data?.error || "Conversion failed");
        }
      }catch (err: any) {

  let userFriendlyMsg = "Something went wrong. Please try again.";

  // Optional: if you want to show specific backend message without exposing details
  if (err.response?.data?.message) {
    userFriendlyMsg = err.response.data.message; 
  }

   if (err.response?.status === 403 && err.response.data?.error) {
        // Blocked user case
        userFriendlyMsg = err.response.data.error; 
      } else if (err.response?.data?.message) {
        // Other backend messages
        userFriendlyMsg = err.response.data.message;
      }

  Alert.alert("Conversion Failed", userFriendlyMsg);
}

      finally {
      setSubmitting(false); // ✅ Re-enable button after all outcomes
    }
    }

  };
const goBack = () => {
  setStep(1);
  setCountdown(0); // reset countdown if user goes back
};

  return (
  <Provider>
    {/* Sticky Top Section */}
    <View style={styles.stickyTop}>

      {step === 1 && !loading && data.fromSymbol && data.toSymbol && adminNgnUsdtRate && (
        <View style={styles.rateBanner}>
          <Text style={styles.rateText}>
            {getPairRateDisplay({
              fromSymbol: data.fromSymbol,
              toSymbol: data.toSymbol,
              livePrices,
              liveNgnUsdt: adminNgnUsdtRate,
              spreadConfig,
            })}
          </Text>
        </View>
      )}
    </View>

    {/* Scrollable Section */}
    <ScrollableView
      contentContainerStyle={{ paddingBottom: 50, paddingTop: 60, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
        {step === 1 && (
          <View style={styles.card}>
            {/* From */}
           
           <Text style={styles.label}>From</Text>
           <View style={{ zIndex: 3000 }}> 
<DropDownPicker
  open={fromOpen}
  value={data.fromSymbol}
  items={fromItems}
  setOpen={setFromOpen}
  setValue={(cb) => setData(p => ({ ...p, fromSymbol: cb(p.fromSymbol) }))}
  setItems={setFromItems}
  listMode="SCROLLVIEW" 
  placeholder="Select asset"
 style={{
    backgroundColor: "#f3f4f6", // light gray like withdrawal
    borderColor: "#d1d5db",
    borderRadius: 12,
    marginBottom: fromOpen ? 120 : 15,
    height: 50,
  }}
  dropDownContainerStyle={{
    backgroundColor: "#fff", // white dropdown list
    borderColor: "#d1d5db",
    borderRadius: 12,
  }}
  zIndex={3000}
  zIndexInverse={1000}
/>
</View>

           {/* Swap Icon */}
<TouchableOpacity
  style={[
    styles.swapIcon,
    data.fromSymbol !== "ngn" && data.toSymbol !== "ngn"
      ? { opacity: 0.5 }
      : {},
  ]}
  disabled={data.fromSymbol !== "ngn" && data.toSymbol !== "ngn"} // disable crypto↔crypto swap
  onPress={() => {
    if (data.fromSymbol !== "ngn" && data.toSymbol !== "ngn") return;
    setData((prev) => ({
      ...prev,
      fromSymbol: prev.toSymbol || "ngn",
      toSymbol: prev.fromSymbol || "",
    }));
  }}
>
  <Text style={{ fontSize: 22 }}>⇅</Text>
</TouchableOpacity>

            {/* To */}
<Text style={styles.label}>To</Text>
<View style={{ zIndex: 2000 }}>
<DropDownPicker
  open={toOpen}
  value={data.toSymbol}
  items={toItems}
  setOpen={setToOpen}
  setValue={(cb) => setData(p => ({ ...p, toSymbol: cb(p.toSymbol) }))}
  setItems={setToItems}
  listMode="SCROLLVIEW" 
  placeholder="Select"
   style={{
    backgroundColor: "#f3f4f6", // light gray like withdrawal
    borderColor: "#d1d5db",
    borderRadius: 12,
    marginBottom: fromOpen ? 120 : 15,
    height: 50,
  }}
  dropDownContainerStyle={{
    backgroundColor: "#fff", // white dropdown list
    borderColor: "#d1d5db",
    borderRadius: 12,
  }}
  zIndex={2000}
  zIndexInverse={2000}
/>
</View>



            {/* Amount */}
          <Text style={styles.label}>Amount</Text>

<View style={styles.amountRow}>
  <TextInput
    style={styles.amountInput}
    value={data.amount}
    onChangeText={(val) => setData({ ...data, amount: val })}
    placeholder="0.00"
   // keyboardType="numeric"
  />

  <TouchableOpacity
    style={styles.maxButton}
    onPress={() => {
      const bal = wallets[data.fromSymbol] ?? 0;
      setData({ ...data, amount: String(bal) });
    }}
  >
    <Text style={styles.maxText}>MAX</Text>
  </TouchableOpacity>
</View>

           {conversionResult.finalAmount !== null && (
 <Text style={styles.estimate}>
  You will receive: ≈ {formattedBalance(conversionResult.finalAmount ?? 0, data.toSymbol)}
</Text>

)}


{/* User wallet balance display */}
<Text style={{ marginTop: 8, color: "gray" }}>
  Your balance: {formattedBalance(wallets[data.fromSymbol] ?? 0, data.fromSymbol)}
</Text>    
          </View>
        )}


{step === 2 && (
  <View style={styles.stepTwoContainer}>
    {/* Transaction Summary */}
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Transaction Summary</Text>

      <Text style={styles.summaryText}>
  <Text style={styles.summaryLabel}>From: </Text>
  {formattedBalance(data.amount || 0, data.fromSymbol)}
</Text>


     <Text style={styles.summaryText}>
  <Text style={styles.summaryLabel}>To: </Text>
  {formattedBalance(conversionResult.finalAmount ?? 0, data.toSymbol)}
</Text>

     {getPairRateDisplay({
  fromSymbol: data.fromSymbol,
  toSymbol: data.toSymbol,
  livePrices,
  liveNgnUsdt: adminNgnUsdtRate,
  spreadConfig,
}) && (
  <Text style={[styles.summaryText, { color: "#6b7280", fontSize: 13 }]}>
    <Text style={styles.summaryLabel}>Rate: </Text>
    {getPairRateDisplay({
      fromSymbol: data.fromSymbol,
      toSymbol: data.toSymbol,
      livePrices,
      liveNgnUsdt: adminNgnUsdtRate,
      spreadConfig,
    })}
  </Text>
)}

    </View>

    {/* Countdown + PIN */}
    <View style={styles.countdownRow}>
      <Text style={styles.pinLabel}>Enter Transaction PIN</Text>
      <Text
        style={[
          styles.countdownText,
          countdown > 0 ? { color: "#16a34a" } : { color: "#dc2626" },
        ]}
      >
        {countdown > 0 ? `Confirm within ${countdown}s` : "Rate expired"}
      </Text>
    </View>

    <TextInput
      style={[
        styles.pinInput,
        countdown === 0 ? styles.pinInputDisabled : styles.pinInputActive,
      ]}
      secureTextEntry
      maxLength={4}
      keyboardType="numeric"
      value={data.pin}
      onChangeText={(val) => setData({ ...data, pin: val })}
      placeholder="••••"
      editable={countdown > 0}
    />

   
  </View>
)}

      </ScrollableView>

      <View style={styles.stickyButtonContainer}>
  {step === 1 ? (
    <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
      <Text style={styles.btnText}>Preview Swap</Text>
    </TouchableOpacity>
  ) : (
    <View style={styles.buttonRow}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          countdown === 0 || submitting ? styles.disabledButton : null,
        ]}
        disabled={countdown === 0 || submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>
            {countdown === 0 ? "Rate Expired" : "Confirm"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
    
  )}
</View>

       {/* ✅ Place success modal here (inside Provider) */}
    <TransactionSuccessModal
      visible={showSuccess}
      onClose={() => setShowSuccess(false)}
      onViewHistory={() => {
        setShowSuccess(false);
    navigation.navigate("TransactionHistory" as never);
      }}
      title="Conversion Successful"
       message={successMessage}
    />
  </Provider>
);

}
