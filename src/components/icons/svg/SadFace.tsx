import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgSadFace = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={30}
    fill="none"
    {...props}
  >
    <G clipPath="url(#sad-face_svg__a)">
      <Path
        fill="#F97316"
        d="M15 2.5c6.904 0 12.5 5.596 12.5 12.5q-.002 1.365-.281 2.648l-2.228-2.23a10 10 0 1 0-5.468 8.502 5 5 0 0 0 1.943 1.779A12.45 12.45 0 0 1 15 27.5C8.096 27.5 2.5 21.904 2.5 15S8.096 2.5 15 2.5m8.75 15.215 1.767 1.768a2.5 2.5 0 1 1-3.662.137l.128-.137zM15 18.75c1.832 0 3.481.789 4.625 2.046l-1.181 1.075c-.988-.393-2.171-.621-3.444-.621s-2.456.229-3.444.62l-1.181-1.075A6.23 6.23 0 0 1 15 18.75m-4.375-6.25a1.875 1.875 0 1 1 0 3.75 1.875 1.875 0 0 1 0-3.75m8.75 0a1.875 1.875 0 1 1 0 3.75 1.875 1.875 0 0 1 0-3.75"
      />
    </G>
    <Defs>
      <ClipPath id="sad-face_svg__a">
        <Path fill="#fff" d="M0 0h30v30H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgSadFace;
