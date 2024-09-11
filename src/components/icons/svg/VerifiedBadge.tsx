import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgVerifiedBadge = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    {...props}
  >
    <Path
      fill="#2563EB"
      fillRule="evenodd"
      d="M7.52 4.146a3.68 3.68 0 0 0 2.094-.867 3.68 3.68 0 0 1 4.772 0c.59.502 1.322.805 2.094.867a3.68 3.68 0 0 1 3.374 3.374 3.68 3.68 0 0 0 .867 2.094 3.68 3.68 0 0 1 0 4.772 3.68 3.68 0 0 0-.867 2.094 3.68 3.68 0 0 1-3.374 3.374 3.68 3.68 0 0 0-2.094.867 3.68 3.68 0 0 1-4.772 0 3.68 3.68 0 0 0-2.094-.867 3.68 3.68 0 0 1-3.374-3.374 3.68 3.68 0 0 0-.867-2.094 3.68 3.68 0 0 1 0-4.772c.502-.59.805-1.322.867-2.094A3.68 3.68 0 0 1 7.52 4.146m8.928 6.302a1.2 1.2 0 0 0-1.697-1.697L10.8 12.703 9.248 11.15a1.2 1.2 0 1 0-1.697 1.697l2.4 2.4a1.2 1.2 0 0 0 1.697 0z"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgVerifiedBadge;
