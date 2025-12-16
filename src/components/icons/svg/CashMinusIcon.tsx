import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";

const CashMinusIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <Path
      fill={props.color || "#fff"}
      d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zm2 0v12h14V6H5zm3 5h8v2H8v-2z"
    />
  </Svg>
);

export default CashMinusIcon;
