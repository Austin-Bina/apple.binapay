import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { Text } from "react-native-paper";
import tw from "@lib/tailwind";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface GridItem {
  id: string | number;
  [key: string]: any;
}

interface ScrollableGridProps<T extends GridItem> {
  // Data and selection
  data: T[];
  selectedItemId?: string | number;
  onSelectItem: (item: T) => void;
  
  // Layout configuration
  itemsPerRow?: number;
  numRows?: number;
  itemWidth?: number;
  itemHeight?: number;
  itemMargin?: number;
  
  // Loading and error states
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  
  // Custom renderers
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: () => React.ReactNode;
  
  // Styling
  containerStyle?: StyleProp<ViewStyle>;
  itemContainerStyle?: StyleProp<ViewStyle>;
  selectedItemStyle?: StyleProp<ViewStyle>;
  paginationContainerStyle?: StyleProp<ViewStyle>;
  paginationDotStyle?: StyleProp<ViewStyle>;
  paginationActiveDotStyle?: StyleProp<ViewStyle>;
  loadingContainerStyle?: StyleProp<ViewStyle>;
  loadingTextStyle?: StyleProp<TextStyle>;
  errorContainerStyle?: StyleProp<ViewStyle>;
  errorTextStyle?: StyleProp<TextStyle>;
  emptyContainerStyle?: StyleProp<ViewStyle>;
  emptyTextStyle?: StyleProp<TextStyle>;
}

