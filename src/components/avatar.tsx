import React from "react";
import { scale } from "react-native-size-matters";
import MaleOne from "@assets/images/avatars/male-1.svg";
import MaleTwo from "@assets/images/avatars/male-2.svg";
import MaleThree from "@assets/images/avatars/male-3.svg";
import MaleFour from "@assets/images/avatars/male-4.svg";
import FemaleOne from "@assets/images/avatars/female-1.svg";
import FemaleTwo from "@assets/images/avatars/female-2.svg";
import FemaleThree from "@assets/images/avatars/female-3.svg";
import FemaleFour from "@assets/images/avatars/female-4.svg";
import { Avatar } from "react-native-paper";
import tw from "@lib/tailwind";
import { SvgProps } from "react-native-svg";

export const AVATAR_MAP = {
  "avatar-male-1": (props: SvgProps) => <MaleOne {...props} />,
  "avatar-male-2": (props: SvgProps) => <MaleTwo {...props} />,
  "avatar-male-3": (props: SvgProps) => <MaleThree {...props} />,
  "avatar-male-4": (props: SvgProps) => <MaleFour {...props} />,
  "avatar-female-1": (props: SvgProps) => <FemaleOne {...props} />,
  "avatar-female-2": (props: SvgProps) => <FemaleTwo {...props} />,
  "avatar-female-3": (props: SvgProps) => <FemaleThree {...props} />,
  "avatar-female-4": (props: SvgProps) => <FemaleFour {...props} />,
};

type AvatarImageProps = React.ComponentProps<typeof Avatar.Image>;
type Props = Omit<AvatarImageProps, "source"> & {
  avatar?: string;
  svgProps?: SvgProps;
};

export const AvatarImage: React.FC<Props> = ({
  avatar,
  style,
  svgProps = {
    width: scale(48),
    height: scale(48),
  },
  ...props
}) => {
  if (!avatar) return AVATAR_MAP["avatar-male-1"](svgProps);

  const AvatarComponent = AVATAR_MAP[avatar as keyof typeof AVATAR_MAP];
  if (AvatarComponent) return AvatarComponent(svgProps);

  // ImageRequireSource
  if (typeof avatar === "number") {
    return <Avatar.Image source={avatar} style={[tw`bg-gray-400`, style]} {...props} />;
  }

  return <Avatar.Image source={{ uri: avatar }} style={[tw`bg-gray-400`, style]} {...props} />;
};
