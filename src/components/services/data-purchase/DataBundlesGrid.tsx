import React, { useCallback, useImperativeHandle, forwardRef, useRef, useMemo } from "react";
import { View, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import tw from "@lib/tailwind";
import { Check, WifiOff, RefreshCw } from "lucide-react-native";
import { formatToNaira } from "@utils/money";
import { Button } from "react-native-paper";
import { Colors } from "@constants/theme/colors";
import { DataPlan } from "@type/app";
import ScrollableGrid, { ScrollableGridRef } from "@components/ui/scrollable-grid";
import { scale, verticalScale } from "react-native-size-matters";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Calculate grid dimensions based on screen size
const CARD_WIDTH = scale(90);
const CARD_HEIGHT = verticalScale(70);
const CARD_MARGIN = 4;
const NUM_ROWS = 3;

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
  dataPlans,
  selectedBundle,
  isFetching,
  isError,
  onSelectBundle,
  onRetry,
}, ref) => {
  const theme = useTheme();
  const scrollableGridRef = useRef<ScrollableGridRef>(null);

  // Calculate items per row based on screen width
  const itemsPerRow = useMemo(() => 
    Math.floor((SCREEN_WIDTH - 40) / (CARD_WIDTH + CARD_MARGIN * 2)),
    []
  );

  // Expose resetScroll method to parent component
  useImperativeHandle(ref, () => ({
    resetScroll: () => {
      scrollableGridRef.current?.resetScroll();
    }
  }));

  // Custom renderItem function to maintain the same appearance
  const renderDataBundleItem = useCallback((item: DataPlan, isSelected: boolean) => (
    <View style={tw`flex-1 justify-center relative`}>
      {/* Selection indicator */}
      {isSelected && (
        <View
          style={tw`absolute top-0 right-0 z-10 bg-primary rounded-full p-0.5`}
        >
          <Check size={8} color="white" />
        </View>
      )}

      {/* Content */}
      <Text
        style={tw`text-xs font-bold text-gray-800 text-center`}
        numberOfLines={1}
      >
        {item.plan}
      </Text>

      <View style={tw`flex-row items-center justify-center mt-1`}>
        <Text style={tw`text-gray-600 text-sm`}>
          {formatToNaira(item.plan_amount)}
        </Text>
      </View>

      <Text
        style={tw`text-gray-500 text-xs text-center mt-0.5`}
        numberOfLines={1}
      >
        {item.month_validate}
      </Text>
    </View>
  ), []);

  const getGridHeight = useCallback(() => 
    (CARD_HEIGHT + 5 + CARD_MARGIN * 2) * NUM_ROWS,
    []
  );

  // Custom empty state
  const renderEmptyState = useCallback(() => (
    <View style={[tw`bg-gray-50 rounded-xl items-center justify-center`, { height: getGridHeight() }]}>
      <WifiOff size={28} color={tw.color("gray-500")} />
      <Text style={tw`mt-3 text-gray-500 text-center font-medium`}>
        No data bundles available for the selected type
      </Text>
    </View>
  ), [getGridHeight]);

  // Custom error state
  const renderErrorState = useCallback(() => (
    <View style={[tw`bg-red-50 rounded-xl items-center justify-center`, { height: getGridHeight() }]}>
      <View style={tw`flex-row items-center`}>
        <RefreshCw size={20} color={tw.color("red-500")} />
        <View style={tw`ml-2 flex-1`}>
          <Text variant="bodySmall" style={tw`text-red-600 mb-1`}>
            We had trouble loading your data plans. Please try again.
          </Text>
          <Button
            onPress={onRetry}
            textColor={Colors.primary[500]}
            style={tw`self-start p-0 m-0`}
          >
            Try again
          </Button>
        </View>
      </View>
    </View>
  ), [onRetry, getGridHeight]);

  return (
    <View style={tw`mb-3`}>
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
        containerStyle={tw`mb-3`}
        itemContainerStyle={[
          tw`p-1 rounded-lg shadow-sm border relative`,
        ]}
        selectedItemStyle={{
          backgroundColor: theme.colors.primaryContainer,
          borderColor: theme.colors.primary,
          elevation: 2,
        }}
        paginationDotStyle={{
          backgroundColor: tw.color("gray-300"),
        }}
        paginationActiveDotStyle={{
          backgroundColor: theme.colors.primary,
        }}
        loadingContainerStyle={tw`bg-gray-50 rounded-xl`}
        loadingTextStyle={tw`text-gray-500 mt-3`}
      />
    </View>
  );
});

export default DataBundlesGrid;
