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
import { Picker } from "@react-native-picker/picker";
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
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

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
        const res = await API.get(routes.api.v1.bank.list);
        setBanks(res.data.banks || []);
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
      const res = await API.post(routes.api.v1.bank.resolveAccount, {
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
    } catch (error) {
      console.error(error);
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
    <ScrollView contentContainerStyle={tw`p-4 bg-white min-h-full`}>
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mb-4`}>
        <Text style={tw`text-blue-600`}>← Back</Text>
      </TouchableOpacity>

      {/* Alerts */}
      {alert && (
        <View
          style={tw.style(
            `p-3 rounded mb-4`,
            alert.type === "success" && "bg-green-100",
            alert.type === "error" && "bg-red-100",
            alert.type === "warning" && "bg-yellow-100"
          )}
        >
          <Text style={tw`text-sm`}>{alert.message}</Text>
        </View>
      )}

      {/* Account Number */}
      <Controller
        control={control}
        name="account_number"
        rules={{ required: "Account number is required", minLength: 10 }}
        render={({ field: { onChange, value } }) => (
          <View style={tw`mb-4`}>
            <Text style={tw`mb-1 font-semibold`}>Account Number</Text>
            <TextInput
              style={tw`border rounded p-2`}
              placeholder="Enter account number"
              keyboardType="numeric"
              value={value}
              onChangeText={onChange}
            />
          </View>
        )}
      />

      {/* Bank Picker */}
      <Controller
        control={control}
        name="bank_code"
        rules={{ required: "Bank is required" }}
        render={({ field: { onChange, value } }) => (
          <View style={tw`mb-4`}>
            <Text style={tw`mb-1 font-semibold`}>Select Bank</Text>
            {loadingBanks ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Picker selectedValue={value} onValueChange={onChange} style={tw`border rounded`}>
                <Picker.Item label="Select bank" value="" />
                {banks
                  .filter((b) => !!b.code)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((b) => (
                    <Picker.Item key={b.code} label={b.name} value={b.code} />
                  ))}
              </Picker>
            )}
          </View>
        )}
      />

      {/* Verify Button */}
      <TouchableOpacity
        style={tw`bg-blue-600 py-3 rounded mb-3`}
        onPress={verifyAccount}
        disabled={verifying}
      >
        <Text style={tw`text-white text-center`}>
          {verifying ? "Verifying..." : "Verify Account"}
        </Text>
      </TouchableOpacity>

      {resolvedAccountName && (
        <Text style={tw`text-green-600 font-medium mb-4`}>
          ✅ {resolvedAccountName}
        </Text>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={tw`bg-green-600 py-3 rounded`}
        onPress={handleSubmit(submit)}
        disabled={submitting}
      >
        <Text style={tw`text-white text-center`}>
          {submitting ? "Saving..." : "Save Account"}
        </Text>
      </TouchableOpacity>

      {/* Existing accounts */}
      {bankAccounts.length > 0 && (
        <View style={tw`mt-6`}>
          <Text style={tw`text-lg font-semibold mb-2`}>My Bank Accounts</Text>
         
         {bankAccounts.map((acc, index) => (
  <View key={index} style={tw`border rounded p-3 mb-2 flex-row justify-between items-center`}>
    <View>
      <Text style={tw`font-medium`}>
        {acc.bank_name} - {acc.account_number}
      </Text>
      <Text style={tw`text-gray-600`}>{acc.account_name}</Text>
    </View>
    <TouchableOpacity
      onPress={() => deleteBankAccount(acc.id)}
      style={tw`bg-red-600 px-3 py-1 rounded`}
    >
      <Text style={tw`text-white`}>Delete</Text>
    </TouchableOpacity>
  </View>
))}

        </View>
      )}

      <View style={tw`mt-6`}>
        <Text style={tw`text-gray-600`}>
          Add your bank account so you can withdraw funds seamlessly.
        </Text>
      </View>
    </ScrollView>
  );
}
