import Svg, { Circle } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgHorizontalDots = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={172}
    height={17}
    fill="none"
    {...props}
  >
    <Circle cx={8} cy={8.5} r={8} fill="#111827" />
    <Circle cx={34} cy={8.5} r={8} fill="#111827" />
    <Circle cx={60} cy={8.5} r={8} fill="#111827" />
    <Circle cx={86} cy={8.5} r={8} fill="#111827" />
    <Circle cx={112} cy={8.5} r={8} fill="#111827" />
    <Circle cx={138} cy={8.5} r={8} fill="#111827" />
    <Circle cx={164} cy={8.5} r={8} fill="#111827" />
  </Svg>
);
export default SvgHorizontalDots;
