import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import tw from "@lib/tailwind";
import API from "@lib/api";
import { useForm, Controller } from "react-hook-form";
import { routes } from "@constants/routes";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";

type Bank = { name: string; code: string };
type FormValues = { account_name: string; account_number: string; bank_code: string };

export default function BankAccountsScreen({ navigation }: any) {
  const user = useSelector(selectUser);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankOpen, setBankOpen] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  const { control, handleSubmit, setValue, watch, trigger, reset } = useForm<FormValues>({
    defaultValues: { account_name: "", account_number: "", bank_code: "" },
  });

  const values = watch();

  
  // Fetch user's bank accounts (if available)
 useEffect(() => {
  const accounts = user?.userBankAccounts || [];
  setBankAccounts(accounts);
}, [user]);


/*
useEffect(() => {
  const fetchUserBankAccounts = async () => {
    try {
      const res = await API.get(routes.api.v1.services.wallets.userwallet);
      setBankAccounts(res.data.bank_accounts ?? []);
    } catch (error: any) {
      console.error("Error fetching bank accounts:", error?.response?.data || error?.message);
      Alert.alert("Error", "Failed to load your bank accounts. Please try again.");
    }
  };

  fetchUserBankAccounts();
}, []);
*/

  // Fetch list of banks
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setLoadingBanks(true);
        const res = await API.get(routes.api.v1.bank.userBankAccounts.banklist);
        setBanks(res.data.data || []);
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to load bank list. Please try again.");
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);



  const verifyAccount = useCallback(async () => {
    const valid = await trigger(["account_number", "bank_code"]);
    if (!valid) return;

    setVerifying(true);
    setResolvedAccountName(null);
    setIsVerified(false);

    try {
      const res = await API.post(routes.api.v1.bank.userBankAccounts.accountname, {
        account_number: values.account_number,
        bank_code: values.bank_code,
      });

      if (res.data.is_valid) {
        setResolvedAccountName(res.data.account_name);
        setIsVerified(true);
        setValue("account_name", res.data.account_name);
      } else {
        Alert.alert("Verification Failed", "Could not resolve account name.");
      }
    } catch (error: any) {
// ✅ Log full Axios error for debugging
    console.error("Axios error:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error status:", error.response?.status);
    console.error("Error headers:", error.response?.headers);
      Alert.alert("Error", "Failed to verify account.");
    } finally {
      setVerifying(false);
    }
  }, [values, trigger]);

  const submit = async (data: FormValues) => {
    if (!isVerified) {
      Alert.alert("Verify Account", "Please verify your account before saving.");
      return;
    }

    const bank = banks.find((b) => b.code === data.bank_code);
    if (!bank) {
      Alert.alert("Invalid Bank", "Please select a valid bank.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post(routes.api.v1.bank.userBankAccounts.create, {
    bank_name: bank.name,
    bank_code: bank.code, 
    account_number: data.account_number,
    account_name: resolvedAccountName,
    });
      
      Alert.alert("Success", "Bank account added successfully!");

        setBankAccounts((prev) => [
      {
        bank_name: bank.name,
        account_number: data.account_number,
        account_name: resolvedAccountName,
        id: res.data.id, // optional, if API returns id
      },
      ...prev,
    ]);

      reset();
      setResolvedAccountName(null);
      setIsVerified(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add bank account.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBankAccount = async (accountId: string) => {
  Alert.alert(
    "Confirm Delete",
    "Are you sure you want to delete this bank account?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(routes.api.v1.bank.userBankAccounts.delete.replace(":id", accountId));
            setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
            Alert.alert("Deleted", "Bank account removed successfully.");
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to delete bank account.");
          }
        },
      },
    ]
  );
};

  return (
    <ScrollView style={tw`flex-1 bg-white`} contentContainerStyle={tw`p-5 pt-12`}>
     

      {/* Form Card */}
      <View style={tw`bg-blue-50 rounded-2xl p-5 mb-6 shadow-sm`}>
        <Text style={tw`text-xl font-semibold text-gray-800 mb-4`}>Add Bank Account</Text>

        {/* Account Number */}
        <Controller
          control={control}
          name="account_number"
          rules={{ required: "Account number is required", minLength: 10 }}
          render={({ field: { onChange, value } }) => (
            <View style={tw`mb-4`}>
              <Text style={tw`mb-1 font-semibold text-gray-700`}>Account Number</Text>
              <TextInput
                style={tw`px-4 py-3 bg-white border border-gray-200 rounded-xl`}
                placeholder="Enter account number"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
              />
            </View>
          )}
        />

        {/* Bank Picker */}
        <View style={tw`mb-4`}>
  <Controller
    control={control}
    name="bank_code"
    rules={{ required: "Bank is required" }}
    render={({ field: { onChange, value } }) => (
      <DropDownPicker
        open={bankOpen}
        value={selectedBank?.code ?? null}
        items={banks
          .filter((b) => !!b.code)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((b) => ({ label: b.name, value: b.code }))}
        setOpen={setBankOpen}
        setValue={(callback) => {
          const newCode = callback(selectedBank?.code ?? null);
          const bank = banks.find((b) => b.code === newCode) ?? null;
          setSelectedBank(bank);
          onChange(newCode);
          setResolvedAccountName(null);
          setIsVerified(false);
        }}
        placeholder="Select Bank"
      style={tw`bg-white border border-gray-200 rounded-xl`}
      dropDownContainerStyle={tw`bg-white border border-gray-200 rounded-xl`}
      listMode="MODAL"         // ✅ Use MODAL for overlay + search
      searchable={true}        // ✅ Enable search
      searchPlaceholder="Search bank..."
      modalTitle="Select Bank"  // Optional: title at top of modal
      />
    )}
  />
</View>

        {/*}
        <Controller
          control={control}
          name="bank_code"
          rules={{ required: "Bank is required" }}
          render={({ field: { onChange, value } }) => (
            <View style={tw`mb-4`}>
              <Text style={tw`mb-1 font-semibold text-gray-700`}>Select Bank</Text>
              {loadingBanks ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <View style={tw`bg-white border border-gray-200 rounded-xl`}>
                  <Picker selectedValue={value} onValueChange={onChange}>
                    <Picker.Item label="Select bank" value="" />
                    {banks
                      .filter((b) => !!b.code)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((b) => (
                        <Picker.Item key={b.code} label={b.name} value={b.code} />
                      ))}
                  </Picker>
                </View>
              )}
            </View>
          )}
        />
*/}


        {/* Verify Button */}
        <TouchableOpacity
          style={tw`bg-blue-600 py-3 rounded-xl mb-3`}
          onPress={verifyAccount}
          disabled={verifying}
        >
          <Text style={tw`text-white text-center font-medium`}>
            {verifying ? "Verifying..." : "Verify Account"}
          </Text>
        </TouchableOpacity>

        {resolvedAccountName && (
          <Text style={tw`text-blue-600 font-semibold mb-4`}>
             {resolvedAccountName}
          </Text>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={tw`bg-blue-700 py-3 rounded-xl`}
          onPress={handleSubmit(submit)}
          disabled={submitting}
        >
          <Text style={tw`text-white text-center font-medium`}>
            {submitting ? "Saving..." : "Save Account"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Existing Accounts */}
      {bankAccounts.length > 0 && (
        <View>
          <Text style={tw`text-lg font-semibold text-gray-800 mb-3`}>
            My Bank Accounts
          </Text>
          {bankAccounts.map((acc, index) => (
            <View
              key={index}
              style={tw`bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm flex-row justify-between items-center`}
            >
              <View>
                <Text style={tw`font-medium text-gray-900`}>
                  {acc.bank_name} - {acc.account_number}
                </Text>
                <Text style={tw`text-gray-500`}>{acc.account_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteBankAccount(acc.id)}
                style={tw`bg-red-500 px-3 py-1 rounded-lg`}
              >
                <Text style={tw`text-white font-medium`}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
