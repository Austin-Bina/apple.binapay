import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgHasNotification = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <G clipPath="url(#has-notification_svg__a)">
      <Path
        fill="#1F2937"
        d="M12 22.853a1.78 1.78 0 0 0 1.72-1.52h-3.507A1.78 1.78 0 0 0 12 22.853M21.9 18.753l-.227-.2A9.6 9.6 0 0 1 20 16.6a8.4 8.4 0 0 1-.9-3.207V10.1q-.005-.602-.107-1.193A5 5 0 0 1 15 4v-.42a7 7 0 0 0-2.213-.667v-.84a.89.89 0 1 0-1.78 0v.874a7.21 7.21 0 0 0-6.2 7.153v3.293a8.4 8.4 0 0 1-.9 3.207 9.6 9.6 0 0 1-1.647 1.953l-.227.2v1.88H21.9z"
      />
      <Path
        fill="#DC2626"
        d="M20 7.333a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666"
      />
    </G>
    <Defs>
      <ClipPath id="has-notification_svg__a">
        <Path fill="#fff" d="M0 0h24v24H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgHasNotification;
