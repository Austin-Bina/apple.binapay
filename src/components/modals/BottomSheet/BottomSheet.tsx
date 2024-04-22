import React, { useCallback, useMemo, forwardRef } from "react";
import { StyleSheet } from "react-native";
import {
  BottomSheetModal as BottomSheetModalLibrary,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useTheme } from "react-native-paper";
import BottomSheetModalHeader from "./BottomSheetHeader";
import { Colors } from "@constants/theme";

interface BottomSheetModalProps {
  children: React.ReactNode;
  headerTitle?: string;
  closeFilter?: () => void;
  showHeader?: boolean;
  initialSnapPoints?: number[];
  onDismiss?: () => void;
}

const createStyles = () => {
  return StyleSheet.create({
    handleStyle: {
      paddingBottom: 2,
      paddingTop: 4,
    },
  });
};

const BottomSheetModal = forwardRef<
  BottomSheetModalLibrary,
  BottomSheetModalProps
>(
  (
    {
      children,
      headerTitle,
      closeFilter,
      showHeader,
      initialSnapPoints,
      onDismiss,
    },
    ref
  ) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(), []);
    const { colors } = theme;

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          enableTouchThrough={false}
          pressBehavior={"close"}
          opacity={0.5}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      ),
      []
    );

    return (
      <BottomSheetModalLibrary
        index={1}
        ref={ref}
        onChange={() => {}}
        snapPoints={initialSnapPoints}
        backgroundStyle={{ backgroundColor: 'white' }}
        handleIndicatorStyle={{ backgroundColor: Colors.gray[300] }}
        handleStyle={styles.handleStyle}
        topInset={60}
        backdropComponent={renderBackdrop}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        enablePanDownToClose
        onDismiss={onDismiss}
      >
        {showHeader && (
          <BottomSheetModalHeader
            title={headerTitle}
            closeModal={closeFilter}
            colors={colors}
          />
        )}
        <BottomSheetScrollView>{children}</BottomSheetScrollView>
      </BottomSheetModalLibrary>
    );
  }
);

export default BottomSheetModal;
