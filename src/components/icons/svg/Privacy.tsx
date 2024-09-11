import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgPrivacy = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <G clipPath="url(#privacy_svg__a)">
      <Path
        fill="#2563EB"
        fillRule="evenodd"
        d="M19.6 5.982 12 2.562l-7.6 3.42v5.238c0 4.512 3.172 9.136 7.507 10.17l.093.021.093-.022c4.335-1.033 7.507-5.657 7.507-10.169zM6.4 11.22V7.28l5.6-2.52 5.6 2.52v3.941c0 3.617-2.506 7.17-5.6 8.127-3.094-.957-5.6-4.51-5.6-8.127M13 10V8h-2v2zm0 6v-5.6h-2V16z"
        clipRule="evenodd"
      />
    </G>
    <Defs>
      <ClipPath id="privacy_svg__a">
        <Path fill="#fff" d="M0 0h24v24H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgPrivacy;
