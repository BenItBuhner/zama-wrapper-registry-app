import { formatTokenAmount, type WrapperPair } from "../domain/wrapperPair";
import { buildUserDecryptionDraft } from "./relayerUserDecryption";

export type ActionKind = "faucet" | "wrap" | "unwrap" | "decrypt";

export interface ActionStep {
  label: string;
  status: "ready" | "requires-wallet" | "requires-relayer" | "not-supported";
  detail: string;
}

export function buildActionPlan(pair: WrapperPair): Record<ActionKind, ActionStep[]> {
  return {
    faucet: [
      {
        label: "Mint test underlying",
        status: pair.faucetSupported ? "requires-wallet" : "not-supported",
        detail: pair.faucetSupported
          ? `Call the Sepolia mock token mint for ${pair.underlying.symbol}.`
          : "Mainnet wrappers do not expose a faucet flow.",
      },
    ],
    wrap: [
      {
        label: "Approve wrapper",
        status: "requires-wallet",
        detail: `Approve ${pair.wrapperAddress} to spend the selected ${pair.underlying.symbol} amount.`,
      },
      {
        label: "Wrap",
        status: "requires-wallet",
        detail: `Call wrapper wrap with underlying base units. Rate: ${pair.rate.toString()}.`,
      },
    ],
    unwrap: [
      {
        label: "Request unwrap",
        status: "requires-relayer",
        detail: "Create or select an encrypted amount and submit the unwrap request.",
      },
      {
        label: "Finalize unwrap",
        status: "requires-relayer",
        detail: "Wait for public decryption proof, then finalize the underlying-token transfer.",
      },
    ],
    decrypt: [
      {
        label: "User decryption",
        status: "requires-relayer",
        detail: `Request EIP-712 user decryption for ${pair.confidential.symbol} balance.`,
      },
    ],
  };
}

export async function decryptMockBalance(pair: WrapperPair): Promise<string> {
  await Promise.resolve();
  const value = pair.network === "mainnet" ? 0n : 125_000_000n;
  return `${formatTokenAmount(value, pair.confidential.decimals)} ${pair.confidential.symbol}`;
}

export function buildMockUserDecryptionDraft(pair: WrapperPair, userAddress: string) {
  return buildUserDecryptionDraft({
    handles: [
      {
        handle: `mock-${pair.id}-balance-handle`,
        contractAddress: pair.confidential.address,
        bitLength: 64,
      },
    ],
    userAddress,
    publicKey: "mock-relayer-public-key",
    startTimestamp: 1780448000,
    durationDays: 10,
  });
}
