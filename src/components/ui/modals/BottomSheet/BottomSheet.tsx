import React, { useCallback, forwardRef } from "react";
import {
  BottomSheetModal as BottomSheetModalLibrary,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
  BottomSheetProps as PrimitiveBottomSheetProps,
} from "@gorhom/bottom-sheet";
import { useTheme } from "react-native-paper";
import BottomSheetModalHeader from "./BottomSheetHeader";
import tw from "@lib/tailwind";

interface BottomSheetModalProps {
  children: React.ReactNode;
  headerTitle?: string;
  closeFilter?: () => void;
  showHeader?: boolean;
  initialSnapPoints?: PrimitiveBottomSheetProps["snapPoints"];
  onDismiss?: () => void;
}

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
        backgroundStyle={{ backgroundColor: "white" }}
        handleIndicatorStyle={tw`bg-gray-300 w-16`}
        handleStyle={tw`pt-2.5`}
        topInset={60}
        backdropComponent={renderBackdrop}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        enablePanDownToClose
        onDismiss={onDismiss}
        enableDynamicSizing
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
