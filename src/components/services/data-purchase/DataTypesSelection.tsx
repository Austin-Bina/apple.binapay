import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Modal, Dimensions, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type DataType = { id: string; label: string };

interface DataTypesSelectionProps {
  dataTypes: DataType[];
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const MAX_DISPLAY_ITEMS = 4;

const DataTypesSelection = ({ dataTypes, selectedType, onTypeSelect }: DataTypesSelectionProps) => {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal]       = useState(false);
  const [scrollRef, setScrollRef]       = useState<ScrollView | null>(null);

  const reorderedDataTypes = useMemo(() => {
    if (!selectedType || !dataTypes.length) return dataTypes;
    const selected = dataTypes.find(t => t.id === selectedType);
    if (!selected) return dataTypes;
    return [selected, ...dataTypes.filter(t => t.id !== selectedType)];
  }, [dataTypes, selectedType]);

  const displayTypes  = useMemo(() => reorderedDataTypes.slice(0, MAX_DISPLAY_ITEMS), [reorderedDataTypes]);
  const hasMoreTypes  = reorderedDataTypes.length > MAX_DISPLAY_ITEMS;

  useEffect(() => {
    if (scrollRef && selectedType) {
      setTimeout(() => scrollRef.scrollTo({ x: 0, animated: true }), 100);
    }
  }, [selectedType, scrollRef]);

  const renderTab = useCallback((type: DataType) => {
    const isActive = selectedType === type.id;
    return (
      <TouchableOpacity
        key={type.id}
        onPress={() => onTypeSelect(type.id)}
        style={[s.tab, isActive && s.tabActive]}
        activeOpacity={0.75}
      >
        {isActive && (
          <MaterialCommunityIcons name="check-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
        )}
        <Text style={[s.tabText, isActive && s.tabTextActive]} numberOfLines={1}>
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedType, onTypeSelect]);

  if (!dataTypes.length) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.sectionLabel}>Plan Type</Text>

      <ScrollView
        ref={setScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsContent}
      >
        {displayTypes.map(renderTab)}

        {hasMoreTypes && (
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={s.moreBtn}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="filter-variant" size={14} color="#6b7280" />
            <Text style={s.moreBtnText}>More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── All types modal ── */}
      <Portal>
        <Modal
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
          transparent
          animationType="slide"
        >
          <View style={s.modalOverlay}>
            <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
              {/* Handle */}
              <View style={s.sheetHandle} />

              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>Data Types</Text>
                  <Text style={s.modalSub}>Select a data type to continue</Text>
                </View>
                <TouchableOpacity style={s.closeBtn} onPress={() => setShowModal(false)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="close" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={s.modalGrid}
                showsVerticalScrollIndicator={false}
              >
                {reorderedDataTypes.map((type) => {
                  const isActive = selectedType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => { onTypeSelect(type.id); setShowModal(false); }}
                      style={[s.modalChip, isActive && s.modalChipActive]}
                      activeOpacity={0.75}
                    >
                      {isActive && (
                        <MaterialCommunityIcons name="check-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[s.modalChipText, isActive && s.modalChipTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

export default React.memo(DataTypesSelection);

const s = StyleSheet.create({
  wrap:         { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginLeft: 2 },

  // Tabs
  tabsContent:  { paddingHorizontal: 2, gap: 8, alignItems: "center" },
  tab:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  tabActive:    { backgroundColor: BLUE, borderColor: BLUE },
  tabText:      { fontSize: 13, fontWeight: "600", color: "#374151" },
  tabTextActive:{ color: "#fff" },

  moreBtn:      { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  moreBtnText:  { fontSize: 13, fontWeight: "600", color: "#6b7280" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet:   { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, maxHeight: "75%" },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 18 },
  modalHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  modalTitle:   { fontSize: 17, fontWeight: "700", color: BRAND },
  modalSub:     { fontSize: 12, color: "#6b7280", marginTop: 2 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },

  modalGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 10 },
  modalChip:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", minWidth: 110 },
  modalChipActive:    { backgroundColor: BLUE, borderColor: BLUE },
  modalChipText:      { fontSize: 14, fontWeight: "500", color: "#374151" },
  modalChipTextActive:{ color: "#fff" },
});
