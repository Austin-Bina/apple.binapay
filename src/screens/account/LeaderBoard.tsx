import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useRoute } from "@react-navigation/native";
import { useGetReferralLeaderboardQuery } from "@store/redux-api/referralQueryApi";
import { Card } from "react-native-paper";
import tw from "@lib/tailwind";
import { ReferralLeaderboardItem } from "@type/user";
import { AccountStackScreenProps } from "@navigators/types";

// Updated overall → alltime
const FILTERS: ("weekly" | "monthly" | "alltime")[] = ["weekly", "monthly", "alltime"];

const LeaderboardScreen = () => {
  const route = useRoute<AccountStackScreenProps<"Leaderboard">["route"]>();
  const initialFilter = route.params?.filter ?? "alltime";

  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const { data, isFetching } = useGetReferralLeaderboardQuery({
    limit: 20,
    filter: activeFilter,
  });

  return (
    <View style={tw`flex-1 bg-white p-4`}>

      {/* Title */}
      <Text style={tw`text-2xl font-bold text-center text-blue-700 mb-3`}>
        Leaderboard
      </Text>

      {/* Filter Tabs */}
      <View style={tw`flex-row justify-center mb-4`}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            style={tw`
              px-4 py-2 mx-1 rounded-full 
              ${activeFilter === f ? "bg-blue-700" : "bg-blue-200"}
            `}
          >
            <Text
              style={tw`text-sm font-semibold ${activeFilter === f ? "text-white" : "text-blue-800"}`}
            >
              {f === "alltime" ? "All-Time" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isFetching ? (
        <Text style={tw`text-center text-gray-500 mt-10`}>Loading...</Text>
      ) : (
       
       
      <FlatList<ReferralLeaderboardItem>
  data={data}
  keyExtractor={(item) => item.referrer_id}
  renderItem={({ item, index }) => {
    // Badge colors for top 3
    let badgeColor = "bg-yellow-400";
    if (index === 1) badgeColor = "bg-gray-400";
    else if (index === 2) badgeColor = "bg-orange-500";

    return (
      <Card mode="contained" style={tw`bg-blue-600 rounded-xl mb-2`}>
        <Card.Content style={tw`p-2`}>
          <View style={tw`flex-row items-center`}>

            {/* Rank Badge */}
            <View
              style={tw`w-8 h-8 rounded-full ${badgeColor} justify-center items-center mr-2`}
            >
              <Text style={tw`text-sm font-bold text-blue-900`}>
                {index + 1}
              </Text>
            </View>

            {/* Avatar */}
            <Image
              source={{ uri: `/storage/${item.referrer.avatar}` }}
              style={tw`w-9 h-9 rounded-full mr-3`}
            />

            {/* Name + Volume */}
            <View style={tw`flex-1`}>
              <Text style={tw`text-white font-semibold text-xs`}>
                {item.referrer.name}
              </Text>

              <Text style={tw`text-white/70 text-[10px] mt-0.5`}>
                Volume: ₦{item.total_volume.toLocaleString()}
              </Text>
            </View>

            {/* Earned Badge */}
            <View style={tw`ml-2`}>
              <Text style={tw`px-2 py-0.5 bg-blue-800 text-white text-[10px] font-bold rounded-md`}>
                ₦{item.total_earned.toLocaleString()}
              </Text>
            </View>

          </View>
        </Card.Content>
      </Card>
    );
  }}
/>



      )}
    </View>
  );
};

export default LeaderboardScreen;
