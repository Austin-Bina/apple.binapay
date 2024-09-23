import { AngledRightArrow } from "@components/icons/svg";
import { Colors } from "@constants/theme/colors";
import tw from "@lib/tailwind";
import { Dimensions, View } from "react-native";
import { Badge, Text, TouchableRipple } from "react-native-paper";
import { scale } from "react-native-size-matters";
import { SvgProps } from "react-native-svg";

interface ActionProps {
  onPress: () => void;
  title: string;
  ItemIcon: React.FC<SvgProps>;
  badgeElement?: React.ReactNode;
  backgroundColor?: string;
}
const Action = ({ onPress, title, ItemIcon, badgeElement, backgroundColor = Colors.primary[50] }: ActionProps) => {
  return (
    <TouchableRipple onPress={onPress} style={tw`my-1`}>
      <View style={tw`flex-row justify-between items-center px-4 my-1`}>
        <View style={tw`flex-row items-center gap-3`}>
          <View
            style={[
              tw`justify-center h-12 w-12 items-center p-4 bg-primary-50 rounded-full`,
              {
                backgroundColor,
              },
            ]}>
            <ItemIcon width={24} height={24} />
          </View>
          <Text style={tw`text-base font-medium`}>{title}</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          {badgeElement}
          <AngledRightArrow width={20} />
        </View>
      </View>
    </TouchableRipple>
  );
};

interface ActionWithDescriptionProps {
  onPress: () => void;
  title: string;
  ItemIcon?: React.FC<SvgProps>;
  badgeElement?: React.ReactNode;
  backgroundColor?: string;
  description: string;
  isDisabled?: boolean;
}

const ActionWithDescription = ({
  onPress,
  title,
  description,
  ItemIcon,
  badgeElement,
  backgroundColor = Colors.primary[50],
  isDisabled = false,
}: ActionWithDescriptionProps) => {
  return (
    <TouchableRipple onPress={onPress} disabled={isDisabled} style={[tw`py-4`, { opacity: isDisabled ? 0.6 : 1 }]}>
      <View style={tw`flex-row justify-between items-center px-4 gap-2`}>
        {ItemIcon && (
          <View
            style={[
              tw`flex-none justify-center h-12 w-12 items-center p-4 bg-primary-50 rounded-full`,
              {
                backgroundColor,
              },
            ]}>
            <ItemIcon width={24} height={24} />
          </View>
        )}

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center gap-2`}>
            <Text style={tw`text-base font-medium`}>{title}</Text>
            {badgeElement && <View>{badgeElement}</View>}
          </View>
          <Text style={tw`text-sm text-gray-500 mt-1`}>{description}</Text>
        </View>

        <View style={tw`flex-none`}>
          <AngledRightArrow width={20} />
        </View>
      </View>
    </TouchableRipple>
  );
};

interface SupportActionProps {
  onPress: () => void;
  title: string;
}
const SupportAction = ({ onPress, title }: SupportActionProps) => {
  return (
    <TouchableRipple onPress={onPress} style={tw`py-2`}>
      <View style={tw`flex-row justify-between items-center px-4 my-1`}>
        <Text style={tw`text-base font-medium`}>{title}</Text>
        <AngledRightArrow width={20} />
      </View>
    </TouchableRipple>
  );
};

export { Action, ActionWithDescription, SupportAction };
