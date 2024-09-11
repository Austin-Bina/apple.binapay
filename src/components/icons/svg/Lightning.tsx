import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgLightning = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={30}
    fill="none"
    {...props}
  >
    <Path
      stroke="#2563EB"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m11.25 28.125 1.875-9.375-7.5-2.812L18.75 1.874l-1.875 9.375 7.5 2.813z"
    />
  </Svg>
);
export default SvgLightning;
