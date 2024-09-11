import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgBarCode = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <Path
      fill="#2563EB"
      d="M4 11.5A5.5 5.5 0 0 1 9.5 6H11a1.5 1.5 0 0 1 0 3H9.5A2.5 2.5 0 0 0 7 11.5V13a1.5 1.5 0 0 1-3 0zm23.5-4A1.5 1.5 0 0 1 29 6h1.5a5.5 5.5 0 0 1 5.5 5.5V13a1.5 1.5 0 0 1-3 0v-1.5A2.5 2.5 0 0 0 30.5 9H29a1.5 1.5 0 0 1-1.5-1.5m-22 18A1.5 1.5 0 0 1 7 27v1.5A2.5 2.5 0 0 0 9.5 31H11a1.5 1.5 0 0 1 0 3H9.5A5.5 5.5 0 0 1 4 28.5V27a1.5 1.5 0 0 1 1.5-1.5m29 0A1.5 1.5 0 0 1 36 27v1.5a5.5 5.5 0 0 1-5.5 5.5H29a1.5 1.5 0 0 1 0-3h1.5a2.5 2.5 0 0 0 2.5-2.5V27a1.5 1.5 0 0 1 1.5-1.5M11 12a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-3 0v-13A1.5 1.5 0 0 1 11 12m7.5 1.5a1.5 1.5 0 0 0-3 0v13a1.5 1.5 0 0 0 3 0zM23 12a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-3 0v-13A1.5 1.5 0 0 1 23 12m7.5 1.5a1.5 1.5 0 0 0-3 0v13a1.5 1.5 0 0 0 3 0z"
    />
  </Svg>
);
export default SvgBarCode;
