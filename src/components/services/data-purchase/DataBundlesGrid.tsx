import React, { useCallback, useImperativeHandle, forwardRef, useRef, useMemo } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatToNaira } from "@utils/money";
import { DataPlan } from "@type/app";
import ScrollableGrid, { ScrollableGridRef } from "@components/ui/scrollable-grid";
import { scale, verticalScale } from "react-native-size-matters";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH  = scale(90);
const CARD_HEIGHT = verticalScale(70);
const CARD_MARGIN = 4;
const NUM_ROWS    = 3;

export interface DataBundlesGridRef {
  resetScroll: () => void;
}

interface DataBundlesGridProps {
  dataPlans: DataPlan[];
  selectedBundle?: number;
  isFetching: boolean;
  isError: boolean;
  onSelectBundle: (plan: DataPlan) => void;
  onRetry: () => void;
}

const DataBundlesGrid = forwardRef<DataBundlesGridRef, DataBundlesGridProps>(({
  dataPlans, selectedBundle, isFetching, isError, onSelectBundle, onRetry,
}, ref) => {
  const scrollableGridRef = useRef<ScrollableGridRef>(null);

  const itemsPerRow = useMemo(() =>
    Math.floor((SCREEN_WIDTH - 40) / (CARD_WIDTH + CARD_MARGIN * 2)), []);

  useImperativeHandle(ref, () => ({
    resetScroll: () => scrollableGridRef.current?.resetScroll(),
  }));

  const getGridHeight = useCallback(() =>
    (CARD_HEIGHT + 5 + CARD_MARGIN * 2) * NUM_ROWS, []);

  const renderDataBundleItem = useCallback((item: DataPlan, isSelected: boolean) => (
    <View style={s.bundleItem}>
      {/* Selection tick */}
      {isSelected && (
        <View style={s.selectedTick}>
          <MaterialCommunityIcons name="check" size={8} color="#fff" />
        </View>
      )}

      <Text style={[s.bundlePlan, isSelected && s.bundlePlanSelected]} numberOfLines={1}>
        {item.plan}
      </Text>
      <Text style={[s.bundleAmount, isSelected && s.bundleAmountSelected]}>
        {formatToNaira(item.plan_amount)}
      </Text>
      <Text style={s.bundleValidity} numberOfLines={1}>
        {item.month_validate}
      </Text>
    </View>
  ), []);

  const renderEmptyState = useCallback(() => (
    <View style={[s.stateWrap, { height: getGridHeight() }]}>
      <View style={s.stateIconWrap}>
        <MaterialCommunityIcons name="wifi-off" size={24} color="#9ca3af" />
      </View>
      <Text style={s.stateTitle}>No bundles available</Text>
      <Text style={s.stateSub}>No data bundles available for the selected type</Text>
    </View>
  ), [getGridHeight]);

  const renderErrorState = useCallback(() => (
    <View style={[s.stateWrap, s.errorWrap, { height: getGridHeight() }]}>
      <View style={[s.stateIconWrap, s.errorIconWrap]}>
        <MaterialCommunityIcons name="wifi-alert" size={24} color="#dc2626" />
      </View>
      <Text style={[s.stateTitle, { color: "#dc2626" }]}>Failed to load plans</Text>
      <Text style={s.stateSub}>We had trouble loading your data plans.</Text>
      <Button
        onPress={onRetry}
        textColor={BLUE}
        style={s.retryBtn}
        labelStyle={s.retryBtnLabel}
      >
        Try again
      </Button>
    </View>
  ), [onRetry, getGridHeight]);

  return (
    <View style={s.wrap}>
      <Text style={s.sectionLabel}>Choose Plan</Text>
      <ScrollableGrid
        ref={scrollableGridRef}
        data={dataPlans.map(plan => ({ ...plan, id: plan.id }))}
        selectedItemId={selectedBundle}
        onSelectItem={onSelectBundle}
        isLoading={isFetching}
        isError={isError}
        onRetry={onRetry}
        renderItem={renderDataBundleItem}
        renderEmpty={renderEmptyState}
        renderError={renderErrorState}
        itemWidth={CARD_WIDTH}
        itemHeight={CARD_HEIGHT}
        itemMargin={CARD_MARGIN}
        itemsPerRow={itemsPerRow}
        numRows={NUM_ROWS}
        containerStyle={s.gridContainer}
        itemContainerStyle={s.itemContainer}
        selectedItemStyle={s.itemSelected}
        paginationDotStyle={s.paginationDot}
        paginationActiveDotStyle={s.paginationActiveDot}
        loadingContainerStyle={s.loadingContainer}
        loadingTextStyle={s.loadingText}
      />
    </View>
  );
});

export default DataBundlesGrid;

const s = StyleSheet.create({
  wrap:          { marginBottom: 12 },
  sectionLabel:  { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 2 },

  // Bundle card item
  bundleItem:          { flex: 1, justifyContent: "center", alignItems: "center", position: "relative" },
  selectedTick:        { position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: BLUE, justifyContent: "center", alignItems: "center", zIndex: 10 },
  bundlePlan:          { fontSize: 12, fontWeight: "700", color: "#111827", textAlign: "center" },
  bundlePlanSelected:  { color: BRAND },
  bundleAmount:        { fontSize: 13, fontWeight: "600", color: "#6b7280", marginTop: 3 },
  bundleAmountSelected:{ color: BLUE },
  bundleValidity:      { fontSize: 11, color: "#9ca3af", marginTop: 2, textAlign: "center" },

  // Grid styles
  gridContainer:       { marginBottom: 4 },
  itemContainer:       { padding: 4, borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", backgroundColor: "#fff" },
  itemSelected:        { backgroundColor: "#EEF3FF", borderColor: BLUE, elevation: 2 },
  paginationDot:       { backgroundColor: "#e5e7eb" },
  paginationActiveDot: { backgroundColor: BLUE },
  loadingContainer:    { backgroundColor: "#f8f9fb", borderRadius: 14 },
  loadingText:         { color: "#9ca3af", marginTop: 10 },

  // Empty / error states
  stateWrap:     { backgroundColor: "#f8f9fb", borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f0f0f0", gap: 6 },
  errorWrap:     { backgroundColor: "#fff5f5", borderColor: "#fee2e2" },
  stateIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  errorIconWrap: { backgroundColor: "#fee2e2" },
  stateTitle:    { fontSize: 14, fontWeight: "700", color: "#374151" },
  stateSub:      { fontSize: 12, color: "#9ca3af", textAlign: "center", paddingHorizontal: 20 },
  retryBtn:      { marginTop: 8, borderRadius: 20, backgroundColor: "#EEF3FF" },
  retryBtnLabel: { fontSize: 13, fontWeight: "600" },
});
