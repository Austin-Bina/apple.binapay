import React, { Fragment } from "react";
import { View } from "react-native";
import { Avatar, Divider, Text } from "react-native-paper";
import * as Animatable from "react-native-animatable";
import tw from "@lib/tailwind";

type Props = {
  groups?: string[];
};

const TransactionLoader: React.FC<Props> = ({ groups }) => {
  const defaultGroups = ["Today", "Yesterday", "Last Week"];
  const groupsToRender = groups || defaultGroups;

  return (
    <View>
      {groupsToRender.map((group) => (
        <View key={group}>
          <Text style={tw`text-gray-500 mb-2 text-lg font-semibold`}>{group}</Text>
          {[1, 2, 3].map((_, index) => (
            <Fragment key={index}>
              <Animatable.View
                animation="pulse"
                easing="ease-out"
                iterationCount="infinite"
                style={tw`flex-row items-center justify-between gap-2 p-2 my-2 bg-gray-100 rounded-md`}>
                {/* Avatar Loader */}
                <Avatar.Image
                  size={40}
                  source={{
                    uri: "url",
                  }}
                  style={tw`opacity-50 bg-gray-300`}
                />

                {/* Transaction Details Loader */}
                <View style={tw`flex-1 mx-3`}>
                  <Animatable.View
                    style={tw`w-3/4 h-4 bg-gray-300 rounded-md mb-1`}
                    animation="pulse"
                    easing="ease-out"
                    iterationCount="infinite"
                  />
                  <Animatable.View
                    style={tw`w-1/2 h-3 bg-gray-200 rounded-md`}
                    animation="pulse"
                    easing="ease-out"
                    iterationCount="infinite"
                  />
                </View>

                {/* Amount Loader */}
                <Animatable.View
                  style={tw`w-16 h-5 bg-gray-200 rounded-md`}
                  animation="pulse"
                  easing="ease-out"
                  iterationCount="infinite"
                />
              </Animatable.View>

              {/* Divider */}
              {index !== 2 && <Divider />}
            </Fragment>
          ))}
        </View>
      ))}
    </View>
  );
};

export default TransactionLoader;
