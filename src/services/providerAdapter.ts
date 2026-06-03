import { normalizeAddress } from "../domain/wrapperPair";
import type { UserDecryptionSigningPayload, WalletAdapter } from "./signingAdapter";

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

export async function connectInjectedProvider(provider: Eip1193Provider | null | undefined): Promise<WalletAdapter> {
  if (!provider) return { address: null };

  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const [firstAccount] = parseAccounts(accounts);

  if (!firstAccount) return { address: null };

  return {
    address: firstAccount,
    signTypedData: (payload) => signTypedDataV4(provider, firstAccount, payload),
  };
}

export async function readInjectedProvider(provider: Eip1193Provider | null | undefined): Promise<WalletAdapter> {
  if (!provider) return { address: null };

  const accounts = await provider.request({ method: "eth_accounts" });
  const [firstAccount] = parseAccounts(accounts);

  if (!firstAccount) return { address: null };

  return {
    address: firstAccount,
    signTypedData: (payload) => signTypedDataV4(provider, firstAccount, payload),
  };
}

function parseAccounts(accounts: unknown): string[] {
  if (!Array.isArray(accounts)) throw new Error("Provider returned invalid accounts payload");
  return accounts.map((account) => {
    if (typeof account !== "string") throw new Error("Provider returned non-string account");
    return normalizeAddress(account);
  });
}

function signTypedDataV4(
  provider: Eip1193Provider,
  signerAddress: string,
  payload: UserDecryptionSigningPayload,
): Promise<string> {
  return provider
    .request({
      method: "eth_signTypedData_v4",
      params: [signerAddress, JSON.stringify(payload, (_, value) => (typeof value === "bigint" ? value.toString() : value))],
    })
    .then((signature) => {
      if (typeof signature !== "string" || !signature.startsWith("0x")) {
        throw new Error("Provider returned invalid typed-data signature");
      }
      return signature;
    });
}