function ScrollableGrid<T extends GridItem>({
  // Data and selection
  data = [],
  selectedItemId,
  onSelectItem,
  
  // Layout configuration
  itemsPerRow = 3,
  numRows = 3,
  itemWidth = 100,
  itemHeight = 80,
  itemMargin = 4,
  
  // Loading and error states
  isLoading = false,
  isError = false,
  onRetry = () => {},
  
  // Custom renderers
  renderItem,
  renderEmpty,
  renderLoading,
  renderError,
  
  // Styling
  containerStyle,
  itemContainerStyle,
  selectedItemStyle,
  paginationContainerStyle,
  paginationDotStyle,
  paginationActiveDotStyle,
  loadingContainerStyle,
  loadingTextStyle,
  errorContainerStyle,
  errorTextStyle,
  emptyContainerStyle,
  emptyTextStyle,
}: ScrollableGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Calculate grid dimensions
  const gridWidth = useMemo(() => SCREEN_WIDTH - 32, []);
  
  // Organize data into pages and rows
  const { pages, totalPages } = useMemo(() => {
    const rows = [];
    for (let i = 0; i < data.length; i += itemsPerRow) {
      rows.push(data.slice(i, i + itemsPerRow));
    }

    const pagesArray = [];
    for (let i = 0; i < rows.length; i += numRows) {
      pagesArray.push(rows.slice(i, i + numRows));
    }

    return { pages: pagesArray, totalPages: pagesArray.length };
  }, [data, itemsPerRow, numRows]);

  // Handle scroll events to update current page
  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / gridWidth);
    setCurrentPage(page);
  }, [gridWidth]);

  // Default item renderer
  const defaultRenderItem = useCallback((item: T, isSelected: boolean) => (
    <View style={tw`justify-center items-center`}>
      <Text style={[tw`text-sm font-bold text-gray-800 text-center`, isSelected && tw`text-blue-600`]}>
        {item.title || `Item ${item.id}`}
      </Text>
      {item.subtitle && (
        <Text style={[tw`text-xs text-gray-500 text-center mt-0.5`, isSelected && tw`text-blue-500`]}>
          {item.subtitle}
        </Text>
      )}
    </View>
  ), []);

  // Default loading state renderer
  const defaultRenderLoading = useCallback(() => (
    <View style={[tw`items-center justify-center p-8 bg-gray-50 rounded-xl my-4`, loadingContainerStyle]}>
      <ActivityIndicator size="small" color="#0066cc" />
      <Text style={[tw`mt-3 text-gray-500 text-sm`, loadingTextStyle]}>Loading items...</Text>
    </View>
  ), [loadingContainerStyle, loadingTextStyle]);

  // Default error state renderer
  const defaultRenderError = useCallback(() => (
    <View style={[tw`p-4 bg-red-50 rounded-xl my-4 items-center`, errorContainerStyle]}>
      <Text style={[tw`text-red-700 text-sm mb-2`, errorTextStyle]}>
        Failed to load items. Please try again.
      </Text>
      <TouchableOpacity style={tw`px-4 py-2 bg-red-500 rounded-md`} onPress={onRetry}>
        <Text style={tw`text-white font-bold text-sm`}>Retry</Text>
      </TouchableOpacity>
    </View>
  ), [errorContainerStyle, errorTextStyle, onRetry]);

  // Default empty state renderer
  const defaultRenderEmpty = useCallback(() => (
    <View style={[tw`items-center justify-center p-8 bg-gray-50 rounded-xl my-4`, emptyContainerStyle]}>
      <Text style={[tw`text-gray-500 text-sm`, emptyTextStyle]}>
        No items available
      </Text>
    </View>
  ), [emptyContainerStyle, emptyTextStyle]);

  // Render grid item
  const renderGridItem = useCallback(({ item }: { item: T }) => {
    const isSelected = selectedItemId !== undefined && item.id === selectedItemId;
    
    return (
      <TouchableOpacity
        onPress={() => onSelectItem(item)}
        style={[
          tw`rounded-lg bg-white border border-gray-200 p-1`,
          {
            width: itemWidth,
            height: itemHeight,
            margin: itemMargin,
          },
          itemContainerStyle,
          isSelected && [tw`border-blue-600 bg-blue-50 shadow-sm`, selectedItemStyle],
        ]}
      >
        {renderItem ? renderItem(item, isSelected) : defaultRenderItem(item, isSelected)}
      </TouchableOpacity>
    );
  }, [
    selectedItemId,
    onSelectItem,
    itemWidth,
    itemHeight,
    itemMargin,
    itemContainerStyle,
    selectedItemStyle,
    renderItem,
    defaultRenderItem,
  ]);

  // Render main content
  const renderContent = useCallback(() => {
    if (isLoading) {
      return renderLoading ? renderLoading() : defaultRenderLoading();
    }

    if (isError) {
      return renderError ? renderError() : defaultRenderError();
    }

    if (data.length === 0) {
      return renderEmpty ? renderEmpty() : defaultRenderEmpty();
    }

    return (
      <>
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={pages}
          keyExtractor={(_, index) => `page_${index}`}
          renderItem={({ item: pageRows }) => (
            <View style={{ width: gridWidth, paddingHorizontal: 2 }}>
              {pageRows.map((row, rowIndex) => (
                <View
                  key={`row_${rowIndex}`}
                  style={tw`flex-row justify-start my-0.5`}
                >
                  {row.map((item) => renderGridItem({ item }))}

                  {/* Add empty placeholders if row is not full */}
                  {Array.from({
                    length: itemsPerRow - row.length,
                  }).map((_, i) => (
                    <View
                      key={`empty_${i}`}
                      style={{
                        width: itemWidth,
                        height: itemHeight,
                        margin: itemMargin,
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={tw`py-1`}
          snapToInterval={gridWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          initialNumToRender={2}
          maxToRenderPerBatch={4}
          windowSize={3}
        />

        {/* Page indicators */}
        {totalPages > 1 && (
          <View style={[tw`flex-row justify-center mt-1.5 mb-1`, paginationContainerStyle]}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <View
                key={`indicator_${index}`}
                style={[
                  tw`w-1.5 h-1.5 rounded-full bg-gray-300 mx-0.75`,
                  paginationDotStyle,
                  currentPage === index && [
                    tw`bg-blue-600`,
                    paginationActiveDotStyle,
                  ],
                ]}
              />
            ))}
          </View>
        )}
      </>
    );
  }, [
    isLoading,
    isError,
    data.length,
    pages,
    totalPages,
    currentPage,
    gridWidth,
    itemsPerRow,
    itemWidth,
    itemHeight,
    itemMargin,
    renderLoading,
    renderError,
    renderEmpty,
    defaultRenderLoading,
    defaultRenderError,
    defaultRenderEmpty,
    renderGridItem,
    handleScroll,
    paginationContainerStyle,
    paginationDotStyle,
    paginationActiveDotStyle,
  ]);

  return (
    <View style={[tw`mb-5`, containerStyle]}>
      {renderContent()}
    </View>
  );
}

export default ScrollableGrid;
