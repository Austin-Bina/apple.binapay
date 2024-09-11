import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgPhone = (props: SvgProps) => (
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
      d="M10.84 14.625a9.8 9.8 0 0 0 4.57 4.559.94.94 0 0 0 .926-.07l2.93-1.957a.93.93 0 0 1 .89-.083l5.485 2.356a.926.926 0 0 1 .562.973 5.625 5.625 0 0 1-5.578 4.91A15.937 15.937 0 0 1 4.688 9.375a5.625 5.625 0 0 1 4.91-5.578.926.926 0 0 1 .972.563l2.356 5.496a.94.94 0 0 1-.07.879l-1.958 2.976a.94.94 0 0 0-.058.914"
    />
  </Svg>
);
export default SvgPhone;
