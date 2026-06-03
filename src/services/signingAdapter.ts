import { normalizeAddress } from "../domain/wrapperPair";
import type { UserDecryptionDraft } from "./relayerUserDecryption";

export interface Eip712Domain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
}

export interface Eip712Field {
  name: string;
  type: string;
}

export interface UserDecryptionSigningPayload {
  domain: Eip712Domain;
  types: {
    UserDecryptRequestVerification: Eip712Field[];
  };
  message: {
    publicKey: string;
    contractAddresses: string[];
    startTimestamp: string;
    durationDays: string;
  };
}

export interface WalletAdapter {
  address: string | null;
  signTypedData?: (payload: UserDecryptionSigningPayload) => Promise<string>;
}

export interface PreparedUserDecryptionSigningRequest {
  signerAddress: string;
  payload: UserDecryptionSigningPayload;
  canSign: boolean;
  blockers: string[];
}

export function prepareUserDecryptionSigningRequest(
  wallet: WalletAdapter,
  draft: UserDecryptionDraft,
): PreparedUserDecryptionSigningRequest {
  const blockers: string[] = [];
  const walletAddress = wallet.address ? normalizeAddress(wallet.address) : null;

  if (!walletAddress) blockers.push("wallet:not_connected");
  if (walletAddress && walletAddress !== draft.signerAddress) blockers.push("wallet:address_mismatch");
  if (!wallet.signTypedData) blockers.push("wallet:sign_typed_data_unavailable");

  const payload: UserDecryptionSigningPayload = {
    domain: {
      name: "ZamaRelayerUserDecryption",
      version: "1",
    },
    types: {
      UserDecryptRequestVerification: [
        { name: "publicKey", type: "string" },
        { name: "contractAddresses", type: "address[]" },
        { name: "startTimestamp", type: "uint256" },
        { name: "durationDays", type: "uint256" },
      ],
    },
    message: {
      publicKey: draft.publicKey,
      contractAddresses: draft.contractAddresses,
      startTimestamp: draft.startTimeStamp,
      durationDays: draft.durationDays,
    },
  };

  return {
    signerAddress: draft.signerAddress,
    payload,
    canSign: blockers.length === 0,
    blockers,
  };
}

export async function signUserDecryptionRequest(
  wallet: WalletAdapter,
  request: PreparedUserDecryptionSigningRequest,
): Promise<string> {
  if (!request.canSign) throw new Error(`Cannot sign user-decryption request: ${request.blockers.join(", ")}`);
  if (!wallet.signTypedData) throw new Error("Wallet signTypedData capability disappeared");
  return wallet.signTypedData(request.payload);
}
