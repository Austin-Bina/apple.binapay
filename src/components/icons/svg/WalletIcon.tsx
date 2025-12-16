import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";

const WalletIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <Path
      fill={props.color || "#fff"}
      d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm2 0v12h16V6H4zm14 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
    />
  </Svg>
);

export default WalletIcon;
