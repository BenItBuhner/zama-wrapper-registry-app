import type { WrapperPair } from "../domain/wrapperPair";
import { buildMockUserDecryptionDraft } from "./wrapperActions";
import {
  prepareUserDecryptionSigningRequest,
  signUserDecryptionRequest,
  type PreparedUserDecryptionSigningRequest,
  type WalletAdapter,
} from "./signingAdapter";

export interface UserDecryptionSigningSession {
  status: "ready" | "blocked";
  draftSummary: {
    signerAddress: string;
    contractAddresses: string[];
    totalBitLength: number;
    durationDays: string;
  } | null;
  request: PreparedUserDecryptionSigningRequest | null;
  blockers: string[];
  detail: string;
}

export function buildUserDecryptionSigningSession(
  pair: WrapperPair,
  wallet: WalletAdapter,
): UserDecryptionSigningSession {
  if (!wallet.address) {
    return {
      status: "blocked",
      draftSummary: null,
      request: null,
      blockers: ["wallet:not_connected"],
      detail: "Connect a wallet before preparing the relayer user-decryption typed-data request.",
    };
  }

  const draft = buildMockUserDecryptionDraft(pair, wallet.address);
  const request = prepareUserDecryptionSigningRequest(wallet, draft);

  return {
    status: request.canSign ? "ready" : "blocked",
    draftSummary: {
      signerAddress: draft.signerAddress,
      contractAddresses: draft.contractAddresses,
      totalBitLength: draft.totalBitLength,
      durationDays: draft.durationDays,
    },
    request,
    blockers: request.blockers,
    detail: request.canSign
      ? "Typed-data payload is prepared and can be sent to the connected wallet on explicit request."
      : `Typed-data payload is prepared, but signing is blocked by ${request.blockers.join(", ")}.`,
  };
}

export async function signUserDecryptionSigningSession(
  wallet: WalletAdapter,
  session: UserDecryptionSigningSession,
): Promise<string> {
  if (!session.request) throw new Error("User-decryption signing request has not been prepared");
  return signUserDecryptionRequest(wallet, session.request);
}
