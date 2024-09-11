import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgTvScreen = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <G clipPath="url(#tv-screen_svg__a)">
      <Path
        fill="#2563EB"
        d="M15 16.667V30l11.667-6.666zM35 10H22.367l5.483-5.483-1.183-1.184L20 10h-.05l-6.667-6.666-1.15 1.183L17.6 10H5a3.343 3.343 0 0 0-3.333 3.334v20c0 1.833 1.5 3.333 3.333 3.333h30c1.833 0 3.333-1.5 3.333-3.334v-20C38.333 11.5 36.833 10 35 10m0 23.334H5v-20h30z"
      />
    </G>
    <Defs>
      <ClipPath id="tv-screen_svg__a">
        <Path fill="#fff" d="M0 0h40v40H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgTvScreen;
