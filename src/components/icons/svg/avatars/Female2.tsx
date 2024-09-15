import Svg, { Rect, Mask, G, Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgFemale2 = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={175}
    height={175}
    fill="none"
    {...props}
  >
    <Rect width={175} height={175} fill="#F3F4F6" rx={87.5} />
    <Mask
      id="female-2_svg__a"
      width={175}
      height={175}
      x={0}
      y={0}
      maskUnits="userSpaceOnUse"
      style={{
        maskType: "luminance",
      }}
    >
      <Rect width={175} height={175} fill="#fff" rx={87.5} />
    </Mask>
    <G mask="url(#female-2_svg__a)">
      <Path
        fill="#E9ADA1"
        fillRule="evenodd"
        d="M151.163 154.698a38.9 38.9 0 0 0-21.499-15.334l-20.289-5.683v-14.583c8.577-6.443 14.209-16.582 14.555-28.05a9.7 9.7 0 0 0 3.917.827c5.37 0 9.723-4.353 9.723-9.722 0-5.37-4.353-9.722-9.723-9.722a9.7 9.7 0 0 0-3.888.814v-2.759c0-20.135-16.324-36.458-36.459-36.458S51.042 50.351 51.042 70.486v2.759a9.7 9.7 0 0 0-3.889-.814c-5.37 0-9.722 4.352-9.722 9.722s4.352 9.722 9.722 9.722a9.7 9.7 0 0 0 3.917-.828c.346 11.469 5.978 21.608 14.555 28.051v14.583l-20.289 5.683a38.9 38.9 0 0 0-21.499 15.334L9.722 175.117v14.467h155.556v-14.467z"
        clipRule="evenodd"
      />
      <Path
        fill="#DB8B79"
        fillRule="evenodd"
        d="M87.5 126.389c-4.496 0-8.799-.819-12.775-2.307a36.24 36.24 0 0 0 19.58 5.71 36.3 36.3 0 0 0 15.07-3.262v-7.432a36.3 36.3 0 0 1-21.875 7.291"
        clipRule="evenodd"
      />
      <Path
        stroke="#00004D"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.972}
        d="M52.31 83.572a5.347 5.347 0 0 0-7.238-6.346M122.69 83.572a5.347 5.347 0 0 1 7.239-6.346"
      />
      <Path
        fill="#fff"
        fillRule="evenodd"
        d="M97.222 104.032a9.72 9.72 0 0 1-9.722 9.722 9.72 9.72 0 0 1-9.722-9.722z"
        clipRule="evenodd"
      />
      <Path
        fill="#00004D"
        fillRule="evenodd"
        d="M107.431 83.611a3.89 3.89 0 1 1-7.78-.001 3.89 3.89 0 0 1 7.78.001M75.347 83.611a3.89 3.89 0 1 1-7.778 0 3.89 3.89 0 0 1 7.778 0"
        clipRule="evenodd"
      />
      <Path
        stroke="#00004D"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.972}
        d="m87.5 79.722 4.86 16.528-6.805.972"
      />
      <Path
        fill="#00004D"
        fillRule="evenodd"
        d="M103.27 32.285c.6-1.74.93-3.605.93-5.548 0-9.397-7.617-17.014-17.013-17.014S70.173 17.34 70.173 26.737c0 2.045.361 4.006 1.023 5.823-14.752 6.444-25.015 21.346-25.015 38.444v1.475q.48-.049.972-.05a9.7 9.7 0 0 1 7.31 3.326l.092-.022 2.917-17.5 2.666 6.667a4.86 4.86 0 0 0 4.514 3.055h45.696a4.86 4.86 0 0 0 4.514-3.055l2.666-6.667 2.917 17.5.089.027a9.69 9.69 0 0 1 8.286-3.28v-1.995c0-17.234-10.553-32.002-25.55-38.2"
        clipRule="evenodd"
      />
      <Path
        fill="#1D4ED8"
        fillRule="evenodd"
        d="m165.278 175.117-14.115-20.419a38.9 38.9 0 0 0-21.499-15.334l-20.289-5.683c0 12.081-9.793 21.875-21.875 21.875-12.081 0-21.875-9.794-21.875-21.875l-20.289 5.683a38.9 38.9 0 0 0-21.499 15.334L9.722 175.117v14.466h155.556z"
        clipRule="evenodd"
      />
      <Path
        stroke="#00004D"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={4}
        d="M115.695 85.07c0 6.174-5.006 11.18-11.181 11.18s-11.18-5.006-11.18-11.18c0-6.175 5.006-11.181 11.18-11.181 6.175 0 11.181 5.005 11.181 11.18M59.306 85.07c0 6.174 5.005 11.18 11.18 11.18 6.176 0 11.181-5.006 11.181-11.18 0-6.175-5.005-11.181-11.18-11.181-6.176 0-11.181 5.005-11.181 11.18"
        clipRule="evenodd"
      />
      <Path
        stroke="#00004D"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={4}
        d="M80.974 81.19a6.809 6.809 0 0 1 13.053 0"
      />
    </G>
  </Svg>
);
export default SvgFemale2;
