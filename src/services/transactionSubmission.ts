import { networkConfigs } from "../config/networks";
import { normalizeAddress } from "../domain/wrapperPair";
import type { Eip1193Provider } from "./providerAdapter";
import type { ProviderNetworkReadiness } from "./providerNetwork";
import type { TransactionIntent } from "./transactionIntents";

export interface TransactionSubmissionRequest {
  provider: Eip1193Provider | null | undefined;
  intent: TransactionIntent;
  fromAddress: string | null;
  network: ProviderNetworkReadiness | null;
}

export interface TransactionSubmissionResult {
  hash: string;
  detail: string;
}

export async function submitWrapperTransactionIntent({
  provider,
  intent,
  fromAddress,
  network,
}: TransactionSubmissionRequest): Promise<TransactionSubmissionResult> {
  if (!provider) throw new Error("No injected EIP-1193 wallet provider was found.");
  if (!fromAddress) throw new Error("Connect a wallet before submitting a transaction intent.");
  if (intent.chainId !== networkConfigs.sepolia.chainId) {
    throw new Error("Only Sepolia demo transaction intents can be submitted from this public app.");
  }
  if (intent.status !== "ready-to-build") throw new Error(`Transaction intent is not ready: ${intent.status}`);
  if (!intent.targetAddress || !intent.data) throw new Error("Transaction intent is missing target or call data.");
  if (!network || network.status !== "matched" || network.currentChainId !== intent.chainId) {
    throw new Error(`Wallet network must match ${intent.networkLabel} before submitting.`);
  }

  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: normalizeAddress(fromAddress),
        to: normalizeAddress(intent.targetAddress),
        data: intent.data,
        value: "0x0",
      },
    ],
  });

  if (typeof hash !== "string" || !hash.startsWith("0x")) {
    throw new Error("Wallet provider returned an invalid transaction hash.");
  }

  return {
    hash,
    detail: `${intent.label} submitted on ${intent.networkLabel}.`,
  };
}
