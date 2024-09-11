import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgAngledRightArrow = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#D2D5DA"
      d="M9.293 18.707a1 1 0 0 1 0-1.414L14.586 12 9.293 6.707a1 1 0 1 1 1.414-1.414l6 6a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0"
    />
  </Svg>
);
export default SvgAngledRightArrow;
