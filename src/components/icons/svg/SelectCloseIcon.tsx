import Svg, { Rect } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgSelectCloseIcon = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    fill="none"
    {...props}
  >
    <Rect width={17} height={17} x={0.5} y={0.5} stroke="#BFDBFE" rx={8.5} />
  </Svg>
);
export default SvgSelectCloseIcon;
