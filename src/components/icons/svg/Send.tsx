import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgSend = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={36}
    height={35}
    fill="none"
    {...props}
  >
    <G clipPath="url(#send_svg__a)">
      <Path
        fill="#fff"
        d="M3.519 13.791c-.748-.25-.755-.652.014-.908l27.345-9.115c.757-.252 1.191.172.98.914l-7.814 27.343c-.215.758-.652.784-.973.065l-5.149-11.587 8.596-11.461-11.46 8.596z"
      />
    </G>
    <Defs>
      <ClipPath id="send_svg__a">
        <Path fill="#fff" d="M.73.448h34.383v34.383H.73z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgSend;
