import React, { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import tw from "@lib/tailwind";
import { Check, WifiOff, RefreshCw } from "lucide-react-native";
import { scale, verticalScale } from "react-native-size-matters";
import { formatToNaira } from "@utils/money";
import { Button } from "react-native-paper";
import { Colors } from "@constants/theme/colors";
import { DataPlan } from "@type/app";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Calculate grid dimensions based on screen size
const CARD_WIDTH = scale(90);
const CARD_HEIGHT = verticalScale(70);
const CARD_MARGIN = 4;
const VISIBLE_CARDS_PER_ROW = Math.floor(
  (SCREEN_WIDTH - 40) / (CARD_WIDTH + CARD_MARGIN * 2)
);
const GRID_ROWS = 3;

interface DataBundlesGridProps {
  dataPlans: DataPlan[];
  selectedBundle?: number;
  isFetching: boolean;
  isError: boolean;
  onSelectBundle: (plan: DataPlan) => void;
  onRetry: () => void;
}

const DataBundlesGrid = ({
  dataPlans,
  selectedBundle,
  isFetching,
  isError,
  onSelectBundle,
  onRetry,
}: DataBundlesGridProps) => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(0);

  const renderDataBundleItem = useCallback(
    ({ item }: { item: DataPlan }) => (
      <TouchableOpacity
        onPress={() => onSelectBundle(item)}
        style={[
          tw`p-2 rounded-lg shadow-sm border relative`,
          {
            backgroundColor:
              selectedBundle === item.id
                ? theme.colors.primaryContainer
                : tw.color("white"),
            borderColor:
              selectedBundle === item.id
                ? theme.colors.primary
                : tw.color("gray-200"),
            elevation: selectedBundle === item.id ? 2 : 0,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            margin: CARD_MARGIN,
          },
        ]}
      >
        {/* Selection indicator */}
        {selectedBundle === item.id && (
          <View
            style={tw`absolute top-1 right-1 z-10 bg-primary rounded-full p-0.5`}
          >
            <Check size={8} color="white" />
          </View>
        )}

        {/* Content */}
        <View style={tw`flex-1 justify-center`}>
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
      </TouchableOpacity>
    ),
    [selectedBundle, theme, onSelectBundle]
  );

  const renderDataBundlesGrid = useCallback(() => {
    if (dataPlans.length === 0) {
      if (isFetching) {
        return (
          <View style={tw`items-center py-8 my-4 bg-gray-50 rounded-xl`}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={tw`text-gray-500 mt-3`}>Loading data bundles...</Text>
          </View>
        );
      }

      if (isError) {
        return (
          <View style={tw`bg-red-50 p-4 rounded-xl my-4 flex-row items-center`}>
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
        );
      }

      return (
        <View style={tw`bg-gray-50 p-6 rounded-xl items-center my-4`}>
          <WifiOff size={28} color={tw.color("gray-500")} />
          <Text style={tw`mt-3 text-gray-500 text-center font-medium`}>
            No data bundles available for the selected type
          </Text>
        </View>
      );
    }

    const rows = [];
    for (let i = 0; i < dataPlans.length; i += VISIBLE_CARDS_PER_ROW) {
      rows.push(dataPlans.slice(i, i + VISIBLE_CARDS_PER_ROW));
    }

    const pages = [];
    for (let i = 0; i < rows.length; i += GRID_ROWS) {
      pages.push(rows.slice(i, i + GRID_ROWS));
    }

    const handleScroll = (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / (SCREEN_WIDTH - 32));
      setCurrentPage(page);
    };

    return (
      <>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-gray-500 text-xs`}>Swipe to view more</Text>
        </View>

        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={pages}
          keyExtractor={(_, index) => `page_${index}`}
          renderItem={({ item: pageRows }) => (
            <View style={{ width: SCREEN_WIDTH - 32, paddingHorizontal: 2 }}>
              {pageRows.map((row, rowIndex) => (
                <View
                  key={`row_${rowIndex}`}
                  style={tw`flex-row justify-start my-0.5`}
                >
                  {row.map((item) => renderDataBundleItem({ item }))}

                  {/* Add empty placeholders if row is not full */}
                  {Array.from({
                    length: VISIBLE_CARDS_PER_ROW - row.length,
                  }).map((_, i) => (
                    <View
                      key={`empty_${i}`}
                      style={{
                        width: CARD_WIDTH,
                        height: CARD_HEIGHT,
                        margin: CARD_MARGIN,
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={tw`py-1`}
          snapToInterval={SCREEN_WIDTH - 32}
          snapToAlignment="start"
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          initialNumToRender={2}
          maxToRenderPerBatch={4}
          windowSize={3}
        />

        {/* Page indicators */}
        {pages.length > 1 && (
          <View style={tw`flex-row justify-center mt-1.5 mb-1`}>
            {pages.map((_, index) => (
              <View
                key={`indicator_${index}`}
                style={[
                  tw`mx-1 rounded-full`,
                  {
                    width: 4,
                    height: 4,
                    backgroundColor:
                      currentPage === index
                        ? theme.colors.primary
                        : tw.color("gray-300"),
                  },
                ]}
              />
            ))}
          </View>
        )}
      </>
    );
  }, [
    dataPlans,
    currentPage,
    isFetching,
    isError,
    theme,
    onRetry,
    renderDataBundleItem,
  ]);

  return <View style={tw`mb-5`}>{renderDataBundlesGrid()}</View>;
};

export default DataBundlesGrid;
