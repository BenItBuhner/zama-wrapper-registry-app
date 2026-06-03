import { getAddress, isAddress } from "viem";

export type SupportedNetwork = "sepolia" | "mainnet";

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface WrapperPair {
  id: string;
  network: SupportedNetwork;
  underlying: TokenMetadata;
  confidential: TokenMetadata;
  wrapperAddress: string;
  rate: bigint;
  totalValueShielded: bigint;
  faucetSupported: boolean;
}

export interface PairHealth {
  pairId: string;
  checks: Array<{ label: string; ok: boolean; detail: string }>;
}

export function normalizeAddress(value: string): string {
  if (!isAddress(value)) {
    throw new Error(`Invalid Ethereum address: ${value}`);
  }
  return getAddress(value);
}

export function formatTokenAmount(value: bigint, decimals: number): string {
  if (decimals < 0 || decimals > 36) throw new Error(`Unsupported decimals: ${decimals}`);
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = value % scale;
  if (fraction === 0n) return whole.toString();
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fractionText}`;
}

export function validatePair(pair: WrapperPair): PairHealth {
  const checks = [
    {
      label: "underlying address",
      ok: isAddress(pair.underlying.address),
      detail: pair.underlying.address,
    },
    {
      label: "confidential address",
      ok: isAddress(pair.confidential.address),
      detail: pair.confidential.address,
    },
    {
      label: "wrapper address",
      ok: isAddress(pair.wrapperAddress),
      detail: pair.wrapperAddress,
    },
    {
      label: "positive conversion rate",
      ok: pair.rate > 0n,
      detail: pair.rate.toString(),
    },
    {
      label: "supported wrapper decimals",
      ok: pair.confidential.decimals <= 6,
      detail: `${pair.confidential.decimals} decimals`,
    },
  ];
  return { pairId: pair.id, checks };
}

export function pairIsHealthy(pair: WrapperPair): boolean {
  return validatePair(pair).checks.every((check) => check.ok);
}
