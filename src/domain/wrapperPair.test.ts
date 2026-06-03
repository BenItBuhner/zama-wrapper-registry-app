import { describe, expect, it } from "vitest";
import { formatTokenAmount, pairIsHealthy, validatePair } from "./wrapperPair";
import { listWrapperPairs } from "../services/mockRegistry";
import { networkConfigs, seededOfficialPairs } from "../config/networks";
import { makeMockRegistryDataSource } from "../services/registryClient";
import { buildSubmissionReadiness, zamaReferenceLinks } from "../services/submissionReadiness";
import { buildActionPlan } from "../services/wrapperActions";

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
      ]),
    );
  });
});
