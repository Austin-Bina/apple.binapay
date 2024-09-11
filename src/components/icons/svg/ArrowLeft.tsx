import Svg, { Rect, Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgArrowLeft = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={38}
    height={38}
    fill="none"
    {...props}
  >
    <Rect width={37} height={37} x={0.5} y={0.5} stroke="#E5E7EB" rx={9.5} />
    <Path
      stroke="#1F2937"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m21.75 25.417-5.03-5.031c-.64-.64-.96-.959-.972-1.354v-.063c.013-.396.332-.716.971-1.355l5.031-5.03"
    />
  </Svg>
);
export default SvgArrowLeft;
