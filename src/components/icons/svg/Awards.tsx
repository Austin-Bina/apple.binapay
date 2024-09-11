import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgAwards = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <Path
      fill="#2563EB"
      d="M8.75 5A3.75 3.75 0 0 0 5 8.75v2.981c0 1.3.673 2.507 1.778 3.19l9.665 5.975a7.5 7.5 0 1 0 7.114 0l9.665-5.975A3.75 3.75 0 0 0 35 11.731V8.75A3.75 3.75 0 0 0 31.25 5zM7.5 8.75c0-.69.56-1.25 1.25-1.25h3.75v8.02l-4.407-2.725A1.25 1.25 0 0 1 7.5 11.73zm7.5 8.314V7.5h10v9.564l-4.343 2.685a1.25 1.25 0 0 1-1.314 0zm12.5-1.545V7.5h3.75c.69 0 1.25.56 1.25 1.25v2.981c0 .434-.224.836-.593 1.064zM15 27.5a5 5 0 1 1 10 0 5 5 0 0 1-10 0"
    />
  </Svg>
);
export default SvgAwards;
