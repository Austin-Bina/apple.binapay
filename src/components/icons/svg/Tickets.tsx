import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgTickets = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={40}
    height={40}
    fill="none"
    {...props}
  >
    <G clipPath="url(#tickets_svg__a)">
      <Path
        fill="#2563EB"
        fillRule="evenodd"
        d="M8.333 6.792a4.875 4.875 0 0 0-4.875 4.874v5c0 .852.69 1.542 1.542 1.542a1.792 1.792 0 1 1 0 3.584c-.851 0-1.542.69-1.542 1.541v5a4.875 4.875 0 0 0 4.875 4.875h23.334a4.875 4.875 0 0 0 4.875-4.875v-5c0-.851-.69-1.541-1.542-1.541a1.792 1.792 0 0 1 0-3.584c.851 0 1.542-.69 1.542-1.541v-5a4.875 4.875 0 0 0-4.875-4.875H8.333M7.066 10.4a1.8 1.8 0 0 1 1.267-.525h15.125v1.791a1.542 1.542 0 0 0 3.084 0V9.875h5.125a1.79 1.79 0 0 1 1.791 1.791v3.709a4.876 4.876 0 0 0 0 9.25v3.708a1.79 1.79 0 0 1-1.791 1.792h-5.334v-1.792a1.333 1.333 0 0 0-2.666 0v1.792H8.333a1.79 1.79 0 0 1-1.791-1.792v-3.708a4.875 4.875 0 0 0 0-9.25v-3.709c0-.475.188-.93.524-1.266M25 16.79c-.851 0-1.542.69-1.542 1.542v3.334a1.542 1.542 0 0 0 3.084 0v-3.334c0-.851-.69-1.541-1.542-1.541"
        clipRule="evenodd"
      />
    </G>
    <Defs>
      <ClipPath id="tickets_svg__a">
        <Path fill="#fff" d="M0 0h40v40H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default SvgTickets;
