import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgWifi = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={30}
    fill="none"
    {...props}
  >
    <Path
      fill="#2563EB"
      d="M20.312 17.83a7.97 7.97 0 0 0-10.589 0 1.23 1.23 0 1 0 1.635 1.839 5.51 5.51 0 0 1 7.318 0 1.23 1.23 0 0 0 1.636-1.84z"
    />
    <Path
      fill="#2563EB"
      d="M15.016 10.764a12.98 12.98 0 0 0-8.894 3.51 1.231 1.231 0 1 0 1.68 1.798 10.563 10.563 0 0 1 14.429 0 1.23 1.23 0 1 0 1.68-1.797 12.98 12.98 0 0 0-8.895-3.511"
    />
    <Path
      fill="#2563EB"
      d="M27.07 10.304a18.105 18.105 0 0 0-24.107 0 1.23 1.23 0 1 0 1.64 1.834 15.644 15.644 0 0 1 20.826 0 1.23 1.23 0 0 0 1.64-1.835zM15.016 24.926a1.875 1.875 0 1 0 0-3.75 1.875 1.875 0 0 0 0 3.75"
    />
  </Svg>
);
export default SvgWifi;
