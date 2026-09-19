// rate-display-compact.ts
//
// Same rate calculation as @helpers/rate-display — deliberately NOT
// duplicated here. This just strips the "1 SYMBOL ≈ " prefix from the
// shared helper's output, for screens (like Assets) where the asset name
// is already shown elsewhere in the row and repeating it reads as
// duplicated text.
//
// If the underlying pricing/spread logic ever needs to change, it only
// needs to change in @helpers/rate-display — this file has no branches
// of its own to fall out of sync.

import { getPairRateDisplay } from "@helpers/rate-display";

export { applySpread } from "@helpers/rate-display";

type GetPairRateDisplayParams = Parameters<typeof getPairRateDisplay>[0];

export const getCompactRateDisplay = (params: GetPairRateDisplayParams): string => {
  const full = getPairRateDisplay(params);
  if (!full) return full;
  // Strips a leading "1 SYMBOL ≈ " — leaves everything after it untouched.
  return full.replace(/^1\s+\S+\s*≈\s*/, "");
};
