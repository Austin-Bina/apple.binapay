import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgBeautifyCopy = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <Path
      stroke="#1B095D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.334 8.933v2c0 2.666-1.067 3.733-3.733 3.733H5.067c-2.666 0-3.733-1.067-3.733-3.733V8.399c0-2.666 1.067-3.733 3.733-3.733h2"
    />
    <Path
      stroke="#1B095D"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.333 8.933H9.2c-1.6 0-2.134-.534-2.134-2.134V4.666zM7.732 1.334H10.4M4.666 3.334c0-1.107.893-2 2-2h1.747M14.666 5.334v4.127c0 1.033-.84 1.873-1.873 1.873M14.666 5.334h-2c-1.5 0-2-.5-2-2v-2z"
    />
  </Svg>
);
export default SvgBeautifyCopy;
