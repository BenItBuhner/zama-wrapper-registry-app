import type { WrapperPair } from "../domain/wrapperPair";
import type { ProviderNetworkReadiness } from "./providerNetwork";
import type { TransactionIntent, TransactionIntentKind } from "./transactionIntents";
import type { WalletReadiness } from "./walletReadiness";

export type LiveDemoPreflightStatus = "ready" | "blocked" | "external-gate";

export interface LiveDemoPreflightItem {
  label: string;
  status: LiveDemoPreflightStatus;
  detail: string;
}

export interface LiveDemoPreflight {
  canStartSepoliaTransactions: boolean;
  items: LiveDemoPreflightItem[];
}

export function buildLiveDemoPreflight(
  pair: WrapperPair,
  wallet: WalletReadiness | null,
  network: ProviderNetworkReadiness | null,
  intents: TransactionIntent[],
): LiveDemoPreflight {
  const walletReady = wallet?.status === "ready" && Boolean(wallet.address);
  const networkReady = network?.status === "matched" && network.expectedNetwork === pair.network;
  const faucetReady = intentReady(intents, "faucet");
  const approveReady = intentReady(intents, "approve");
  const wrapReady = intentReady(intents, "wrap");
  const isSepoliaDemo = pair.network === "sepolia" && pair.faucetSupported;

  const items: LiveDemoPreflightItem[] = [
    {
      label: "Sepolia demo pair",
      status: isSepoliaDemo ? "ready" : "blocked",
      detail: isSepoliaDemo
        ? `${pair.underlying.symbol} / ${pair.confidential.symbol} supports the Sepolia faucet demo path.`
        : "Select a Sepolia wrapper pair with faucet support before attempting demo transactions.",
    },
    {
      label: "Wallet connected",
      status: walletReady ? "ready" : "blocked",
      detail: walletReady
        ? `Connected account ${wallet!.address} is available for the demo.`
        : wallet?.detail ?? "Connect an injected wallet before preparing live demo transactions.",
    },
    {
      label: "Network matched",
      status: networkReady ? "ready" : "blocked",
      detail: networkReady
        ? network!.detail
        : network?.detail ?? "Inspect or switch the wallet network to match the selected wrapper.",
    },
    {
      label: "Unsigned faucet intent",
      status: faucetReady ? "ready" : "blocked",
      detail: faucetReady
        ? "Faucet calldata is ready for review before wallet submission."
        : "Faucet calldata requires a Sepolia faucet pair and connected wallet address.",
    },
    {
      label: "Unsigned approval intent",
      status: approveReady ? "ready" : "blocked",
      detail: approveReady
        ? "Approval calldata is ready for review before wallet submission."
        : "Approval calldata is not ready for this selected pair.",
    },
    {
      label: "Unsigned wrap intent",
      status: wrapReady ? "ready" : "blocked",
      detail: wrapReady ? "Wrap calldata is ready for review before wallet submission." : "Wrap calldata is not ready for this selected pair.",
    },
    {
      label: "Relayer unwrap/finalize",
      status: "external-gate",
      detail: "Unwrap and finalize still require live encrypted handles, public decryption proof, and relayer plumbing.",
    },
  ];

  return {
    canStartSepoliaTransactions: isSepoliaDemo && walletReady && networkReady && faucetReady && approveReady && wrapReady,
    items,
  };
}

function intentReady(intents: TransactionIntent[], kind: TransactionIntentKind): boolean {
  const intent = intents.find((candidate) => candidate.kind === kind);
  return Boolean(intent && intent.status === "ready-to-build" && intent.targetAddress && intent.method && intent.data);
}
