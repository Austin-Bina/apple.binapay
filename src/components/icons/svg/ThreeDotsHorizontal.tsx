import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgThreeDotsHorizontal = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={30}
    fill="none"
    {...props}
  >
    <Path
      stroke="#2563EB"
      strokeMiterlimit={10}
      strokeWidth={2}
      d="M15 17.813a2.813 2.813 0 1 0 0-5.626 2.813 2.813 0 0 0 0 5.626ZM5.625 17.813a2.813 2.813 0 1 0 0-5.626 2.813 2.813 0 0 0 0 5.626ZM24.375 17.813a2.813 2.813 0 1 0 0-5.626 2.813 2.813 0 0 0 0 5.626Z"
    />
  </Svg>
);
export default SvgThreeDotsHorizontal;
