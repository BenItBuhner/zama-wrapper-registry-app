# Zama Confidential Wrapper Registry App

Local bounty workspace for Zama Developer Program Mainnet Season 3 Bounty Track.

Goal: build a production-ready dApp that surfaces ERC-20 to ERC-7984 wrapper pairs on Sepolia and Ethereum mainnet, supports wrap/unwrap, decrypts ERC-7984 balances through the user-decryption flow, and includes a Sepolia faucet flow for official cTokenMocks.

This workspace is local-only until the external gates are satisfied:

- public deployment
- real wallet signing
- real-person demo video
- X thread or article
- final Zama form submission
- payout wallet/account handling

Current official target: Zama Developer Program Mainnet Season 3 Bounty Track, "Confidential Wrapper Registry App." The form deadline is July 7, 2026 at 23:59 AOE, and the form requires a functioning deployed dApp, codebase, a 3-minute real-person pitch video, and a thread or article published on X.

## Current Phase

Phase 1 builds a working UI and typed integration boundaries with mocked registry/decryption data so most behavior is testable without credentials.

Current implemented surface:

- wrapper-pair registry browser for Sepolia and Ethereum mainnet
- official-address seeded local mode for deterministic tests and demos
- optional `viem` chain-read mode when `VITE_SEPOLIA_RPC_URL` or `VITE_MAINNET_RPC_URL` is present
- registry validity checks using `getTokenConfidentialTokenPairs` and `getConfidentialTokenAddress`
- explicit wallet/relayer action plans for faucet, approve, wrap, unwrap, finalize, and user decryption
- injected wallet readiness via `eth_accounts`
- explicit user-clicked wallet connection via `eth_requestAccounts`
- selected-wrapper network readiness via `eth_chainId` plus user-clicked `wallet_switchEthereumChain`
- transaction-intent review plus explicit Sepolia-only wallet submission controls for faucet, ERC-20 approval, and wrapper wrap
- EIP-712 user-decryption signing payload preparation behind a wallet adapter boundary
- `@zama-fhe/relayer-sdk` live user-decryption boundary for SDK initialization, official EIP-712 creation, signature handoff, and `userDecrypt`
- submission-readiness panel that marks local-only work separately from external deployment, signing, video, and form gates
- final-form evidence packet with public links, validation commands, remaining external gates, and no secret/signature material
- public submission packet, demo script, article draft, form-answer draft, and relayer user-decryption implementation plan
- credential-free public demo video generated from the deployed app

```bash
bun install
bun run test
bun run build
bun run build:pages
```

## Integration Notes

- Registry reads follow Zama's documented `getTokenConfidentialTokenPairs` and `getConfidentialTokenAddress` patterns, including the validity flag check before use.
- Wrapper flow follows the documented ERC-20 approval before wrap, and the two-step unwrap plus public decryption/finalize flow.
- `src/services/transactionIntents.ts` prepares call data only where the app has deterministic inputs: Sepolia mock faucet, ERC-20 approval, and wrapper `wrap(uint256)`. `src/services/transactionSubmission.ts` submits those ready intents only through explicit Sepolia wallet clicks after network checks. Unwrap and finalize stay relayer-gated rather than inventing live encrypted-handle calldata.
- `src/services/liveRelayerUserDecryption.ts` lazy-loads `@zama-fhe/relayer-sdk/web`, initializes the SDK, creates the official user-decryption EIP-712 payload, accepts an injected-wallet signature, and calls `userDecrypt` only when a real handle path is supplied.
- Official deployed address seeds come from `zama-ai/protocol-apps` address docs for Ethereum mainnet and Sepolia.
- Without `VITE_SEPOLIA_RPC_URL` or `VITE_MAINNET_RPC_URL`, the app uses local seeded data so tests/builds stay deterministic.

## Submission Gates Still Not Claimed

This repository is not a final bounty submission yet. Remaining external gates:

- connect a wallet and execute Sepolia-only demo transactions through the explicit submit controls
- execute the relayer SDK user-decryption flow with a real encrypted handle and EIP-712 signature
- record or obtain the required 3-minute real-person pitch video
- publish the required X thread or X article outside this repository
- submit the final Season 3 Zama form and payout details

No wallet private key, real signature, payout account, RPC secret, live transaction proof, or final form submission is included in this handoff. The public GitHub Pages deployment is live and remains credential-free.

## Public Submission Assets

- Season 3 bounty form: https://forms.zama.org/developer-program-mainnet-season3-bounty-track
- Season 3 announcement: https://www.zama.org/post/zama-developer-program-mainnet-season-3-composable-privacy-is-the-key
- Public demo: https://benitbuhner.github.io/zama-wrapper-registry-app/
- Submission packet: [docs/SUBMISSION-PACKET.md](docs/SUBMISSION-PACKET.md)
- Demo script: [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md)
- Published article: [docs/ARTICLE.md](docs/ARTICLE.md)
- Demo video: https://benitbuhner.github.io/zama-wrapper-registry-app/zama-wrapper-registry-demo.webm
- Article draft: [docs/ARTICLE-DRAFT.md](docs/ARTICLE-DRAFT.md)
- Form answers draft: [docs/FORM-ANSWERS-DRAFT.md](docs/FORM-ANSWERS-DRAFT.md)
- Relayer user-decryption plan: [docs/RELAYER-USER-DECRYPTION-PLAN.md](docs/RELAYER-USER-DECRYPTION-PLAN.md)
- Live relayer source: [src/services/liveRelayerUserDecryption.ts](src/services/liveRelayerUserDecryption.ts)

## References

- Zama protocol app addresses: https://github.com/zama-ai/protocol-apps/blob/main/docs/addresses.md
- Zama Season 3 bounty form: https://forms.zama.org/developer-program-mainnet-season3-bounty-track
- Zama Season 3 announcement: https://www.zama.org/post/zama-developer-program-mainnet-season-3-composable-privacy-is-the-key
- Registry contract guide: https://docs.zama.org/protocol/protocol-apps/registry-contract
- Confidential wrapper guide: https://docs.zama.org/protocol/protocol-guides/confidential-wrapper
- User decryption guide: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption
