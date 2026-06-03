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
        label: "Season 3 bounty form",
        href: "https://forms.zama.org/developer-program-mainnet-season3-bounty-track",
        status: "external-gate",
      },
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
        label: "X thread draft",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/X-THREAD-DRAFT.md",
        status: "local-validation",
      },
      {
        label: "Real-person pitch script",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/REAL-PERSON-PITCH-SCRIPT.md",
        status: "local-validation",
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
        label: "Live relayer source",
        href: "https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/src/services/liveRelayerUserDecryption.ts",
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
        detail: "@zama-fhe/relayer-sdk is installed and the live init/EIP-712/userDecrypt boundary is typed and tested; live execution still needs a real encrypted handle and wallet signature.",
      },
      {
        label: "Final bounty evidence",
        status: "external-gate",
        detail: "Credential-free demo assets are published; final bounty evidence still needs real Sepolia transaction hashes, live user-decryption output, real-person pitch/X evidence, final form submission, and payout details.",
      },
    ],
    remainingExternalGates: [
      "Connect a real browser wallet and execute Sepolia-only faucet/approve/wrap demo transactions through the explicit submit controls.",
      "Use the explicit UI signing control with a real browser wallet to collect a live user-decryption EIP-712 signature.",
      "Run live relayer SDK user decryption against a real encrypted balance handle.",
      "Record or obtain a real-person 3-minute pitch video; the Season 3 form says AI-generated video or voice will not be considered.",
      "Publish the required X thread or X article introducing the project.",
      "Submit the Season 3 Zama bounty form before July 7, 2026 at 23:59 AOE with the prepared answers and payout details.",
    ],
  };
}
