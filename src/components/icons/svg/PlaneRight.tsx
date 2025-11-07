import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgPlaneRight = (props: SvgProps) => (
  <Svg
    width={30}
    height={31}
    fill="none"
    {...props}
  >
    <Path
      fill="#9CA3AF"
      d="M26.18 13.86 6.434 2.809a1.91 1.91 0 0 0-2.133.14 1.86 1.86 0 0 0-.598 2.098l3.293 9.2a.48.48 0 0 0 .445.316h8.461a.96.96 0 0 1 .973.879.94.94 0 0 1-.937.996H7.44a.48.48 0 0 0-.445.316l-3.293 9.2a1.887 1.887 0 0 0 1.77 2.507c.319-.001.633-.082.914-.234L26.18 17.14a1.886 1.886 0 0 0 0-3.281"
    />
  </Svg>
);
export default SvgPlaneRight;

/**
 * JUSTICE VERSION
 */
/*
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgPlaneRight = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={31}
    fill="none"
    {...props}
  >
    <Path
      fill="#9CA3AF"
      d="M26.18 13.86 6.434 2.809a1.91 1.91 0 0 0-2.133.14 1.86 1.86 0 0 0-.598 2.098l3.293 9.2a.48.48 0 0 0 .445.316h8.461a.96.96 0 0 1 .973.879.94.94 0 0 1-.937.996H7.44a.48.48 0 0 0-.445.316l-3.293 9.2a1.887 1.887 0 0 0 1.77 2.507c.319-.001.633-.082.914-.234L26.18 17.14a1.886 1.886 0 0 0 0-3.281"
    />
  </Svg>
);
export default SvgPlaneRight;
*/
