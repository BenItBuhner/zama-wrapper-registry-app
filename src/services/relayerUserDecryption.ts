import { normalizeAddress } from "../domain/wrapperPair";

export interface CiphertextHandlePair {
  handle: string;
  contractAddress: string;
  bitLength: number;
}

export interface UserDecryptionDraftInput {
  handles: CiphertextHandlePair[];
  userAddress: string;
  publicKey: string;
  startTimestamp: number;
  durationDays: number;
}

export interface UserDecryptionDraft {
  handleContractPairs: Array<{ handle: string; contractAddress: string }>;
  contractAddresses: string[];
  signerAddress: string;
  publicKey: string;
  startTimeStamp: string;
  durationDays: string;
  totalBitLength: number;
}

const maxUserDecryptBits = 2048;

export function buildUserDecryptionDraft(input: UserDecryptionDraftInput): UserDecryptionDraft {
  if (input.handles.length === 0) throw new Error("At least one ciphertext handle is required");
  if (!input.publicKey.trim()) throw new Error("Relayer public key is required");
  if (!Number.isSafeInteger(input.startTimestamp) || input.startTimestamp <= 0) {
    throw new Error("Start timestamp must be a positive safe integer");
  }
  if (!Number.isSafeInteger(input.durationDays) || input.durationDays <= 0) {
    throw new Error("Duration days must be a positive safe integer");
  }

  const signerAddress = normalizeAddress(input.userAddress);
  const normalizedPairs = input.handles.map((pair) => {
    if (!pair.handle.trim()) throw new Error("Ciphertext handle is required");
    if (!Number.isSafeInteger(pair.bitLength) || pair.bitLength <= 0) {
      throw new Error(`Invalid ciphertext bit length for ${pair.handle}`);
    }

    return {
      handle: pair.handle.trim(),
      contractAddress: normalizeAddress(pair.contractAddress),
      bitLength: pair.bitLength,
    };
  });

  const totalBitLength = normalizedPairs.reduce((sum, pair) => sum + pair.bitLength, 0);
  if (totalBitLength > maxUserDecryptBits) {
    throw new Error(`User decryption batch exceeds ${maxUserDecryptBits} bits`);
  }

  const contractAddresses = [...new Set(normalizedPairs.map((pair) => pair.contractAddress))];

  return {
    handleContractPairs: normalizedPairs.map(({ handle, contractAddress }) => ({ handle, contractAddress })),
    contractAddresses,
    signerAddress,
    publicKey: input.publicKey.trim(),
    startTimeStamp: input.startTimestamp.toString(),
    durationDays: input.durationDays.toString(),
    totalBitLength,
  };
}

