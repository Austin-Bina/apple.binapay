import React from "react";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
import { useSelector } from "react-redux";
import { selectNgnUsdtRateWithSpread, selectCryptoAssets } from "@store/selectors/auth";

import ConvertCrypto from "@screens/services/ConvertCrypto";

export default function ConvertCryptoWrapper() {
  const cryptoAssets = useSelector(selectCryptoAssets);
  const adminNgnUsdtRateWithSpread = useSelector(selectNgnUsdtRateWithSpread);

  // Only render if we have crypto assets and a real rate
  const isLoading =
    !cryptoAssets || cryptoAssets.length === 0 || !adminNgnUsdtRateWithSpread?.buy;

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading data...</Text>
      </View>
    );
  }

  return (
    <ConvertCrypto
      cryptoAssets={cryptoAssets}
      adminNgnUsdtRate={adminNgnUsdtRateWithSpread} // pass full object
      spreadConfig={{
        spreadType: adminNgnUsdtRateWithSpread.spreadType,
        spread: adminNgnUsdtRateWithSpread.spread,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});


/*
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Provider } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { calculateConversion, ConversionResult, getPairRateDisplay } from "../../helpers/crypto-conversion";
import { useNavigation } from "@react-navigation/native";
import API from "@lib/api";
import { routes } from "@constants/routes";
import { Picker } from "@react-native-picker/picker";
import { useDispatch } from "react-redux";
import { authSliceActions } from "@store/slice/auth";
import { navigateToTransaction } from "@helpers/transaction";
import TransactionSuccessModal from "@components/ui/modals/TransactionSuccessModal";
import { formattedBalance } from "@utils/transactionutils";

type CryptoAsset = {
  id: number;
  name: string;
  symbol: string;
  price_usd?: number;
  conversion_enabled: boolean;
  min_conversion: number;
};

type Props = {
  cryptoAssets: CryptoAsset[];
  adminNgnUsdtRate: { buy: number; sell: number } | null; // Now always from Redux
  
};

export default function ConvertCrypto({ cryptoAssets, adminNgnUsdtRate }: Props) {
  const navigation = useNavigation();
  const user = useSelector(selectUser);
/*
  // Map wallet balances from Redux
  const wallets: Record<string, number> = {};
  if (user?.wallet_balances) {
    Object.entries(user.wallet_balances).forEach(([slug, wallet]: any) => {
      const key = slug.toLowerCase() === "naira" ? "ngn" : slug.toLowerCase();
      wallets[key] = Number(wallet.balance);
    });
  }
*/ /*
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    fromSymbol: "ngn",
    toSymbol: "",
    amount: "",
    pin: "",
    
    
  });
  const [conversionResult, setConversionResult] = useState<ConversionResult>({ finalAmount: null, fee: null });
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState<number>(0);
const [rateExpired, setRateExpired] = useState(false);
const dispatch = useDispatch();
const [submitting, setSubmitting] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);
const [successMessage, setSuccessMessage] = useState("");
const [wallets, setWallets] = useState<Record<string, { name: string; balance: string }>>({});
const [walletLoading, setWalletLoading] = useState(true);

  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;


  /**
   * fetch wallets 
   
  useEffect(() => {
  const fetchWallets = async () => {
    try {
      API.defaults.baseURL = BASE_URL;
      const res = await API.get(routes.api.v1.services.wallets.list);
      if (res.data?.wallets) {
        const walletBalances: Record<string, { name: string; balance: string }> = {};
        res.data.wallets.forEach((wallet: any) => {
          const key = wallet.slug.toLowerCase() === "naira" ? "ngn" : wallet.slug.toLowerCase();
          walletBalances[key] = {
            name: wallet.name,
            balance: wallet.balance.toString(),
          };
        });
        setWallets(walletBalances);
      }
    } catch (err) {
      console.log("Error fetching wallets:", err);
      Alert.alert("Error", "Unable to fetch wallet balances. Please try again.");
    } finally {
      setWalletLoading(false);
    }
  };

  fetchWallets();
}, []);



  /** Fetch only crypto prices now 
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



  const getToOptions = () => {
  const from = data.fromSymbol.toLowerCase();

  // ✅ If converting from NGN → show only cryptos
  if (from === "ngn") {
    return cryptoAssets.map((a) => a.symbol.toLowerCase());
  }

  // ✅ If converting from crypto → only NGN allowed
  return ["ngn"];
};

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



  /** Conversion calculation 
  useEffect(() => {
    if (!data.amount || !data.toSymbol || !adminNgnUsdtRate) {
      setConversionResult({ finalAmount: null, fee: null });
      return;
    }

    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      setConversionResult({ finalAmount: null, fee: null });
      return;
    }

    const result = calculateConversion(
      data.fromSymbol,
      data.toSymbol,
      amount,
      livePrices,
      adminNgnUsdtRate // Use Redux rate directly
    );
    setConversionResult(result);
  }, [data.fromSymbol, data.toSymbol, data.amount, livePrices, adminNgnUsdtRate]);

  /** Wallet balance check 
  const checkBalance = (): boolean => {
  const balance = parseFloat(wallets[data.fromSymbol]?.balance ?? "0");
  if (parseFloat(data.amount) > balance) {
    Alert.alert(
      "Insufficient Balance",
      `Your wallet has ${formattedBalance(balance, data.fromSymbol)}, which is less than the amount entered.`
    );
    return false;
  }
  return true;
};


  /**
   * 
   * @returns handle preview swap
   
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
          setConversionResult({ finalAmount: null, fee: null });
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
/*
        if (res.data.success) {
          Alert.alert(
            "Conversion Successful",
            `You received ${res.data.conversion.to_amount} ${data.toSymbol.toUpperCase()}`
          );
          setStep(1);
          setRateExpired(false);
          setData({ fromSymbol: "ngn", toSymbol: "", amount: "", pin: "" });
        } 
          

        if (res.data.success) {
 const receivedAmount = res.data.conversion?.to_amount ?? conversionResult.finalAmount;
setSuccessMessage(`You received ${formattedBalance(receivedAmount ?? 0, data.toSymbol)}.`);
  setShowSuccess(true);
}

        else {
          Alert.alert("Conversion Failed", res.data?.error || "Conversion failed");
        }
      } catch (err: any) {
        let errorMsg = "Unknown error";

        if (err.response) {
          errorMsg = `Server responded with ${err.response.status}: ${JSON.stringify(err.response.data)}`;
        } else if (err.request) {
          errorMsg = `No response received: ${JSON.stringify(err.request)}`;
        } else {
          errorMsg = `Error: ${err.message}`;
        }

        Alert.alert("Conversion Failed", errorMsg);
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
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Buy / Sell Crypto</Text>

        {loading && <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 20 }} />}

       {step === 1 && !loading && data.fromSymbol && data.toSymbol && adminNgnUsdtRate ? (
  <View style={styles.rateBanner}>
    <Text style={styles.rateText}>
      {getPairRateDisplay(data.fromSymbol, data.toSymbol, livePrices, adminNgnUsdtRate)}
    </Text>
  </View>
) : null}


        {step === 1 && (
          <View style={styles.card}>
            {/* From 
           
           <Text style={styles.label}>From</Text>
<Picker
  selectedValue={data.fromSymbol}
  onValueChange={(itemValue) => setData({ ...data, fromSymbol: itemValue })}
  style={styles.picker}
>
  <Picker.Item label="Naira (₦)" value="ngn" />
  {cryptoAssets
    .filter((a) => a.symbol.toLowerCase() !== "ngn")
    .map((a) => (
      <Picker.Item key={a.id} label={a.symbol.toUpperCase()} value={a.symbol.toLowerCase()} />
    ))}
</Picker>

           {/* Swap Icon 
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



            {/* To
<Text style={styles.label}>To</Text>
<Picker
  selectedValue={data.toSymbol}
  onValueChange={(itemValue) => setData({ ...data, toSymbol: itemValue })}
  style={styles.picker}
>
  <Picker.Item label="Select" value="" />
  {getToOptions()
    .filter((sym) => sym !== data.fromSymbol) // avoid same asset
    .map((sym) => (
      <Picker.Item key={sym} label={sym.toUpperCase()} value={sym} />
    ))}
</Picker>



            {/* Amount 
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={data.amount}
              onChangeText={(val) => setData({ ...data, amount: val })}
              placeholder="0.00"
              keyboardType="numeric"
            />

           {conversionResult.finalAmount !== null && (
 <Text style={styles.estimate}>
  You will receive: ≈ {formattedBalance(conversionResult.finalAmount ?? 0, data.toSymbol)}
</Text>

)}


{/* User wallet balance display 
{walletLoading && <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 20 }} />}

<Text style={{ marginTop: 8, color: "gray" }}>
  Your balance: {formattedBalance(parseFloat(wallets[data.fromSymbol]?.balance ?? "0"), data.fromSymbol)}
</Text>



            <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.btnText}>Preview Swap</Text>
            </TouchableOpacity>
          </View>
        )}


{step === 2 && (
  <View style={styles.stepTwoContainer}>
    {/* Transaction Summary 
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

{/*}
      {conversionResult.fee !== null && conversionResult.fee > 0 && (
        <Text style={[styles.summaryText, { color: "#dc2626", fontSize: 13 }]}>
          <Text style={styles.summaryLabel}>Conversion Fee: </Text>
          {conversionResult.fee} {data.toSymbol.toUpperCase()}
        </Text>
      )}

      {getPairRateDisplay(data.fromSymbol, data.toSymbol, livePrices, adminNgnUsdtRate) && (
        <Text style={[styles.summaryText, { color: "#6b7280", fontSize: 13 }]}>
          <Text style={styles.summaryLabel}>Rate: </Text>
          {getPairRateDisplay(data.fromSymbol, data.toSymbol, livePrices, adminNgnUsdtRate)}
        </Text>
      )}
    </View>

    {/* Countdown + PIN 
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

    {/* Buttons 
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
            {countdown === 0 ? "Rate Expired" : "Confirm Conversion"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
)}
      </ScrollView>
       {/* ✅ Place success modal here (inside Provider) 
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

   rateBanner: {
    backgroundColor: "#E0F7FA",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  rateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#00796B",
  },

  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginVertical: 16 },
  subtitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  backBtn: { marginBottom: 12 },
  backText: { color: "#007bff", fontSize: 16 },
  label: { fontSize: 14, fontWeight: "500", marginTop: 12 },
  selector: { width: "100%", justifyContent: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: "#f8f9fa",
  },
  swapIcon: { alignItems: "center", marginVertical: 12 },
  estimate: { marginTop: 8, fontSize: 14, color: "gray" },
  primaryBtn: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
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
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: "center",
  marginRight: 8,
},

backButtonText: {
  color: "#2563eb",
  fontWeight: "600",
  fontSize: 15,
},

confirmButton: {
  flex: 1,
  backgroundColor: "#2563eb",
  borderRadius: 10,
  paddingVertical: 12,
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


});
*/
