// utils/resolveIconUrl.ts
const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

export function resolveIconUrl(iconPath?: string | null): string | undefined {
  if (!iconPath) return undefined;
  return iconPath.startsWith("http")
    ? iconPath
    : `${BASE_URL}/storage/app/public/crypto-icons/${iconPath}`;
}
