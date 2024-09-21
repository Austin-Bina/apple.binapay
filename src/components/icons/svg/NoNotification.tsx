import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgNoNotification = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <G fill="#1F2937" clipPath="url(#no-notification_svg__a)">
      <Path d="m21.9 18.753-.227-.2A9.6 9.6 0 0 1 20 16.6a8.4 8.4 0 0 1-.9-3.207V10.1a7.207 7.207 0 0 0-6.294-7.167v-.86a.89.89 0 1 0-1.78 0v.874a7.21 7.21 0 0 0-6.22 7.153v3.293a8.4 8.4 0 0 1-.9 3.207 9.6 9.6 0 0 1-1.646 1.953l-.227.2v1.88H21.9zM10.213 21.333a1.766 1.766 0 0 0 3.5 0z" />
    </G>
    <Defs>
      <ClipPath id="no-notification_svg__a">
        <Path fill="#fff" d="M0 0h24v24H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgNoNotification;
