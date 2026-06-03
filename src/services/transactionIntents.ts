import { encodeFunctionData } from "viem";
import { networkConfigs } from "../config/networks";
import { formatTokenAmount, type WrapperPair } from "../domain/wrapperPair";

export type TransactionIntentKind = "faucet" | "approve" | "wrap" | "unwrap" | "finalize-unwrap";
export type TransactionIntentStatus = "ready-to-build" | "requires-wallet" | "requires-relayer" | "not-supported";

export interface TransactionIntentParameter {
  name: string;
  type: string;
  value: string;
}

export interface TransactionIntent {
  kind: TransactionIntentKind;
  label: string;
  status: TransactionIntentStatus;
  networkLabel: string;
  chainId: number;
  targetAddress: string | null;
  method: string | null;
  data: string | null;
  amountLabel: string | null;
  parameters: TransactionIntentParameter[];
  note: string;
}

const erc20ApproveAbi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const mockTokenMintAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const wrapperWrapAbi = [
  {
    type: "function",
    name: "wrap",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

function asAddress(value: string): `0x${string}` {
  return value as `0x${string}`;
}

export function buildDemoUnderlyingAmount(pair: WrapperPair): bigint {
  return 10n ** BigInt(pair.underlying.decimals);
}

export function buildWrapperTransactionIntents(pair: WrapperPair, userAddress: string | null): TransactionIntent[] {
  const network = networkConfigs[pair.network];
  const amount = buildDemoUnderlyingAmount(pair);
  const amountLabel = `${formatTokenAmount(amount, pair.underlying.decimals)} ${pair.underlying.symbol}`;
  const shared = {
    networkLabel: network.label,
    chainId: network.chainId,
    amountLabel,
  };

  const faucetData =
    pair.faucetSupported && userAddress
      ? encodeFunctionData({
          abi: mockTokenMintAbi,
          functionName: "mint",
          args: [asAddress(userAddress), amount],
        })
      : null;

  return [
    {
      kind: "faucet",
      label: `Mint ${pair.underlying.symbol} test tokens`,
      status: pair.faucetSupported ? (userAddress ? "ready-to-build" : "requires-wallet") : "not-supported",
      ...shared,
      targetAddress: pair.faucetSupported ? pair.underlying.address : null,
      method: pair.faucetSupported ? "mint(address,uint256)" : null,
      data: faucetData,
      parameters: pair.faucetSupported
        ? [
            { name: "recipient", type: "address", value: userAddress ?? "connected wallet" },
            { name: "amount", type: "uint256", value: amount.toString() },
          ]
        : [],
      note: pair.faucetSupported
        ? "Sepolia-only mock-token faucet intent. Submission is available only through an explicit wallet click."
        : "Mainnet wrapper pairs do not expose a faucet path.",
    },
    {
      kind: "approve",
      label: `Approve ${pair.wrapperAddress}`,
      status: "ready-to-build",
      ...shared,
      targetAddress: pair.underlying.address,
      method: "approve(address,uint256)",
      data: encodeFunctionData({
        abi: erc20ApproveAbi,
        functionName: "approve",
        args: [asAddress(pair.wrapperAddress), amount],
      }),
      parameters: [
        { name: "spender", type: "address", value: pair.wrapperAddress },
        { name: "amount", type: "uint256", value: amount.toString() },
      ],
      note: "ERC-20 approval intent for the selected wrapper contract. Submission is available only on Sepolia through an explicit wallet click.",
    },
    {
      kind: "wrap",
      label: `Wrap ${amountLabel}`,
      status: "ready-to-build",
      ...shared,
      targetAddress: pair.wrapperAddress,
      method: "wrap(uint256)",
      data: encodeFunctionData({
        abi: wrapperWrapAbi,
        functionName: "wrap",
        args: [amount],
      }),
      parameters: [{ name: "amount", type: "uint256", value: amount.toString() }],
      note: "Wrapper call intent. Submission is available only on Sepolia through an explicit wallet click.",
    },
    {
      kind: "unwrap",
      label: `Request ${pair.confidential.symbol} unwrap`,
      status: "requires-relayer",
      ...shared,
      targetAddress: pair.wrapperAddress,
      method: "unwrap(encryptedAmountHandle)",
      data: null,
      parameters: [{ name: "encryptedAmountHandle", type: "bytes32", value: "requires relayer-encrypted live handle" }],
      note: "Unwrap request depends on live encrypted input, so this demo records the target and required parameter without inventing call data.",
    },
    {
      kind: "finalize-unwrap",
      label: "Finalize unwrap",
      status: "requires-relayer",
      ...shared,
      targetAddress: pair.wrapperAddress,
      method: "finalizeUnwrap(requestId, proof)",
      data: null,
      parameters: [
        { name: "requestId", type: "uint256", value: "requires live unwrap request" },
        { name: "proof", type: "bytes", value: "requires public decryption proof" },
      ],
      note: "Finalization remains gated on the live relayer/public-decryption result.",
    },
  ];
}
