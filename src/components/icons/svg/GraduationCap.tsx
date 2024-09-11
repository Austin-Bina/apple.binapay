import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgGraduationCap = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={36}
    height={33}
    fill="none"
    {...props}
  >
    <Path
      fill="#2563EB"
      fillRule="evenodd"
      d="M35.9 9.423 18 .142.1 9.423v2.645L18 22.013l14.6-8.111v6.623h3.3zM5.694 11.401l-1.081-.6L18 3.858 31.387 10.8l-3.581 1.99L18 18.238 8.194 12.79zm3.956 7.557-3.3-1.833v8.965L18 32.643l11.65-6.553v-8.965l-3.3 1.833v5.202L18 28.857 9.65 24.16z"
      clipRule="evenodd"
    />
  </Svg>
);
export default SvgGraduationCap;
