import tw from '@lib/tailwind';
import React from 'react';
import {ScrollView, type ScrollViewProps} from 'react-native';

interface ScrollableView extends ScrollViewProps {
  noHScroll?: boolean;
  noVScroll?: boolean;
}

export default function ScrollableView({
  noHScroll = true,
  noVScroll = true,
  contentContainerStyle,
  ...props
}: ScrollableView) {
  return (
    <ScrollView
      showsHorizontalScrollIndicator={noHScroll === false}
      showsVerticalScrollIndicator={noVScroll === false}
      contentContainerStyle={[contentContainerStyle, tw`flex-grow`]}

       // 👇 **Critical iOS fixes**
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="interactive"
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
      {...props}
    />
  );
}
