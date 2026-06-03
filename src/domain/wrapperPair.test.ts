import { describe, expect, it } from "vitest";
import { formatTokenAmount, pairIsHealthy, validatePair } from "./wrapperPair";
import { listWrapperPairs } from "../services/mockRegistry";
import { networkConfigs, seededOfficialPairs } from "../config/networks";
import { makeMockRegistryDataSource } from "../services/registryClient";
import { buildLiveDemoPreflight } from "../services/liveDemoPreflight";
import { inspectProviderNetwork, switchProviderNetwork } from "../services/providerNetwork";
import { buildSubmissionReadiness, zamaReferenceLinks } from "../services/submissionReadiness";
import { buildDemoUnderlyingAmount, buildWrapperTransactionIntents } from "../services/transactionIntents";
import { submitWrapperTransactionIntent } from "../services/transactionSubmission";
import { buildUserDecryptionDraft } from "../services/relayerUserDecryption";
import { connectInjectedProvider, readInjectedProvider, type Eip1193Provider } from "../services/providerAdapter";
import { prepareUserDecryptionSigningRequest, signUserDecryptionRequest } from "../services/signingAdapter";
import { buildSubmissionEvidencePacket } from "../services/submissionEvidence";
import { buildUserDecryptionSigningSession, signUserDecryptionSigningSession } from "../services/userDecryptionSigningSession";
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

  it("prepares unsigned wrapper transaction intents without provider calls", () => {
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.id === "sepolia-usdc-cusdcmock");
    expect(sepoliaPair).toBeDefined();
    const intents = buildWrapperTransactionIntents(sepoliaPair!, "0x1111111111111111111111111111111111111111");
    const approve = intents.find((intent) => intent.kind === "approve");
    const wrap = intents.find((intent) => intent.kind === "wrap");
    const faucet = intents.find((intent) => intent.kind === "faucet");

    expect(buildDemoUnderlyingAmount(sepoliaPair!)).toBe(1_000_000n);
    expect(faucet).toMatchObject({
      status: "ready-to-build",
      targetAddress: sepoliaPair!.underlying.address,
      method: "mint(address,uint256)",
      chainId: networkConfigs.sepolia.chainId,
    });
    expect(approve).toMatchObject({
      status: "ready-to-build",
      targetAddress: sepoliaPair!.underlying.address,
      method: "approve(address,uint256)",
    });
    expect(wrap).toMatchObject({
      status: "ready-to-build",
      targetAddress: sepoliaPair!.wrapperAddress,
      method: "wrap(uint256)",
    });
    expect(approve?.data?.startsWith("0x095ea7b3")).toBe(true);
    expect(wrap?.data?.startsWith("0x")).toBe(true);
  });

  it("fails closed for faucet and relayer-dependent transaction intents", () => {
    const mainnetPair = seededOfficialPairs.find((pair) => pair.id === "mainnet-usdc-cusdc");
    expect(mainnetPair).toBeDefined();
    const intents = buildWrapperTransactionIntents(mainnetPair!, null);
    const faucet = intents.find((intent) => intent.kind === "faucet");
    const unwrap = intents.find((intent) => intent.kind === "unwrap");
    const finalize = intents.find((intent) => intent.kind === "finalize-unwrap");

    expect(faucet).toMatchObject({
      status: "not-supported",
      targetAddress: null,
      data: null,
    });
    expect(unwrap).toMatchObject({
      status: "requires-relayer",
      data: null,
    });
    expect(finalize).toMatchObject({
      status: "requires-relayer",
      data: null,
    });
  });

  it("summarizes live Sepolia demo preflight readiness", () => {
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.id === "sepolia-usdc-cusdcmock");
    expect(sepoliaPair).toBeDefined();
    const wallet = {
      status: "ready" as const,
      address: "0x1111111111111111111111111111111111111111",
      canPrepareUserDecryptionSignature: true,
      blockers: [],
      detail: "ready",
    };
    const network = {
      status: "matched" as const,
      currentChainId: networkConfigs.sepolia.chainId,
      expectedChainId: networkConfigs.sepolia.chainId,
      expectedNetwork: "sepolia" as const,
      detail: "matched",
    };
    const preflight = buildLiveDemoPreflight(
      sepoliaPair!,
      wallet,
      network,
      buildWrapperTransactionIntents(sepoliaPair!, wallet.address),
    );

    expect(preflight.canStartSepoliaTransactions).toBe(true);
    expect(preflight.items.filter((item) => item.status === "ready").map((item) => item.label)).toEqual([
      "Sepolia demo pair",
      "Wallet connected",
      "Network matched",
      "Unsigned faucet intent",
      "Unsigned approval intent",
      "Unsigned wrap intent",
    ]);
    expect(preflight.items.at(-1)).toMatchObject({
      label: "Relayer unwrap/finalize",
      status: "external-gate",
    });
  });

  it("blocks live demo preflight when wallet, network, or faucet path is missing", () => {
    const mainnetPair = seededOfficialPairs.find((pair) => pair.id === "mainnet-usdc-cusdc");
    expect(mainnetPair).toBeDefined();
    const preflight = buildLiveDemoPreflight(
      mainnetPair!,
      null,
      {
        status: "mismatch",
        currentChainId: networkConfigs.sepolia.chainId,
        expectedChainId: networkConfigs.mainnet.chainId,
        expectedNetwork: "mainnet",
        detail: "wrong chain",
      },
      buildWrapperTransactionIntents(mainnetPair!, null),
    );

    expect(preflight.canStartSepoliaTransactions).toBe(false);
    expect(preflight.items.filter((item) => item.status === "blocked").map((item) => item.label)).toEqual(
      expect.arrayContaining(["Sepolia demo pair", "Wallet connected", "Network matched", "Unsigned faucet intent"]),
    );
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

  it("summarizes user-decryption signing sessions for the browser UI", async () => {
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.network === "sepolia");
    expect(sepoliaPair).toBeDefined();

    const blocked = buildUserDecryptionSigningSession(sepoliaPair!, { address: null });
    expect(blocked).toMatchObject({
      status: "blocked",
      draftSummary: null,
      blockers: ["wallet:not_connected"],
    });

    const ready = buildUserDecryptionSigningSession(sepoliaPair!, {
      address: "0x1111111111111111111111111111111111111111",
      signTypedData: async (payload) => `0x${payload.message.contractAddresses.length}${payload.message.durationDays}`,
    });
    expect(ready).toMatchObject({
      status: "ready",
      blockers: [],
      draftSummary: {
        signerAddress: "0x1111111111111111111111111111111111111111",
        totalBitLength: 64,
        durationDays: "10",
      },
    });
    await expect(
      signUserDecryptionSigningSession(
        {
          address: "0x1111111111111111111111111111111111111111",
          signTypedData: async (payload) => `0x${payload.message.contractAddresses.length}${payload.message.durationDays}`,
        },
        ready,
      ),
    ).resolves.toBe("0x110");
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

  it("submits ready Sepolia transaction intents through an explicit wallet call", async () => {
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.id === "sepolia-usdc-cusdcmock");
    expect(sepoliaPair).toBeDefined();
    const [faucet] = buildWrapperTransactionIntents(sepoliaPair!, "0x1111111111111111111111111111111111111111");
    const calls: Array<{ method: string; params?: unknown[] }> = [];
    const provider: Eip1193Provider = {
      async request(args) {
        calls.push(args);
        if (args.method === "eth_sendTransaction") return "0xabc123";
        throw new Error(`unexpected method ${args.method}`);
      },
    };

    await expect(
      submitWrapperTransactionIntent({
        provider,
        intent: faucet,
        fromAddress: "0x1111111111111111111111111111111111111111",
        network: {
          status: "matched",
          currentChainId: networkConfigs.sepolia.chainId,
          expectedChainId: networkConfigs.sepolia.chainId,
          expectedNetwork: "sepolia",
          detail: "matched",
        },
      }),
    ).resolves.toMatchObject({ hash: "0xabc123" });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("eth_sendTransaction");
    expect(calls[0].params?.[0]).toMatchObject({
      from: "0x1111111111111111111111111111111111111111",
      to: sepoliaPair!.underlying.address,
      value: "0x0",
    });
  });

  it("blocks transaction submission outside the Sepolia ready path", async () => {
    const mainnetPair = seededOfficialPairs.find((pair) => pair.id === "mainnet-usdc-cusdc");
    const sepoliaPair = seededOfficialPairs.find((pair) => pair.id === "sepolia-usdc-cusdcmock");
    expect(mainnetPair).toBeDefined();
    expect(sepoliaPair).toBeDefined();
    const [, mainnetApprove] = buildWrapperTransactionIntents(mainnetPair!, "0x1111111111111111111111111111111111111111");
    const [sepoliaFaucet] = buildWrapperTransactionIntents(sepoliaPair!, "0x1111111111111111111111111111111111111111");
    const provider: Eip1193Provider = {
      async request() {
        return "0xabc123";
      },
    };

    await expect(
      submitWrapperTransactionIntent({
        provider,
        intent: mainnetApprove,
        fromAddress: "0x1111111111111111111111111111111111111111",
        network: {
          status: "matched",
          currentChainId: networkConfigs.mainnet.chainId,
          expectedChainId: networkConfigs.mainnet.chainId,
          expectedNetwork: "mainnet",
          detail: "matched",
        },
      }),
    ).rejects.toThrow("Only Sepolia");
    await expect(
      submitWrapperTransactionIntent({
        provider,
        intent: sepoliaFaucet,
        fromAddress: "0x1111111111111111111111111111111111111111",
        network: {
          status: "mismatch",
          currentChainId: networkConfigs.mainnet.chainId,
          expectedChainId: networkConfigs.sepolia.chainId,
          expectedNetwork: "sepolia",
          detail: "wrong network",
        },
      }),
    ).rejects.toThrow("must match");
    await expect(
      submitWrapperTransactionIntent({
        provider: null,
        intent: sepoliaFaucet,
        fromAddress: "0x1111111111111111111111111111111111111111",
        network: null,
      }),
    ).rejects.toThrow("No injected");
    await expect(
      submitWrapperTransactionIntent({
        provider: {
          async request() {
            return 42;
          },
        },
        intent: sepoliaFaucet,
        fromAddress: "0x1111111111111111111111111111111111111111",
        network: {
          status: "matched",
          currentChainId: networkConfigs.sepolia.chainId,
          expectedChainId: networkConfigs.sepolia.chainId,
          expectedNetwork: "sepolia",
          detail: "matched",
        },
      }),
    ).rejects.toThrow("invalid transaction hash");
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
        expect.stringContaining("ARTICLE.md"),
        expect.stringContaining("zama-wrapper-registry-demo.webm"),
        expect.stringContaining("RELAYER-USER-DECRYPTION-PLAN.md"),
        expect.stringContaining("FORM-ANSWERS-DRAFT.md"),
      ]),
    );
  });

  it("builds a final-form evidence packet without secrets or signatures", () => {
    const packet = buildSubmissionEvidencePacket();
    expect(packet.publicLinks.map((link) => link.label)).toEqual([
      "Public repository",
      "Public demo",
      "Submission packet",
      "Demo script",
      "Published article",
      "Demo video",
      "Relayer user-decryption plan",
      "Form answers draft",
    ]);
    expect(packet.publicLinks.every((link) => link.href.startsWith("https://"))).toBe(true);
    expect(packet.validationCommands).toEqual(["bun run test", "bun run build", "bun run build:pages"]);
    expect(packet.checklist.map((item) => item.status)).toEqual([
      "ready",
      "ready",
      "ready",
      "local-validation",
      "external-gate",
    ]);
    expect(packet.remainingExternalGates).toEqual(
      expect.arrayContaining([
        "Replace or supplement the credential-free demo video if the bounty reviewer requires live wallet transaction footage.",
        "Submit the Zama bounty form with the prepared answers and payout details.",
      ]),
    );
    expect(JSON.stringify(packet).toLowerCase()).not.toContain("private key");
  });
});
