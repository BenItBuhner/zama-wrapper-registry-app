import { networkConfigs } from "../config/networks";
import type { SupportedNetwork } from "../domain/wrapperPair";
import type { Eip1193Provider } from "./providerAdapter";

export type ProviderNetworkStatus = "matched" | "mismatch" | "provider-missing" | "unknown" | "switch-error";

export interface ProviderNetworkReadiness {
  status: ProviderNetworkStatus;
  currentChainId: number | null;
  expectedChainId: number;
  expectedNetwork: SupportedNetwork;
  detail: string;
}

export async function inspectProviderNetwork(
  provider: Eip1193Provider | null | undefined,
  expectedNetwork: SupportedNetwork,
): Promise<ProviderNetworkReadiness> {
  const expectedChainId = networkConfigs[expectedNetwork].chainId;
  if (!provider) return providerMissing(expectedNetwork, expectedChainId);

  try {
    const chainId = parseChainId(await provider.request({ method: "eth_chainId" }));
    return {
      status: chainId === expectedChainId ? "matched" : "mismatch",
      currentChainId: chainId,
      expectedChainId,
      expectedNetwork,
      detail:
        chainId === expectedChainId
          ? `Wallet provider is on ${networkConfigs[expectedNetwork].label}.`
          : `Wallet provider is on chain ${chainId}; selected wrapper expects ${networkConfigs[expectedNetwork].label}.`,
    };
  } catch (error: unknown) {
    return {
      status: "unknown",
      currentChainId: null,
      expectedChainId,
      expectedNetwork,
      detail: error instanceof Error ? error.message : "Wallet network inspection failed.",
    };
  }
}

export async function switchProviderNetwork(
  provider: Eip1193Provider | null | undefined,
  expectedNetwork: SupportedNetwork,
): Promise<ProviderNetworkReadiness> {
  const expectedChainId = networkConfigs[expectedNetwork].chainId;
  if (!provider) return providerMissing(expectedNetwork, expectedChainId);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(expectedChainId) }],
    });
    return inspectProviderNetwork(provider, expectedNetwork);
  } catch (error: unknown) {
    return {
      status: "switch-error",
      currentChainId: null,
      expectedChainId,
      expectedNetwork,
      detail: error instanceof Error ? error.message : "Wallet network switch failed.",
    };
  }
}

function providerMissing(expectedNetwork: SupportedNetwork, expectedChainId: number): ProviderNetworkReadiness {
  return {
    status: "provider-missing",
    currentChainId: null,
    expectedChainId,
    expectedNetwork,
    detail: "No injected EIP-1193 wallet provider was found in this browser session.",
  };
}

function parseChainId(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^0x[0-9a-f]+$/i.test(value)) return Number.parseInt(value, 16);
  throw new Error("Provider returned invalid chain ID");
}

function toHexChainId(value: number): string {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`Invalid chain ID: ${value}`);
  return `0x${value.toString(16)}`;
}
