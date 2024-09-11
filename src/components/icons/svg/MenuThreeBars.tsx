import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgMenuThreeBars = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={31}
    fill="none"
    {...props}
  >
    <G clipPath="url(#menu-three-bars_svg__a)">
      <Path
        fill="#9CA3AF"
        d="M3.75 5.5h22.5V8H3.75zm0 8.75h22.5v2.5H3.75zm0 8.75h22.5v2.5H3.75z"
      />
    </G>
    <Defs>
      <ClipPath id="menu-three-bars_svg__a">
        <Path fill="#fff" d="M0 .5h30v30H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgMenuThreeBars;
