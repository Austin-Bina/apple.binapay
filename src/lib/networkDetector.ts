type NetworkConfig = {
  name: string;
  prefixes: string[];
};

export const NETWORK_CONFIG: NetworkConfig[] = [
    { name: "mtn", prefixes: ["0803", "0806", "0810", "0813", "0814", "0816", "0703", "0704", "0706", "07025", "07026", "0707", "0903", "0906", "0913", "0916"] },
    { name: "airtel", prefixes: ["0802", "0808", "0812", "0701", "0708", "0901", "0902", "0904", "0907", "0912", "0911"] },
    { name: "glo", prefixes: ["0805", "0807", "0811", "0815", "0705", "0905", "0915", "0817"] },
    { name: "9mobile", prefixes: ["0809", "0817", "0818", "0908", "0909"] },
];


export function detectNetworkFromPhone(phone: string): string | null {
  const normalized = normalizePhone(phone);

  if (!normalized || normalized.length < 4) return null;

  const prefix = normalized.slice(0, 4);

  const match = NETWORK_CONFIG.find(n =>
    n.prefixes.includes(prefix)
  );

  return match?.name || null;
}

function normalizePhone(phone: string): string {
  if (!phone) return "";

  // remove spaces and non-digits
  let clean = phone.replace(/\D/g, "");

  // convert +234 / 234 → 0
  if (clean.startsWith("234")) {
    clean = "0" + clean.slice(3);
  }

  return clean;
}
