import { mainnet, sepolia } from "viem/chains";
import { normalizeAddress, type SupportedNetwork, type TokenMetadata, type WrapperPair } from "../domain/wrapperPair";

export interface NetworkConfig {
  id: SupportedNetwork;
  chainId: number;
  label: string;
  registryAddress: string;
  blockExplorer: string;
  rpcUrlEnv: string;
}

export const networkConfigs: Record<SupportedNetwork, NetworkConfig> = {
  sepolia: {
    id: "sepolia",
    chainId: sepolia.id,
    label: "Sepolia Testnet",
    registryAddress: normalizeAddress("0x2f0750Bbb0A246059d80e94c454586a7F27a128e"),
    blockExplorer: "https://sepolia.etherscan.io",
    rpcUrlEnv: "VITE_SEPOLIA_RPC_URL",
  },
  mainnet: {
    id: "mainnet",
    chainId: mainnet.id,
    label: "Ethereum Mainnet",
    registryAddress: normalizeAddress("0xeb5015fF021DB115aCe010f23F55C2591059bBA0"),
    blockExplorer: "https://etherscan.io",
    rpcUrlEnv: "VITE_MAINNET_RPC_URL",
  },
};

const token = (metadata: TokenMetadata): TokenMetadata => ({
  ...metadata,
  address: normalizeAddress(metadata.address),
});

export const seededOfficialPairs: WrapperPair[] = [
  {
    id: "sepolia-usdc-cusdcmock",
    network: "sepolia",
    underlying: token({
      address: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
      symbol: "USDCMock",
      name: "Mock USDC",
      decimals: 6,
    }),
    confidential: token({
      address: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
      symbol: "cUSDCMock",
      name: "Confidential USDC Mock",
      decimals: 6,
    }),
    wrapperAddress: normalizeAddress("0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639"),
    rate: 1n,
    totalValueShielded: 482_500_000n,
    faucetSupported: true,
  },
  {
    id: "sepolia-zama-czamamock",
    network: "sepolia",
    underlying: token({
      address: "0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57",
      symbol: "ZAMAMock",
      name: "Mock ZAMA",
      decimals: 18,
    }),
    confidential: token({
      address: "0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB",
      symbol: "cZAMAMock",
      name: "Confidential ZAMA Mock",
      decimals: 6,
    }),
    wrapperAddress: normalizeAddress("0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB"),
    rate: 1_000_000_000_000n,
    totalValueShielded: 1_904_000_000n,
    faucetSupported: true,
  },
  {
    id: "mainnet-usdc-cusdc",
    network: "mainnet",
    underlying: token({
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    }),
    confidential: token({
      address: "0xe978F22157048E5DB8E5d07971376e86671672B2",
      symbol: "cUSDC",
      name: "Confidential USDC",
      decimals: 6,
    }),
    wrapperAddress: normalizeAddress("0xe978F22157048E5DB8E5d07971376e86671672B2"),
    rate: 1n,
    totalValueShielded: 0n,
    faucetSupported: false,
  },
  {
    id: "mainnet-usdt-cusdt",
    network: "mainnet",
    underlying: token({
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    }),
    confidential: token({
      address: "0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50",
      symbol: "cUSDT",
      name: "Confidential USDT",
      decimals: 6,
    }),
    wrapperAddress: normalizeAddress("0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50"),
    rate: 1n,
    totalValueShielded: 0n,
    faucetSupported: false,
  },
];
