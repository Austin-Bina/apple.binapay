import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgKey = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#2563EB"
      fillRule="evenodd"
      d="M15 3.9a5.1 5.1 0 0 0-4.882 6.582.9.9 0 0 1-.225.897L3.93 17.344a.1.1 0 0 0-.029.07V20a.1.1 0 0 0 .1.1h2.1V19a.9.9 0 0 1 .9-.9h1.1V17a.9.9 0 0 1 .9-.9h1.627l1.994-1.993a.9.9 0 0 1 .897-.225A5.1 5.1 0 1 0 15 3.9M8.1 9a6.9 6.9 0 1 1 5.43 6.743l-1.894 1.894A.9.9 0 0 1 11 17.9H9.9V19a.9.9 0 0 1-.9.9H7.9V21a.9.9 0 0 1-.9.9H4A1.9 1.9 0 0 1 2.1 20v-2.586c0-.504.2-.987.556-1.343l5.601-5.6A7 7 0 0 1 8.1 9m6-2a.9.9 0 0 1 .9-.9A2.9 2.9 0 0 1 17.9 9a.9.9 0 1 1-1.8 0A1.1 1.1 0 0 0 15 7.9a.9.9 0 0 1-.9-.9"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgKey;
