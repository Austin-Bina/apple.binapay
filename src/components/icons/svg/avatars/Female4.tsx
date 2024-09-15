import Svg, { Rect, Mask, G, Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgFemale4 = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={175}
    height={175}
    fill="none"
    {...props}
  >
    <Rect width={175} height={175} fill="#F3F4F6" rx={87.5} />
    <Mask
      id="female-4_svg__a"
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
    <G mask="url(#female-4_svg__a)">
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
        d="M106.798 33.95a20 20 0 0 0 .147-2.353c0-10.739-8.706-19.444-19.445-19.444s-19.444 8.705-19.444 19.444c0 .797.053 1.58.147 2.353C55.107 40.88 46.18 54.638 46.18 70.486c0 .668.022 1.33.055 1.991q.453-.045.917-.047a9.69 9.69 0 0 1 6.961 2.943 48.8 48.8 0 0 0 21.895-19.742c11.802 11.284 27.389 18.637 44.664 19.977a9.68 9.68 0 0 1 7.174-3.178q.463.002.916.047c.034-.66.057-1.323.057-1.991 0-15.848-8.927-29.605-22.022-36.536"
        clipRule="evenodd"
      />
      <Path
        fill="#1D4ED8"
        fillRule="evenodd"
        d="m165.278 175.117-14.115-20.419a38.9 38.9 0 0 0-21.499-15.334l-20.289-5.683c0 12.081-9.793 21.875-21.875 21.875-12.081 0-21.875-9.794-21.875-21.875l-20.289 5.683a38.9 38.9 0 0 0-21.499 15.334L9.722 175.117v14.466h155.556z"
        clipRule="evenodd"
      />
    </G>
  </Svg>
);
export default SvgFemale4;
