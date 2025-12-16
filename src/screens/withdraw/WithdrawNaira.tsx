import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { Button, RadioButton } from "react-native-paper";
import tw from "@lib/tailwind";
import API from "@lib/api";
import EnterOtpModal from "@components/ui/modals/EnterOtpModal";
import { routes } from "@constants/routes";
import { useSelector } from "react-redux";
import { selectNairaBalance } from "@store/selectors/auth";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { formattedBalance } from "@utils/transactionutils";
import { SCREENS } from "@constants/screens";
import DropDownPicker from "react-native-dropdown-picker";

type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
};

const WithdrawNairaScreen = ({ navigation }: any) => {
  // ✅ Get Naira wallet balance directly from Redux
  const walletBalance = useSelector(selectNairaBalance);
    const dispatch = useTypedDispatch();

  const [userBankAccounts, setUserBankAccounts] = useState<BankAccount[]>([]);
  const [feeType, setFeeType] = useState<"flat" | "percent">("flat");
  const [feeAmount, setFeeAmount] = useState(0);
  const [minWithdrawal, setMinWithdrawal] = useState(0);
  const [maxWithdrawal, setMaxWithdrawal] = useState(0);
  const [data, setData] = useState({ amount: "" });
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [fee, setFee] = useState(0);
  const [amountToReceive, setAmountToReceive] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);


  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  // ✅ Fetch only the withdrawal settings + user bank accounts
  const fetchWithdrawalSettings = async () => {
    try {
      API.defaults.baseURL = BASE_URL;

      const res = await API.get(routes.api.v1.services.wallets.userwallet);

      const walletData = res.data;
      setUserBankAccounts(walletData.bank_accounts ?? []);
      setFeeType(walletData.fee_type ?? "flat");
      setFeeAmount(walletData.fee_amount ?? 0);
      setMinWithdrawal(walletData.min_withdrawal ?? 0);
      setMaxWithdrawal(walletData.max_withdrawal ?? 0);

    } catch (error: any) {
      console.error("Error fetching withdrawal settings:", error?.response?.data || error?.message);
      Alert.alert(
        "Network Error",
        "Unable to fetch withdrawal settings. Please check your connection."
      );
    }
  };

  // ✅ Fetch only once (you don’t need to fetch wallet balance anymore)
  useEffect(() => {
    fetchWithdrawalSettings();
  }, []);

  // ✅ Calculate fee and validate
  useEffect(() => {
    const amount = parseFloat(data.amount);
    if (!isNaN(amount) && amount > 0) {
      const calculatedFee =
        feeType === "percent" ? (amount * feeAmount) / 100 : feeAmount;
      setFee(calculatedFee);
      setAmountToReceive(amount - calculatedFee);

      if (amount < minWithdrawal)
        setLocalError(`Minimum withdrawal is ₦${minWithdrawal}`);
      else if (maxWithdrawal && amount > maxWithdrawal)
        setLocalError(`Maximum withdrawal is ₦${maxWithdrawal}`);
      else if (amount > parseFloat(walletBalance))
        setLocalError("Insufficient balance");
      else setLocalError(null);
    } else {
      setFee(0);
      setAmountToReceive(0);
    }
  }, [data.amount, feeAmount, feeType, minWithdrawal, maxWithdrawal, walletBalance]);

  const handleSelectAccount = (acc: BankAccount) => {
    setSelectedAccount(acc);
    setLocalError(null);
  };

  return (
    <ScrollView contentContainerStyle={tw`p-4 bg-white flex-1`}>
      <View style={tw`bg-white rounded-3xl shadow-lg p-4`}>
        {/* Step Indicator */}
        <View style={tw`flex-row justify-center mb-4`}>
          <View style={[tw`w-3 h-3 rounded-full mx-1`, step === 1 ? tw`bg-blue-600` : tw`bg-gray-300`]} />
          <View style={[tw`w-3 h-3 rounded-full mx-1`, step === 2 ? tw`bg-blue-600` : tw`bg-gray-300`]} />
        </View>

        <Text style={tw`text-xl font-bold mb-4 text-center`}>Naira Withdrawal</Text>

        {/* STEP 1 */}
        {step === 1 && (
          <View>
           <Text style={tw`text-gray-600 mb-2 text-center`}>
       Available Balance:{" "}
      <Text style={tw`font-semibold`}>
       {formattedBalance(walletBalance, "NGN")}
      </Text>
       </Text>


            {/* Amount Input + MAX Button */}
<View
  style={tw`flex-row items-center border rounded-xl mb-3 bg-white`}
>
  <TextInput
    placeholder="Enter amount"
    keyboardType="numeric"
    value={data.amount}
    onChangeText={(text) => setData({ amount: text })}
    style={tw`flex-1 p-3`}
  />

  {/* MAX BUTTON */}
  <TouchableOpacity
    onPress={() => {
      setData({ amount: String(walletBalance) });
    }}
    style={tw`px-3 py-2 mr-3 bg-blue-600 rounded-lg`}
  >
    <Text style={tw`text-white font-semibold`}>MAX</Text>
  </TouchableOpacity>
</View>


            {localError && (
              <Text style={tw`text-red-500 mb-3 text-center`}>{localError}</Text>
            )}

           {parseFloat(data.amount) > 0 && !localError && (
  <View style={tw`bg-gray-50 rounded-xl p-4 mb-4`}>
    <Text style={tw`mb-1`}>
      Fee {feeType === "percent" ? `${feeAmount}%` : ""}: {formattedBalance(fee, "NGN")}
    </Text>
    <Text style={tw`font-medium`}>
      You will receive: {formattedBalance(amountToReceive, "NGN")}
    </Text>
  </View>
)}


           <Button
  mode="contained"
  onPress={() => {
    // ✅ Validate fee before proceeding
    if (!fee || fee <= 0) {
      setLocalError("Fee cannot be empty.");
      return;
    }

    // ✅ If no errors, proceed to Step 2
    setLocalError(null);
    setStep(2);
  }}
  disabled={!!localError || parseFloat(data.amount) <= 0}
  style={tw`py-3 rounded-2xl`}
>
  Proceed
</Button>

          </View>
        )}

       {/* STEP 2 */}
{/* STEP 2 */}
{step === 2 && (
  <View style={{ zIndex: 3000 }}>
    <Text style={tw`text-lg font-semibold mb-3 text-gray-800`}>
      Select Bank Account
    </Text>

    {/* If there are accounts show dropdown, otherwise show the empty state */}
    {userBankAccounts.length > 0 ? (
      <>
        <DropDownPicker
          open={accountOpen}
          value={selectedAccount ? selectedAccount.id : null}
          items={userBankAccounts.map((acc) => ({
            label: `${acc.bank_name} - ${acc.account_number} (${acc.account_name})`,
            value: acc.id,
          }))}
          setOpen={setAccountOpen}
          setValue={(callback) => {
            // callback receives current value (like cb(prevValue) -> newValue)
            // to support DropDownPicker functional setter we call it with current id
            const newId = callback(selectedAccount?.id ?? null);
            const acc = userBankAccounts.find((a) => a.id === newId) ?? null;
            setSelectedAccount(acc);
            // clear any previous local error
            setLocalError(null);
          }}
          placeholder="Select Bank Account"
          style={tw`bg-gray-100 border-gray-300 rounded-lg mb-4`}
          dropDownContainerStyle={tw`bg-white border-gray-300 rounded-lg`}
          listMode="SCROLLVIEW"
          zIndex={3000}
        />

        {/* Summary */}
        <View style={tw`bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4`}>
          <Text>Amount: {formattedBalance(data.amount, "NGN")}</Text>
          <Text>Fee: {formattedBalance(fee, "NGN")}</Text>
          <Text style={tw`font-semibold`}>
            You will receive: {formattedBalance(amountToReceive, "NGN")}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={() => {
            if (!selectedAccount) {
              setLocalError("Please select a bank account.");
              return;
            }
            setLocalError(null);
            setStep(1); // your original flow set step back to 1 before showing OTP
            setShowOtpModal(true);
          }}
          disabled={!selectedAccount}
          style={tw`py-3 rounded-2xl mb-3`}
        >
          Continue
        </Button>

        <Button
          mode="outlined"
          onPress={() => setStep(1)}
          style={tw`py-3 rounded-2xl`}
        >
          ← Back to Amount
        </Button>
      </>
    ) : (
      // No accounts: keep same UX as before
      <View style={tw`mb-4 p-4 bg-gray-100 rounded-xl`}>
        <Text style={tw`text-gray-500 mb-2`}>
          You don’t have a bank account yet.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate(SCREENS.BANK_ACCOUNTS)}
        >
          + Add Bank Account
        </Button>
      </View>
    )}
  </View>
)}
      {showOtpModal && selectedAccount && (
       <EnterOtpModal
  amount={data.amount}
  bankAccount={selectedAccount}
  visible={showOtpModal}
  onClose={() => setShowOtpModal(false)}
  onSuccessRedirect={async () => {
    // ✅ Fetch latest user profile after successful withdrawal
    await dispatch(authSliceActions.fetchUserProfile());
    navigation.navigate("Dashboard");
  }}
/>
      )}
      </View>
    </ScrollView>
  );
};

export default WithdrawNairaScreen;
