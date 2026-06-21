import React, { useState, useCallback, useMemo } from "react";
import {
  View, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Pressable,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Controller, Control, UseFormReset, UseFormWatch } from "react-hook-form";
import MaskedInput from "@components/ui/form/mask-input";
import { phone_mask } from "@constants/app";
import { AvatarImage } from "@components/avatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

interface NetworkPhoneInputProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  reset: UseFormReset<any>;
  dataProviders: any[];
  onOpenContactModal: () => void;
}

const NetworkPhoneInput = ({
  control, watch, reset, dataProviders, onOpenContactModal,
}: NetworkPhoneInputProps) => {
  const values  = watch();
  const insets  = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);

  const selectedProvider = useMemo(() =>
    dataProviders.find(p => p.serviceId === values.provider),
  [dataProviders, values.provider]);

  const handleNetworkChange = useCallback((serviceId: string) => {
    reset({
      ...values,
      provider: serviceId,
      data_bundle: undefined,
      data_amount: "",
      amount: "0",
      type: "",
      vendor: "",
    });
    setShowModal(false);
  }, [values, reset]);

  return (
    <View style={s.wrap}>
      <Text style={s.sectionLabel}>Network & Phone</Text>

      <View style={s.card}>
        {/* Network selector row */}
        <Pressable style={s.networkRow} onPress={() => setShowModal(true)}>
          <View style={s.networkLogoWrap}>
            {selectedProvider ? (
              <AvatarImage avatar={selectedProvider.logo} size={36} />
            ) : (
              <MaterialCommunityIcons name="signal-cellular-outline" size={20} color="#9ca3af" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.networkLabel}>Network</Text>
            <Text style={[s.networkName, !selectedProvider && { color: "#9ca3af" }]}>
              {selectedProvider ? selectedProvider.name : "Select network"}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
        </Pressable>

        <View style={s.divider} />

        {/* Phone input row */}
        <View style={s.phoneRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.networkLabel}>Phone Number</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <MaskedInput
                  mask={phone_mask}
                  placeholder="Enter phone number"
                  mode="flat"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!error}
                  errorMessage={error?.message}
                  style={s.phoneInput}
                  
                />
              )}
            />
          </View>
          <TouchableOpacity style={s.contactBtn} onPress={onOpenContactModal} activeOpacity={0.7}>
            <MaterialCommunityIcons name="contacts-outline" size={20} color={BLUE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Network picker bottom sheet ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={s.sheetHandle} />

            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Select Network</Text>
                <Text style={s.modalSub}>Your network will show only available plans</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={() => setShowModal(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {dataProviders.length === 0 ? (
                <View style={s.emptyWrap}>
                  <MaterialCommunityIcons name="wifi-off" size={28} color="#9ca3af" />
                  <Text style={s.emptyText}>No networks found</Text>
                </View>
              ) : (
                dataProviders.map((provider, i) => {
                  const isSelected = values.provider === provider.serviceId;
                  return (
                    <TouchableOpacity
                      key={provider.serviceId}
                      style={[
                        s.providerRow,
                        i < dataProviders.length - 1 && s.providerRowBorder,
                        isSelected && s.providerRowActive,
                      ]}
                      onPress={() => handleNetworkChange(provider.serviceId)}
                      activeOpacity={0.7}
                    >
                      <View style={s.providerLogo}>
                        <AvatarImage avatar={provider.logo} size={40} />
                      </View>
                      <Text style={[s.providerName, isSelected && s.providerNameActive]}>
                        {provider.name}
                      </Text>
                      {isSelected && (
                        <View style={s.selectedTick}>
                          <MaterialCommunityIcons name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Security note */}
            <View style={s.secureNote}>
              <MaterialCommunityIcons name="shield-check-outline" size={13} color="#9ca3af" />
              <Text style={s.secureText}>Your network will be used to show only available data plans.</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default React.memo(NetworkPhoneInput);

const s = StyleSheet.create({
  wrap:         { marginBottom: 16, marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 2 },

  // Main card
  card:         { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  divider:      { height: 1, backgroundColor: "#f3f4f6", marginLeft: 16 },

  // Network row
  networkRow:   { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  networkLogoWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  networkLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 2 },
  networkName:  { fontSize: 14, fontWeight: "600", color: "#111827" },

  // Phone row
  phoneRow:     { flexDirection: "row", alignItems: "center", paddingLeft: 14, paddingRight: 8, paddingVertical: 4 },
  phoneInput:   { flex: 1, fontSize: 14, backgroundColor: "transparent", paddingHorizontal: 0, height: 48 },
  contactBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },

  // Bottom sheet modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet:   { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, maxHeight: "70%" },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 18 },
  modalHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  modalTitle:   { fontSize: 17, fontWeight: "700", color: BRAND },
  modalSub:     { fontSize: 12, color: "#6b7280", marginTop: 2 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },

  // Provider list
  providerRow:       { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 4 },
  providerRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  providerRowActive: { backgroundColor: "#EEF3FF", borderRadius: 12, paddingHorizontal: 8 },
  providerLogo:      { width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: "#f3f4f6" },
  providerName:      { flex: 1, fontSize: 15, fontWeight: "500", color: "#111827" },
  providerNameActive:{ color: BLUE, fontWeight: "700" },
  selectedTick:      { width: 26, height: 26, borderRadius: 13, backgroundColor: BLUE, justifyContent: "center", alignItems: "center" },

  // Empty state
  emptyWrap:    { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText:    { fontSize: 14, color: "#9ca3af" },

  // Secure note
  secureNote:   { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingTop: 14 },
  secureText:   { fontSize: 11, color: "#9ca3af", flex: 1 },
});
