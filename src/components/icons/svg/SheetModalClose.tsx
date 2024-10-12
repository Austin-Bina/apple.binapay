import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgSheetModalClose = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#6D7280"
      d="M3.338 1.217a1.5 1.5 0 0 0-2.121 2.121L9.879 12l-8.662 8.662a1.5 1.5 0 1 0 2.121 2.121L12 14.121l8.662 8.662a1.5 1.5 0 1 0 2.121-2.12L14.121 12l8.663-8.662a1.5 1.5 0 0 0-2.122-2.121L12 9.879z"
    />
  </Svg>
);
export default SvgSheetModalClose;
