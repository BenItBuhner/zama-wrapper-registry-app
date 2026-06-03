export type EvidenceStatus = "ready" | "local-validation" | "external-gate";

export interface EvidenceLink {
  label: string;
  href: string;
  status: EvidenceStatus;
}

export interface EvidenceChecklistItem {
  label: string;
  status: EvidenceStatus;
  detail: string;
}

export interface SubmissionEvidencePacket {
  publicLinks: EvidenceLink[];
  validationCommands: string[];
  checklist: EvidenceChecklistItem[];
  remainingExternalGates: string[];
}

export function buildSubmissionEvidencePacket(): SubmissionEvidencePacket {
  return {
    publicLinks: [
      {
        label: "Public repository",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app",
        status: "ready",
      },
      {
        label: "Public demo",
        href: "https://benitbuhner.github.io/zama-wrapper-registry-app/",
        status: "ready",
      },
      {
        label: "Submission packet",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/SUBMISSION-PACKET.md",
        status: "ready",
      },
      {
        label: "Demo script",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/DEMO-SCRIPT.md",
        status: "ready",
      },
      {
        label: "Published article",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/ARTICLE.md",
        status: "ready",
      },
      {
        label: "Demo video",
        href: "https://benitbuhner.github.io/zama-wrapper-registry-app/zama-wrapper-registry-demo.webm",
        status: "ready",
      },
      {
        label: "Relayer user-decryption plan",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/RELAYER-USER-DECRYPTION-PLAN.md",
        status: "ready",
      },
      {
        label: "Form answers draft",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/FORM-ANSWERS-DRAFT.md",
        status: "ready",
      },
    ],
    validationCommands: ["bun run test", "bun run build", "bun run build:pages"],
    checklist: [
      {
        label: "Official registry/address coverage",
        status: "ready",
        detail: "Sepolia and mainnet wrapper pairs are seeded from official protocol-app addresses and can optionally be validated through configured RPC.",
      },
      {
        label: "Wallet boundary",
        status: "ready",
        detail: "The app separates passive wallet inspection from explicit user-clicked connection, chain switching, typed-data request preparation, and signing prompts.",
      },
      {
        label: "Unsigned transaction review",
        status: "ready",
        detail: "Sepolia faucet, ERC-20 approval, and wrapper wrap calldata are prepared and can be submitted only through explicit Sepolia wallet clicks.",
      },
      {
        label: "Relayer user-decryption boundary",
        status: "local-validation",
        detail: "Request and signing payload shapes are typed, tested, and wired into explicit UI controls; live relayer SDK execution still needs a real encrypted handle and wallet signature.",
      },
      {
        label: "Final bounty evidence",
        status: "external-gate",
        detail: "Demo video and article are published; final bounty evidence still needs real Sepolia transaction hashes, live user-decryption output, final form submission, and payout details.",
      },
    ],
    remainingExternalGates: [
      "Connect a real browser wallet and execute Sepolia-only faucet/approve/wrap demo transactions through the explicit submit controls.",
      "Use the explicit UI signing control with a real browser wallet to collect a live user-decryption EIP-712 signature.",
      "Run live relayer SDK user decryption against a real encrypted balance handle.",
      "Replace or supplement the credential-free demo video if the bounty reviewer requires live wallet transaction footage.",
      "Use the published article link or replace it with an X thread if the final form requires X specifically.",
      "Submit the Zama bounty form with the prepared answers and payout details.",
    ],
  };
}
