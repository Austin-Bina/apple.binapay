import React from 'react';
import {Image, View, Dimensions} from 'react-native';
import tw from '@lib/tailwind';
import {Text} from 'react-native-paper';

interface EmptyProps {
  image: string | number;
  title?: string;
  subTitle?: string;
}

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

const Empty: React.FC<EmptyProps> = ({image, title, subTitle}) => {
  return (
    <View style={tw`flex items-center justify-center mt-2`}>
      <View>
        <Image
          style={{
            width: deviceWidth * 0.2,
            height: deviceWidth * 0.7,
            aspectRatio: 2,
            resizeMode: 'contain' as 'contain',
          }}
          source={typeof image === 'string' ? {uri: image} : image}
          accessible
          accessibilityLabel="empty-image"
        />
      </View>
      {title && (
        <View
          style={[
            tw`flex items-center justify-center px-5`,
            {
              marginTop: deviceHeight * 0.02,
            },
          ]}>
          <Text style={tw`text-sm font-medium text-gray-800 text-center`}>
            {title}
          </Text>
        </View>
      )}
      {subTitle && (
        <View
          style={[
            tw`flex items-center justify-center px-5`,
            {
              marginTop: deviceHeight * 0.02,
            },
          ]}>
          <Text style={tw`font-medium text-gray-400 text-center`}>
            {subTitle}
          </Text>
        </View>
      )}
    </View>
  );
};

export default Empty;
