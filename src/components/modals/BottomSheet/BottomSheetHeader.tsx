import React, {useMemo, FC} from 'react';
import {View, StyleSheet} from 'react-native';
import {IconButton, useTheme, MD3Theme, Text} from 'react-native-paper';

interface BottomSheetModalHeaderProps {
  title?: string;
  closeModal?: () => void;
  colors: MD3Theme['colors'];
}

const createStyles = (theme: MD3Theme) => {
  const {colors} = theme;
  return StyleSheet.create({
    headerContainer: {
      paddingBottom: 2,
      paddingTop: 4,
      paddingHorizontal: 10,
      borderBottomColor: colors.outline,
      borderBottomWidth: 0.4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    headerTitle: {
      textAlign: 'center',
    },
  });
};

const BottomSheetModalHeader: FC<BottomSheetModalHeaderProps> = ({
  title,
  closeModal,
  colors,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      <IconButton
        icon="dismiss-outline"
        iconColor={colors.error}
        size={16}
        onPress={closeModal}
      />
    </View>
  );
};

export default BottomSheetModalHeader;
