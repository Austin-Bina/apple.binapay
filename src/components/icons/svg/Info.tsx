import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgInfo = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <G clipPath="url(#info_svg__a)">
      <Path
        fill="#F97316"
        fillRule="evenodd"
        d="M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12m9-4a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75m-1 4a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 .75.75v3.25H13a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75v-3.25H11a.75.75 0 0 1-.75-.75"
        clipRule="evenodd"
      />
    </G>
    <Defs>
      <ClipPath id="info_svg__a">
        <Path fill="#fff" d="M0 0h24v24H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgInfo;
