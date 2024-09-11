import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgFlight = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <G
      fill="#2563EB"
      fillRule="evenodd"
      clipPath="url(#flight_svg__a)"
      clipRule="evenodd"
    >
      <Path d="M12.335 6.055a1.25 1.25 0 0 1 .998-.497h5c.449 0 .863.24 1.086.63l6.306 11.037h7.608a4.583 4.583 0 1 1 0 9.166h-25a1.25 1.25 0 0 1-1.118-.69l-5-10a1.25 1.25 0 0 1 1.118-1.81h5c.332 0 .65.132.884.367l2.967 2.967h2.826L12.13 7.152a1.25 1.25 0 0 1 .204-1.097m2.656 2.003 2.878 10.073a1.25 1.25 0 0 1-1.202 1.594h-5a1.25 1.25 0 0 1-.884-.366L7.816 16.39h-2.46l3.75 7.5h24.227a2.083 2.083 0 1 0 0-4.166H25a1.25 1.25 0 0 1-1.085-.63L17.608 8.058zM3.75 35c0-.69.56-1.25 1.25-1.25h30a1.25 1.25 0 1 1 0 2.5H5c-.69 0-1.25-.56-1.25-1.25" />
    </G>
    <Defs>
      <ClipPath id="flight_svg__a">
        <Path fill="#fff" d="M0 0h40v40H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgFlight;
