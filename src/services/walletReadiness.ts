import type { Eip1193Provider } from "./providerAdapter";
import { connectInjectedProvider, readInjectedProvider } from "./providerAdapter";

export type WalletReadinessStatus = "ready" | "provider-missing" | "account-missing" | "inspection-error";

export interface WalletReadiness {
  status: WalletReadinessStatus;
  address: string | null;
  canPrepareUserDecryptionSignature: boolean;
  blockers: string[];
  detail: string;
}

export async function inspectInjectedWallet(provider: Eip1193Provider | null | undefined): Promise<WalletReadiness> {
  if (!provider) {
    return {
      status: "provider-missing",
      address: null,
      canPrepareUserDecryptionSignature: false,
      blockers: ["wallet:provider_missing"],
      detail: "No injected EIP-1193 wallet provider was found in this browser session.",
    };
  }

  try {
    const wallet = await readInjectedProvider(provider);

    if (!wallet.address) {
      return {
        status: "account-missing",
        address: null,
        canPrepareUserDecryptionSignature: false,
        blockers: ["wallet:not_connected"],
        detail: "Wallet provider is present, but no connected account was exposed by eth_accounts.",
      };
    }

    const canSign = Boolean(wallet.signTypedData);
    return {
      status: canSign ? "ready" : "account-missing",
      address: wallet.address,
      canPrepareUserDecryptionSignature: canSign,
      blockers: canSign ? [] : ["wallet:sign_typed_data_unavailable"],
      detail: canSign
        ? "Connected account can be used to prepare a relayer user-decryption signing request."
        : "Connected account is visible, but typed-data signing is not available through the adapter.",
    };
  } catch (error: unknown) {
    return {
      status: "inspection-error",
      address: null,
      canPrepareUserDecryptionSignature: false,
      blockers: ["wallet:inspection_error"],
      detail: error instanceof Error ? error.message : "Wallet provider inspection failed.",
    };
  }
}

export async function connectInjectedWallet(provider: Eip1193Provider | null | undefined): Promise<WalletReadiness> {
  if (!provider) {
    return {
      status: "provider-missing",
      address: null,
      canPrepareUserDecryptionSignature: false,
      blockers: ["wallet:provider_missing"],
      detail: "No injected EIP-1193 wallet provider was found in this browser session.",
    };
  }

  try {
    const wallet = await connectInjectedProvider(provider);

    if (!wallet.address) {
      return {
        status: "account-missing",
        address: null,
        canPrepareUserDecryptionSignature: false,
        blockers: ["wallet:not_connected"],
        detail: "Wallet connection returned no account.",
      };
    }

    const canSign = Boolean(wallet.signTypedData);
    return {
      status: canSign ? "ready" : "account-missing",
      address: wallet.address,
      canPrepareUserDecryptionSignature: canSign,
      blockers: canSign ? [] : ["wallet:sign_typed_data_unavailable"],
      detail: canSign
        ? "Wallet account is connected and ready for a relayer user-decryption signing request."
        : "Wallet account is connected, but typed-data signing is not available through the adapter.",
    };
  } catch (error: unknown) {
    return {
      status: "inspection-error",
      address: null,
      canPrepareUserDecryptionSignature: false,
      blockers: ["wallet:connection_error"],
      detail: error instanceof Error ? error.message : "Wallet connection failed.",
    };
  }
}
