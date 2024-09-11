import tw from '@lib/tailwind';
import React from 'react';
import { View, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';

const deviceWidth = Dimensions.get('window').width;

const NotificationItemLoader = () => {

  return (
    <Animatable.View
      animation="flash"
      easing="ease-out"
      iterationCount="infinite"
      duration={3000}
      style={tw`flex-row items-center justify-between p-2 my-0.5 bg-white`}
    >
      <View style={tw`flex-row items-center`}>
        {/* Avatar Loader */}
        <View style={tw`mr-2`}>
          <View style={tw`w-12 h-12 rounded-full bg-gray-300 flex-row items-center justify-center`} />
        </View>

        <View style={tw`flex-col`}>
          {/* Chat Loader */}
          <View style={[tw`bg-gray-300 rounded-md`, { width: deviceWidth * 0.7, height: deviceWidth * 0.04 }]} />
          
          {/* Chat Time Loader */}
          <View style={[tw`bg-gray-300 rounded-md mt-1`, { width: deviceWidth * 0.16, height: deviceWidth * 0.02 }]} />
        </View>
      </View>
    </Animatable.View>
  );
};

export default NotificationItemLoader;
