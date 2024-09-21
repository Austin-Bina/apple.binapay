import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgLargeEyeOpen = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={30}
    fill="none"
    {...props}
  >
    <Path
      fill="#6D7280"
      d="M18.75 15a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0"
    />
    <Path
      fill="#6D7280"
      d="M27.367 14.441C24.67 9.045 19.88 6.25 15 6.25c-4.879 0-9.67 2.795-12.368 8.191a1.25 1.25 0 0 0 0 1.118C5.33 20.955 10.12 23.75 15 23.75c4.879 0 9.67-2.795 12.367-8.191a1.25 1.25 0 0 0 0-1.118M15 21.25c-3.711 0-7.503-2.025-9.838-6.25C7.497 10.775 11.287 8.75 15 8.75c3.711 0 7.502 2.025 9.837 6.25-2.335 4.225-6.126 6.25-9.837 6.25"
    />
  </Svg>
);
export default SvgLargeEyeOpen;
