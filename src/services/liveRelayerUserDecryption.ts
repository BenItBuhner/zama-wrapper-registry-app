import type {
  FhevmInstance,
  HandleContractPair,
  KmsUserDecryptEIP712Type,
  SepoliaConfig,
  UserDecryptResults,
} from "@zama-fhe/relayer-sdk/web";
import type { Eip1193Provider } from "./providerAdapter";
import type { UserDecryptionDraft } from "./relayerUserDecryption";
import type { UserDecryptionSigningPayload, WalletAdapter } from "./signingAdapter";

export interface RelayerSdkModule {
  initSDK(): Promise<boolean>;
  createInstance(config: typeof SepoliaConfig & { network: Eip1193Provider }): Promise<FhevmInstance>;
  SepoliaConfig: typeof SepoliaConfig;
}

export interface LiveRelayerUserDecryptionRequest {
  instance: Pick<FhevmInstance, "userDecrypt">;
  handleContractPairs: HandleContractPair[];
  privateKey: string;
  publicKey: string;
  contractAddresses: string[];
  signerAddress: string;
  startTimestamp: number;
  durationDays: number;
  payload: UserDecryptionSigningPayload;
}

export interface LiveRelayerUserDecryptionResult {
  values: UserDecryptResults;
  detail: string;
}

export type LoadRelayerSdk = () => Promise<RelayerSdkModule>;

export const loadRelayerSdk: LoadRelayerSdk = () => import("@zama-fhe/relayer-sdk/web");

export async function prepareLiveRelayerUserDecryptionRequest({
  provider,
  draft,
  loadSdk = loadRelayerSdk,
}: {
  provider: Eip1193Provider | null | undefined;
  draft: UserDecryptionDraft;
  loadSdk?: LoadRelayerSdk;
}): Promise<LiveRelayerUserDecryptionRequest> {
  if (!provider) throw new Error("No injected EIP-1193 wallet provider was found.");

  const sdk = await loadSdk();
  await sdk.initSDK();
  const instance = await sdk.createInstance({ ...sdk.SepoliaConfig, network: provider });
  const keypair = instance.generateKeypair();
  const startTimestamp = Number.parseInt(draft.startTimeStamp, 10);
  const durationDays = Number.parseInt(draft.durationDays, 10);
  if (!Number.isSafeInteger(startTimestamp) || !Number.isSafeInteger(durationDays)) {
    throw new Error("User-decryption timing values must be safe integers.");
  }

  const eip712 = instance.createEIP712(keypair.publicKey, draft.contractAddresses, startTimestamp, durationDays);

  return {
    instance,
    handleContractPairs: draft.handleContractPairs,
    privateKey: keypair.privateKey,
    publicKey: keypair.publicKey,
    contractAddresses: draft.contractAddresses,
    signerAddress: draft.signerAddress,
    startTimestamp,
    durationDays,
    payload: toSigningPayload(eip712),
  };
}

export async function signAndRunLiveRelayerUserDecryption(
  wallet: WalletAdapter,
  request: LiveRelayerUserDecryptionRequest,
): Promise<LiveRelayerUserDecryptionResult> {
  if (!wallet.address) throw new Error("Connect a wallet before running live user decryption.");
  if (wallet.address !== request.signerAddress) throw new Error("Wallet address does not match the user-decryption signer.");
  if (!wallet.signTypedData) throw new Error("Wallet typed-data signing is not available.");

  const signature = await wallet.signTypedData(request.payload);
  const values = await request.instance.userDecrypt(
    request.handleContractPairs,
    request.privateKey,
    request.publicKey,
    signature.replace(/^0x/, ""),
    request.contractAddresses,
    request.signerAddress,
    request.startTimestamp,
    request.durationDays,
  );

  return {
    values,
    detail: "Live relayer user-decryption request completed.",
  };
}

function toSigningPayload(eip712: KmsUserDecryptEIP712Type): UserDecryptionSigningPayload {
  return {
    domain: eip712.domain,
    types: {
      EIP712Domain: [...eip712.types.EIP712Domain],
      UserDecryptRequestVerification: [...eip712.types.UserDecryptRequestVerification],
    },
    message: eip712.message,
  };
}
