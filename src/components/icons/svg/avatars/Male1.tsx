import Svg, { Rect, Path, Mask, G } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgMale1 = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={177}
    height={177}
    fill="none"
    {...props}
  >
    <Rect width={176} height={176} x={0.5} y={0.5} rx={88} />
    <Path
      fill="#F3F4F6"
      fillRule="evenodd"
      d="M88.5 176c48.325 0 87.5-39.175 87.5-87.5S136.825 1 88.5 1 1 40.175 1 88.5 40.175 176 88.5 176"
      clipRule="evenodd"
    />
    <Mask
      id="male-1_svg__a"
      width={175}
      height={175}
      x={1}
      y={1}
      maskUnits="userSpaceOnUse"
      style={{
        maskType: "luminance",
      }}
    >
      <Path
        fill="#fff"
        fillRule="evenodd"
        d="M88.5 176c48.325 0 87.5-39.175 87.5-87.5S136.825 1 88.5 1 1 40.175 1 88.5 40.175 176 88.5 176"
        clipRule="evenodd"
      />
    </Mask>
    <G mask="url(#male-1_svg__a)">
      <Path
        fill="#E9ADA1"
        fillRule="evenodd"
        d="M152.163 155.698a38.9 38.9 0 0 0-21.499-15.334l-20.289-5.683v-14.583c8.577-6.443 14.209-16.582 14.555-28.05a9.7 9.7 0 0 0 3.917.827c5.37 0 9.723-4.353 9.723-9.722 0-5.37-4.353-9.722-9.723-9.722a9.7 9.7 0 0 0-3.888.814v-2.759c0-20.135-16.324-36.458-36.459-36.458S52.042 51.351 52.042 71.486v2.759a9.7 9.7 0 0 0-3.889-.814c-5.37 0-9.722 4.352-9.722 9.722s4.352 9.722 9.722 9.722a9.7 9.7 0 0 0 3.917-.828c.346 11.469 5.978 21.608 14.555 28.051v14.583l-20.289 5.683a38.9 38.9 0 0 0-21.499 15.334l-14.115 20.419v14.467h155.556v-14.467z"
        clipRule="evenodd"
      />
      <Path
        fill="#DB8B79"
        fillRule="evenodd"
        d="M88.5 127.389c-4.496 0-8.799-.819-12.775-2.307a36.24 36.24 0 0 0 19.58 5.71 36.3 36.3 0 0 0 15.07-3.262v-7.432a36.3 36.3 0 0 1-21.875 7.291"
        clipRule="evenodd"
      />
      <Path
        stroke="#00004D"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.096}
        d="M53.31 84.572a5.347 5.347 0 0 0-7.238-6.346M123.691 84.572a5.348 5.348 0 0 1 7.238-6.346"
      />
      <Path
        fill="#fff"
        fillRule="evenodd"
        d="M98.222 105.032a9.72 9.72 0 0 1-9.722 9.722 9.72 9.72 0 0 1-9.722-9.722z"
        clipRule="evenodd"
      />
      <Path
        fill="#00004D"
        fillRule="evenodd"
        d="M108.431 84.611a3.889 3.889 0 1 1-7.778 0 3.889 3.889 0 0 1 7.778 0M76.347 84.611a3.889 3.889 0 1 1-7.778 0 3.889 3.889 0 0 1 7.778 0"
        clipRule="evenodd"
      />
      <Path
        stroke="#00004D"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.096}
        d="M88.5 80.722 93.36 97.25l-6.806.972"
      />
      <Path
        fill="#00004D"
        fillRule="evenodd"
        d="M127.389 73.552v-2.066c0-7.46-2.105-14.427-5.746-20.346a39.1 39.1 0 0 0-13.652-13.3A38.7 38.7 0 0 0 88.5 32.596a38.7 38.7 0 0 0-19.49 5.242 39.1 39.1 0 0 0-13.653 13.3 38.7 38.7 0 0 0-5.746 20.347v2.066a9.7 9.7 0 0 1 5.264 2.587 48.7 48.7 0 0 0 10.54-15.822A48.4 48.4 0 0 0 88.5 66.139a48.4 48.4 0 0 0 23.085-5.822 48.7 48.7 0 0 0 10.54 15.822 9.7 9.7 0 0 1 5.264-2.587"
        clipRule="evenodd"
      />
      <Path
        fill="#1D4ED8"
        fillRule="evenodd"
        d="m166.278 176.117-14.115-20.419a38.9 38.9 0 0 0-21.5-15.334l-20.288-5.683c0 12.081-9.794 21.875-21.875 21.875s-21.875-9.794-21.875-21.875l-20.289 5.683a38.9 38.9 0 0 0-21.5 15.334l-14.114 20.419v14.466h155.556z"
        clipRule="evenodd"
      />
    </G>
  </Svg>
);
export default SvgMale1;
