export type ReadinessStatus = "complete" | "local-only" | "external-gate";

export interface ReadinessItem {
  label: string;
  status: ReadinessStatus;
  detail: string;
}

export interface ReferenceLink {
  label: string;
  href: string;
}

export const zamaReferenceLinks: ReferenceLink[] = [
  {
    label: "Zama protocol apps addresses",
    href: "https://github.com/zama-ai/protocol-apps/blob/main/docs/addresses.md",
  },
  {
    label: "Confidential token wrapper guide",
    href: "https://docs.zama.org/protocol/protocol-guides/confidential-wrapper",
  },
  {
    label: "Registry contract guide",
    href: "https://docs.zama.org/protocol/protocol-apps/registry-contract",
  },
];

export function buildSubmissionReadiness(hasChainRpc: boolean): ReadinessItem[] {
  return [
    {
      label: "Registry discovery",
      status: hasChainRpc ? "complete" : "local-only",
      detail: hasChainRpc
        ? "Reads configured Sepolia/mainnet wrapper registries through viem and validates the isValid flag."
        : "Uses seeded official-address data until VITE_SEPOLIA_RPC_URL or VITE_MAINNET_RPC_URL is provided.",
    },
    {
      label: "Wrap and unwrap transactions",
      status: "external-gate",
      detail: "Requires wallet signing, ERC-20 approval, wrap call, unwrap request, and finalize after public decryption.",
    },
    {
      label: "Balance decryption",
      status: "external-gate",
      detail: "Requires relayer SDK user-decryption plumbing and EIP-712 signature handling.",
    },
    {
      label: "Submission assets",
      status: "external-gate",
      detail: "Requires public deployment, demo video, article or X thread, and final Zama form submission.",
    },
  ];
}
