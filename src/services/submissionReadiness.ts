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
  {
    label: "User decryption guide",
    href: "https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption",
  },
  {
    label: "Submission packet",
    href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/SUBMISSION-PACKET.md",
  },
  {
    label: "Demo script",
    href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/DEMO-SCRIPT.md",
  },
  {
    label: "Published article",
    href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/ARTICLE.md",
  },
  {
    label: "Demo video",
    href: "https://benitbuhner.github.io/zama-wrapper-registry-app/zama-wrapper-registry-demo.webm",
  },
  {
    label: "Relayer user-decryption plan",
    href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/RELAYER-USER-DECRYPTION-PLAN.md",
  },
  {
    label: "Form answers draft",
    href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/FORM-ANSWERS-DRAFT.md",
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
      detail: "Public integration plan is drafted; live completion requires relayer SDK plumbing and EIP-712 signature handling.",
    },
    {
      label: "Submission assets",
      status: "external-gate",
      detail: "Public demo, packet, demo script, article, demo video, and form-answer draft are ready; still requires live wallet/user-decryption evidence and form submission.",
    },
  ];
}
