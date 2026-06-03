import { describe, expect, it } from "vitest";
import { formatTokenAmount, pairIsHealthy, validatePair } from "./wrapperPair";
import { listWrapperPairs } from "../services/mockRegistry";
import { networkConfigs, seededOfficialPairs } from "../config/networks";
import { makeMockRegistryDataSource } from "../services/registryClient";
import { inspectProviderNetwork, switchProviderNetwork } from "../services/providerNetwork";
import { buildSubmissionReadiness, zamaReferenceLinks } from "../services/submissionReadiness";
import { buildUserDecryptionDraft } from "../services/relayerUserDecryption";
import { connectInjectedProvider, readInjectedProvider, type Eip1193Provider } from "../services/providerAdapter";
import { prepareUserDecryptionSigningRequest, signUserDecryptionRequest } from "../services/signingAdapter";
import { connectInjectedWallet, inspectInjectedWallet } from "../services/walletReadiness";
import { buildActionPlan, buildMockUserDecryptionDraft } from "../services/wrapperActions";

describe("wrapper pair model", () => {
  it("formats fixed-point token amounts", () => {
    expect(formatTokenAmount(125_000_000n, 6)).toBe("125");
    expect(formatTokenAmount(125_450_000n, 6)).toBe("125.45");
  });

  it("marks seeded pairs as healthy", async () => {
    const pairs = await listWrapperPairs();
    expect(pairs).toHaveLength(4);
    expect(pairs.every(pairIsHealthy)).toBe(true);
  });

  it("returns readable health checks", async () => {
    const [pair] = await listWrapperPairs();
    const health = validatePair(pair);
    expect(health.checks.map((check) => check.label)).toContain("positive conversion rate");
  });

  it("uses official registry addresses for supported networks", () => {
    expect(networkConfigs.sepolia.registryAddress).toBe("0x2f0750Bbb0A246059d80e94c454586a7F27a128e");
    expect(networkConfigs.mainnet.registryAddress).toBe("0xeb5015fF021DB115aCe010f23F55C2591059bBA0");
  });

  it("validates seeded pairs through the registry data source boundary", async () => {
    const source = makeMockRegistryDataSource();
    const [pair] = await source.listWrapperPairs("sepolia");
    const validation = await source.validatePair(pair);
    expect(validation).toEqual({
      tokenAddress: pair.underlying.address,
      confidentialTokenAddress: pair.confidential.address,
      isValid: true,
    });
  });

  it("keeps live wallet and relayer actions explicit", () => {
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.network === "sepolia");
    expect(sepoliaPair).toBeDefined();
    const plan = buildActionPlan(sepoliaPair!);
    expect(plan.faucet[0].status).toBe("requires-wallet");
    expect(plan.wrap.map((step) => step.status)).toEqual(["requires-wallet", "requires-wallet"]);
    expect(plan.unwrap.map((step) => step.status)).toEqual(["requires-relayer", "requires-relayer"]);
  });

  it("drafts relayer user-decryption requests without signing", () => {
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.network === "sepolia");
    expect(sepoliaPair).toBeDefined();
    const draft = buildMockUserDecryptionDraft(sepoliaPair!, "0x1111111111111111111111111111111111111111");
    expect(draft).toMatchObject({
      handleContractPairs: [
        {
          handle: `mock-${sepoliaPair!.id}-balance-handle`,
          contractAddress: sepoliaPair!.confidential.address,
        },
      ],
      contractAddresses: [sepoliaPair!.confidential.address],
      signerAddress: "0x1111111111111111111111111111111111111111",
      startTimeStamp: "1780448000",
      durationDays: "10",
      totalBitLength: 64,
    });
  });

  it("fails closed for invalid user-decryption drafts", () => {
    const baseInput = {
      handles: [{ handle: "0xabc", contractAddress: "0x1111111111111111111111111111111111111111", bitLength: 64 }],
      userAddress: "0x2222222222222222222222222222222222222222",
      publicKey: "public-key",
      startTimestamp: 1780448000,
      durationDays: 10,
    };

    expect(() => buildUserDecryptionDraft({ ...baseInput, handles: [] })).toThrow("At least one");
    expect(() => buildUserDecryptionDraft({ ...baseInput, userAddress: "not-an-address" })).toThrow("Invalid Ethereum address");
    expect(() =>
      buildUserDecryptionDraft({
        ...baseInput,
        handles: [{ handle: "0xabc", contractAddress: baseInput.handles[0].contractAddress, bitLength: 2049 }],
      }),
    ).toThrow("exceeds 2048 bits");
  });

  it("prepares wallet signing payloads without forcing a signature", async () => {
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.network === "sepolia");
    expect(sepoliaPair).toBeDefined();
    const draft = buildMockUserDecryptionDraft(sepoliaPair!, "0x1111111111111111111111111111111111111111");
    const request = prepareUserDecryptionSigningRequest(
      {
        address: "0x1111111111111111111111111111111111111111",
        signTypedData: async () => "0xsigned",
      },
      draft,
    );

    expect(request.canSign).toBe(true);
    expect(request.blockers).toEqual([]);
    expect(request.payload.types.UserDecryptRequestVerification.map((field) => field.name)).toEqual([
      "publicKey",
      "contractAddresses",
      "startTimestamp",
      "durationDays",
    ]);
    await expect(
      signUserDecryptionRequest(
        {
          address: "0x1111111111111111111111111111111111111111",
          signTypedData: async (payload) => `0x${payload.message.durationDays}`,
        },
        request,
      ),
    ).resolves.toBe("0x10");
  });

  it("blocks user-decryption signing when signer state is incomplete", () => {
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.network === "sepolia");
    expect(sepoliaPair).toBeDefined();
    const draft = buildMockUserDecryptionDraft(sepoliaPair!, "0x1111111111111111111111111111111111111111");

    expect(prepareUserDecryptionSigningRequest({ address: null }, draft)).toMatchObject({
      canSign: false,
      blockers: ["wallet:not_connected", "wallet:sign_typed_data_unavailable"],
    });
    expect(
      prepareUserDecryptionSigningRequest({ address: "0x2222222222222222222222222222222222222222", signTypedData: async () => "0x" }, draft),
    ).toMatchObject({
      canSign: false,
      blockers: ["wallet:address_mismatch"],
    });
  });

  it("adapts injected providers without touching real browser wallets", async () => {
    const calls: Array<{ method: string; params?: unknown[] }> = [];
    const provider: Eip1193Provider = {
      async request(args) {
        calls.push(args);
        if (args.method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
        if (args.method === "eth_signTypedData_v4") return "0xfakesignature";
        throw new Error(`unexpected method ${args.method}`);
      },
    };
    const adapter = await connectInjectedProvider(provider);
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.network === "sepolia");
    expect(sepoliaPair).toBeDefined();
    const draft = buildMockUserDecryptionDraft(sepoliaPair!, adapter.address!);
    const request = prepareUserDecryptionSigningRequest(adapter, draft);

    await expect(signUserDecryptionRequest(adapter, request)).resolves.toBe("0xfakesignature");
    expect(calls.map((call) => call.method)).toEqual(["eth_requestAccounts", "eth_signTypedData_v4"]);
    expect(calls[1].params?.[0]).toBe("0x1111111111111111111111111111111111111111");
    expect(typeof calls[1].params?.[1]).toBe("string");
  });

  it("fails closed for absent or malformed injected providers", async () => {
    await expect(readInjectedProvider(undefined)).resolves.toEqual({ address: null });
    await expect(
      readInjectedProvider({
        async request() {
          return [17];
        },
      }),
    ).rejects.toThrow("non-string account");
  });

  it("reports wallet readiness without requesting accounts or signing", async () => {
    const calls: string[] = [];
    const provider: Eip1193Provider = {
      async request(args) {
        calls.push(args.method);
        if (args.method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
        throw new Error(`unexpected method ${args.method}`);
      },
    };

    await expect(inspectInjectedWallet(undefined)).resolves.toMatchObject({
      status: "provider-missing",
      blockers: ["wallet:provider_missing"],
    });
    await expect(inspectInjectedWallet(provider)).resolves.toMatchObject({
      status: "ready",
      address: "0x1111111111111111111111111111111111111111",
      canPrepareUserDecryptionSignature: true,
      blockers: [],
    });
    expect(calls).toEqual(["eth_accounts"]);
  });

  it("connects injected wallets only through the explicit connect path", async () => {
    const calls: string[] = [];
    const provider: Eip1193Provider = {
      async request(args) {
        calls.push(args.method);
        if (args.method === "eth_requestAccounts") return ["0x2222222222222222222222222222222222222222"];
        throw new Error(`unexpected method ${args.method}`);
      },
    };

    await expect(connectInjectedWallet(provider)).resolves.toMatchObject({
      status: "ready",
      address: "0x2222222222222222222222222222222222222222",
      canPrepareUserDecryptionSignature: true,
      blockers: [],
    });
    expect(calls).toEqual(["eth_requestAccounts"]);
  });

  it("inspects and switches wallet networks through explicit provider calls", async () => {
    const calls: Array<{ method: string; params?: unknown[] }> = [];
    let chainId = "0x1";
    const provider: Eip1193Provider = {
      async request(args) {
        calls.push(args);
        if (args.method === "eth_chainId") return chainId;
        if (args.method === "wallet_switchEthereumChain") {
          const [params] = args.params ?? [];
          if (!params || typeof params !== "object" || !("chainId" in params)) throw new Error("missing chain id");
          chainId = String(params.chainId);
          return null;
        }
        throw new Error(`unexpected method ${args.method}`);
      },
    };

    await expect(inspectProviderNetwork(provider, "sepolia")).resolves.toMatchObject({
      status: "mismatch",
      currentChainId: 1,
      expectedChainId: networkConfigs.sepolia.chainId,
    });
    await expect(switchProviderNetwork(provider, "sepolia")).resolves.toMatchObject({
      status: "matched",
      currentChainId: networkConfigs.sepolia.chainId,
      expectedNetwork: "sepolia",
    });
    expect(calls.map((call) => call.method)).toEqual(["eth_chainId", "wallet_switchEthereumChain", "eth_chainId"]);
    expect(calls[1].params).toEqual([{ chainId: "0xaa36a7" }]);
  });

  it("separates local demo readiness from external submission gates", () => {
    const localReadiness = buildSubmissionReadiness(false);
    expect(localReadiness[0]).toMatchObject({ label: "Registry discovery", status: "local-only" });
    expect(localReadiness.filter((item) => item.status === "external-gate")).toHaveLength(3);

    const chainReadiness = buildSubmissionReadiness(true);
    expect(chainReadiness[0]).toMatchObject({ label: "Registry discovery", status: "complete" });
  });

  it("keeps official reference links attached to the handoff", () => {
    expect(zamaReferenceLinks.map((link) => link.href)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("zama-ai/protocol-apps"),
        expect.stringContaining("protocol-guides/confidential-wrapper"),
        expect.stringContaining("protocol-apps/registry-contract"),
        expect.stringContaining("relayer-sdk-guides/fhevm-relayer/decryption/user-decryption"),
        expect.stringContaining("SUBMISSION-PACKET.md"),
        expect.stringContaining("DEMO-SCRIPT.md"),
        expect.stringContaining("ARTICLE-DRAFT.md"),
        expect.stringContaining("RELAYER-USER-DECRYPTION-PLAN.md"),
      ]),
    );
  });
});
