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
        label: "Article draft",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/ARTICLE-DRAFT.md",
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
        detail: "The app separates passive wallet inspection from explicit user-clicked connection, chain switching, and signing boundaries.",
      },
      {
        label: "Unsigned transaction review",
        status: "ready",
        detail: "Sepolia faucet, ERC-20 approval, and wrapper wrap calldata are prepared for review without submitting transactions.",
      },
      {
        label: "Relayer user-decryption boundary",
        status: "local-validation",
        detail: "Request and signing payload shapes are typed and tested; live relayer SDK execution still needs a real encrypted handle and wallet signature.",
      },
      {
        label: "Final bounty evidence",
        status: "external-gate",
        detail: "Needs real Sepolia demo transactions, live user-decryption output, a recorded video, article/X publication, and final form submission.",
      },
    ],
    remainingExternalGates: [
      "Connect a real browser wallet and execute Sepolia-only faucet/approve/wrap demo transactions.",
      "Run live relayer SDK user decryption against a real encrypted balance handle.",
      "Record and publish the demo video.",
      "Publish the article or X thread from the prepared draft.",
      "Submit the Zama bounty form with the prepared answers and payout details.",
    ],
  };
}
