import React, { useState, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
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

export interface ScrollableGridRef {
  resetScroll: () => void;
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

const ScrollableGrid = forwardRef<ScrollableGridRef, ScrollableGridProps<any>>((
  {
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
  },
  ref
) => {
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    resetScroll: () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      setCurrentPage(0);
    }
  }));
  
  // Calculate grid dimensions
  const gridWidth = useMemo(() => SCREEN_WIDTH - 32, []);
  
  // Calculate content height once
  const getContentHeight = useCallback(() => {
    return numRows * (itemHeight + 5 + itemMargin * 2);
  }, [numRows, itemHeight, itemMargin]);

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
  const defaultRenderItem = useCallback((item: any, isSelected: boolean) => (
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
  const defaultRenderLoading = useCallback(() => {
    return (
      <View style={[
        tw`items-center justify-center bg-gray-50 rounded-xl`,
        { height: getContentHeight() },
        loadingContainerStyle
      ]}>
        <ActivityIndicator size="small" color="#0066cc" />
        <Text style={[tw`mt-3 text-gray-500 text-sm`, loadingTextStyle]}>Loading items...</Text>
      </View>
    );
  }, [loadingContainerStyle, loadingTextStyle, getContentHeight]);

  // Default error state renderer
  const defaultRenderError = useCallback(() => {
    return (
      <View style={[
        tw`bg-red-50 rounded-xl items-center justify-center`,
        { height: getContentHeight() },
        errorContainerStyle
      ]}>
        <Text style={[tw`text-red-700 text-sm mb-2`, errorTextStyle]}>
          Failed to load items. Please try again.
        </Text>
        <TouchableOpacity style={tw`px-4 py-2 bg-red-500 rounded-md`} onPress={onRetry}>
          <Text style={tw`text-white font-bold text-sm`}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }, [errorContainerStyle, errorTextStyle, onRetry, getContentHeight]);

  // Default empty state renderer
  const defaultRenderEmpty = useCallback(() => {
    return (
      <View style={[
        tw`items-center justify-center bg-gray-50 rounded-xl`,
        { height: getContentHeight() },
        emptyContainerStyle
      ]}>
        <Text style={[tw`text-gray-500 text-sm`, emptyTextStyle]}>
          No items available
        </Text>
      </View>
    );
  }, [emptyContainerStyle, emptyTextStyle, getContentHeight]);

  // Render grid item
  const renderGridItem = useCallback(({ item }: { item: any }) => {
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
      return (
        <>
          {renderLoading ? renderLoading() : defaultRenderLoading()}
          <View style={tw`h-2`} />
        </>
      );
    }

    if (isError) {
      return (
        <>
          {renderError ? renderError() : defaultRenderError()}
          <View style={tw`h-2`} />
        </>
      );
    }

    if (data.length === 0) {
      return (
        <>
          {renderEmpty ? renderEmpty() : defaultRenderEmpty()}
          <View style={tw`h-2`} />
        </>
      );
    }

    return (
      <>
        <View style={{ height: getContentHeight(), overflow: 'hidden' }}>
          <FlatList
            ref={flatListRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={pages}
            keyExtractor={(_, index) => `page_${index}`}
            renderItem={({ item: pageRows }) => (
              <View style={{ width: gridWidth, paddingHorizontal: 2 }}>
                {pageRows.map((row: any, rowIndex: number) => (
                  <View
                    key={`row_${rowIndex}`}
                    style={tw`flex-row justify-start my-0.5`}
                  >
                    {row.map((item: any) => renderGridItem({ item }))}

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
            snapToInterval={gridWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            initialNumToRender={2}
            maxToRenderPerBatch={4}
            windowSize={3}
          />
        </View>

        {/* Pagination container - always present to prevent layout shifts */}
        <View style={[tw`h-3 flex-row justify-center mt-1`, paginationContainerStyle]}>
          {totalPages > 1 && 
            Array.from({ length: totalPages }).map((_, index) => (
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
            ))
          }
        </View>
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
    getContentHeight,
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
    flatListRef,
  ]);

  return (
    <View style={[tw`mb-3`, containerStyle]}>
      {renderContent()}
    </View>
  );
});

export default ScrollableGrid;
