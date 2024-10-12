import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgCopyFill = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#fff"
      d="M19.125 22.5h-10.5a3.375 3.375 0 0 1-3.375-3.375v-10.5A3.375 3.375 0 0 1 8.625 5.25h10.5A3.375 3.375 0 0 1 22.5 8.625v10.5a3.375 3.375 0 0 1-3.375 3.375"
    />
    <Path
      fill="#fff"
      d="M7.5 3.75h11.057a3.38 3.38 0 0 0-3.182-2.25h-10.5A3.375 3.375 0 0 0 1.5 4.875v10.5a3.38 3.38 0 0 0 2.25 3.182V7.5A3.75 3.75 0 0 1 7.5 3.75"
    />
  </Svg>
);
export default SvgCopyFill;
