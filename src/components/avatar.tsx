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

export const AVATAR_MAP = {
  "avatar-male-1": <MaleOne width={scale(48)} />,
  "avatar-male-2": <MaleTwo width={scale(48)} />,
  "avatar-male-3": <MaleThree width={scale(48)} />,
  "avatar-male-4": <MaleFour width={scale(48)} />,
  "avatar-female-1": <FemaleOne width={scale(48)} />,
  "avatar-female-2": <FemaleTwo width={scale(48)} />,
  "avatar-female-3": <FemaleThree width={scale(48)} />,
  "avatar-female-4": <FemaleFour width={scale(48)} />,
};

type AvatarImageProps = React.ComponentProps<typeof Avatar.Image>;
type Props = Omit<AvatarImageProps, "source"> & {
  avatar?: string;
};

export const AvatarImage: React.FC<Props> = ({ avatar, style, ...props }) => {
  if (!avatar) return AVATAR_MAP["avatar-male-1"];

  const localAvatar = AVATAR_MAP[avatar as keyof typeof AVATAR_MAP];
  if (localAvatar) return localAvatar;

  return <Avatar.Image source={{ uri: avatar }} style={[tw`bg-gray-400`, style]} {...props} />;
};
