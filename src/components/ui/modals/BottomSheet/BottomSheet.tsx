import React, { useCallback, forwardRef } from "react";
import {
  BottomSheetModal as BottomSheetModalLibrary,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
  BottomSheetProps as PrimitiveBottomSheetProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useTheme } from "react-native-paper";
import BottomSheetModalHeader from "./BottomSheetHeader";
import tw from "@lib/tailwind";
import { match } from "ts-pattern";

interface BottomSheetModalProps {
  children: React.ReactNode;
  headerTitle?: string;
  showHeader?: boolean;
  initialSnapPoints?: PrimitiveBottomSheetProps["snapPoints"];
  onDismiss?: () => void;
  index?: number;
  scrollable?: boolean;
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
}

const BottomSheetModal = forwardRef<BottomSheetModalLibrary, BottomSheetModalProps>(
  ({ children, headerTitle, showHeader = true, enableDynamicSizing = false, enablePanDownToClose = true, initialSnapPoints, onDismiss, index = 1, scrollable = true }, ref) => {
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
      [],
    );

    return (
      <BottomSheetModalLibrary
        index={index}
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
        enablePanDownToClose={enablePanDownToClose}
        onDismiss={onDismiss}
        enableDynamicSizing={enableDynamicSizing}>
        {showHeader && <BottomSheetModalHeader title={headerTitle} closeModal={onDismiss} colors={colors} />}
        {match(scrollable)
          .with(true, () => <BottomSheetScrollView>{children}</BottomSheetScrollView>)
          .otherwise(() => children)}
      </BottomSheetModalLibrary>
    );
  },
);

export default BottomSheetModal;
