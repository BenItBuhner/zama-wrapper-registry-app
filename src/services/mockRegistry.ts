import { seededOfficialPairs } from "../config/networks";
import type { SupportedNetwork, WrapperPair } from "../domain/wrapperPair";
import { decryptMockBalance as decryptPairMockBalance } from "./wrapperActions";

export async function listWrapperPairs(network?: SupportedNetwork): Promise<WrapperPair[]> {
  await Promise.resolve();
  return network ? seededOfficialPairs.filter((pair) => pair.network === network) : [...seededOfficialPairs];
}

export async function getWrapperPair(id: string): Promise<WrapperPair | null> {
  await Promise.resolve();
  return seededOfficialPairs.find((pair) => pair.id === id) ?? null;
}

export async function decryptMockBalance(pairId: string): Promise<string> {
  const pair = await getWrapperPair(pairId);
  if (!pair) throw new Error(`Unknown wrapper pair: ${pairId}`);
  return decryptPairMockBalance(pair);
}
