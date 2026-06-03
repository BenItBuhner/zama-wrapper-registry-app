import { createPublicClient, http, type Address, type PublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { networkConfigs, seededOfficialPairs } from "../config/networks";
import { normalizeAddress, type SupportedNetwork, type WrapperPair } from "../domain/wrapperPair";

export interface RegistryPairRecord {
  tokenAddress: string;
  confidentialTokenAddress: string;
  isValid: boolean;
}

export interface RegistryDataSource {
  mode: "mock" | "chain";
  listWrapperPairs(network?: SupportedNetwork): Promise<WrapperPair[]>;
  validatePair(pair: WrapperPair): Promise<RegistryPairRecord>;
}

export const wrappersRegistryAbi = [
  {
    type: "function",
    name: "getTokenConfidentialTokenPairs",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "confidentialTokenAddress", type: "address" },
          { name: "isValid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getConfidentialTokenAddress",
    stateMutability: "view",
    inputs: [{ name: "tokenAddress", type: "address" }],
    outputs: [
      { name: "isValid", type: "bool" },
      { name: "confidentialToken", type: "address" },
    ],
  },
] as const;

export function makeMockRegistryDataSource(): RegistryDataSource {
  return {
    mode: "mock",
    async listWrapperPairs(network?: SupportedNetwork) {
      await Promise.resolve();
      return network ? seededOfficialPairs.filter((pair) => pair.network === network) : [...seededOfficialPairs];
    },
    async validatePair(pair: WrapperPair) {
      await Promise.resolve();
      return {
        tokenAddress: pair.underlying.address,
        confidentialTokenAddress: pair.confidential.address,
        isValid: true,
      };
    },
  };
}

export function makeChainRegistryDataSource(rpcUrls: Partial<Record<SupportedNetwork, string>>): RegistryDataSource {
  const clients = new Map<SupportedNetwork, PublicClient>();

  function clientFor(network: SupportedNetwork): PublicClient {
    const existing = clients.get(network);
    if (existing) return existing;
    const rpcUrl = rpcUrls[network];
    if (!rpcUrl) throw new Error(`Missing RPC URL for ${network}`);
    const client = createPublicClient({
      chain: network === "sepolia" ? sepolia : mainnet,
      transport: http(rpcUrl),
    });
    clients.set(network, client);
    return client;
  }

  async function registryRecords(network: SupportedNetwork): Promise<RegistryPairRecord[]> {
    const config = networkConfigs[network];
    const records = await clientFor(network).readContract({
      address: config.registryAddress as Address,
      abi: wrappersRegistryAbi,
      functionName: "getTokenConfidentialTokenPairs",
    });
    return records.map((record) => ({
      tokenAddress: normalizeAddress(record.tokenAddress),
      confidentialTokenAddress: normalizeAddress(record.confidentialTokenAddress),
      isValid: record.isValid,
    }));
  }

  return {
    mode: "chain",
    async listWrapperPairs(network?: SupportedNetwork) {
      const networks: SupportedNetwork[] = network ? [network] : ["sepolia", "mainnet"];
      const recordsByNetwork = new Map<SupportedNetwork, RegistryPairRecord[]>();
      await Promise.all(networks.map(async (nextNetwork) => recordsByNetwork.set(nextNetwork, await registryRecords(nextNetwork))));

      return seededOfficialPairs.filter((pair) =>
        recordsByNetwork
          .get(pair.network)
          ?.some(
            (record) =>
              record.isValid &&
              record.tokenAddress === pair.underlying.address &&
              record.confidentialTokenAddress === pair.confidential.address,
          ),
      );
    },
    async validatePair(pair: WrapperPair) {
      const [isValid, confidentialToken] = await clientFor(pair.network).readContract({
        address: networkConfigs[pair.network].registryAddress as Address,
        abi: wrappersRegistryAbi,
        functionName: "getConfidentialTokenAddress",
        args: [pair.underlying.address as Address],
      });
      return {
        tokenAddress: pair.underlying.address,
        confidentialTokenAddress: normalizeAddress(confidentialToken),
        isValid: Boolean(isValid) && normalizeAddress(confidentialToken) === pair.confidential.address,
      };
    },
  };
}

export function makeConfiguredRegistryDataSource(env: Record<string, string | undefined> = import.meta.env): RegistryDataSource {
  const sepoliaRpc = env.VITE_SEPOLIA_RPC_URL;
  const mainnetRpc = env.VITE_MAINNET_RPC_URL;
  if (sepoliaRpc || mainnetRpc) {
    return makeChainRegistryDataSource({ sepolia: sepoliaRpc, mainnet: mainnetRpc });
  }
  return makeMockRegistryDataSource();
}
