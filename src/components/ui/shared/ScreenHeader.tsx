// @components/ui/shared/ScreenHeader.tsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
};

export default function ScreenHeader({ title, subtitle, onBack, rightIcon, onRightPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.header, { paddingTop: insets.top + 10 }]}>
      {onBack ? (
        <TouchableOpacity style={s.iconBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
      ) : (
         <View style={s.spacer} />
      )}

      <View style={s.center}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightIcon ? (
        <TouchableOpacity style={s.iconBtn} onPress={onRightPress}>
          <MaterialCommunityIcons name={rightIcon as any} size={20} color={BLUE} />
        </TouchableOpacity>
      ) : (
        <View style={s.spacer} /> 
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  iconBtn:  { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  center:   { flex: 1, alignItems: "center" },
  title:    { fontSize: 16, fontWeight: "700", color: BRAND },
  subtitle: { fontSize: 11, color: "#6b7280", marginTop: 1 },
   spacer:   { width: 34, height: 34 },
});
