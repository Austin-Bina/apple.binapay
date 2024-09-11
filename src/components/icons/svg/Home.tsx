import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgHome = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={31}
    height={31}
    fill="none"
    {...props}
  >
    <Path fill="#111827" d="m15.5 4.25 10 7.5v15h-6.25V18h-7.5v8.75H5.5v-15z" />
  </Svg>
);
export default SvgHome;
