import React from 'react';
import {ScrollView, type ScrollViewProps} from 'react-native';

interface ScrollableView extends ScrollViewProps {
  noHScroll?: boolean;
  noVScroll?: boolean;
}

export default function ScrollableView({
  noHScroll = true,
  noVScroll = true,
  ...props
}: ScrollableView) {
  return (
    <ScrollView
      showsHorizontalScrollIndicator={noHScroll === false}
      showsVerticalScrollIndicator={noVScroll === false}
      {...props}
    />
  );
}
