import Svg, { Rect } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgSelectOpenIcon = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    fill="none"
    {...props}
  >
    <Rect width={17} height={17} x={0.5} y={0.5} stroke="#2563EB" rx={8.5} />
    <Rect width={12} height={12} x={3} y={3} fill="#2563EB" rx={6} />
  </Svg>
);
export default SvgSelectOpenIcon;
