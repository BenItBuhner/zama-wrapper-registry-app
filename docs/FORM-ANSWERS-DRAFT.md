# Zama Bounty Form Answers Draft

Use this as the final-form source after the remaining live gates are completed. Do not submit this draft until the wallet demo, required real-person video, X article/thread, and payout details are available.

Official target: Zama Developer Program Mainnet Season 3 Bounty Track, "Confidential Wrapper Registry App."

Submission form: https://forms.zama.org/developer-program-mainnet-season3-bounty-track

Deadline: July 7, 2026 at 23:59 AOE.

## Project Name

Confidential Wrapper Registry

## Repository

https://github.com/BenItBuhner/zama-wrapper-registry-app

## Public Demo

https://benitbuhner.github.io/zama-wrapper-registry-app/

## Short Description

Confidential Wrapper Registry is a browser dApp for inspecting Zama ERC-20 to ERC-7984 confidential wrapper pairs on Sepolia and Ethereum mainnet. It shows official registry/wrapper addresses, validates wrapper-pair health, separates wallet and network readiness, prepares faucet/approve/wrap transaction intents, exposes explicit Sepolia-only submit controls, and documents the relayer user-decryption path without claiming live signatures before they happen.

## What Was Built

- Wrapper-pair browser for official Sepolia and mainnet registry/wrapper address seeds.
- Optional `viem` live registry reads through `VITE_SEPOLIA_RPC_URL` and `VITE_MAINNET_RPC_URL`.
- Registry validation using `getTokenConfidentialTokenPairs` and `getConfidentialTokenAddress`.
- Wallet readiness boundary using passive `eth_accounts` inspection.
- User-clicked wallet connection through `eth_requestAccounts`.
- Network readiness and user-clicked chain switching through `eth_chainId` and `wallet_switchEthereumChain`.
- Sepolia faucet, ERC-20 approval, and wrapper `wrap(uint256)` transaction intent review plus explicit Sepolia-only wallet submission controls.
- Fail-closed relayer-gated unwrap and finalize intent placeholders.
- Typed relayer user-decryption draft, EIP-712 signing boundary, and `@zama-fhe/relayer-sdk` live execution boundary.
- Public evidence packet with links, validation commands, completed local boundaries, and remaining external gates.

## Validation

Latest local validation:

```bash
bun run test
bun run build
bun run build:pages
git diff --check
```

Latest verified result:

- Commit: latest public `main`
- Test result: `27/27`
- GitHub Pages workflow: latest public Pages deployment
- Public demo: HTTP `200`
- Raw evidence service: HTTP `200` at `src/services/submissionEvidence.ts`
- Raw submission packet: HTTP `200` at `docs/SUBMISSION-PACKET.md`

## Demo Video Link

https://benitbuhner.github.io/zama-wrapper-registry-app/zama-wrapper-registry-demo.webm

Current status: credential-free public demo video generated from the deployed app. It shows registry browsing, transaction intents, live-demo preflight gates, and the evidence packet. Replace or supplement it if the final reviewer requires live wallet transaction footage.

Season 3 form requirement: a 3-minute real-person pitch video. AI-generated video or voice will not be considered. The credential-free screen recording is useful evidence but should not be treated as satisfying the real-person pitch requirement by itself.

## Article Or X Thread Link

https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/ARTICLE.md

Season 3 form requirement: a thread or article published on X introducing the project. The GitHub article is the current public article asset, but it should be mirrored or introduced on X before final submission.

## Transaction Evidence

Pending. Add Sepolia transaction hashes after executing the wallet-gated faucet, approve, and wrap path. Do not add fabricated hashes.

## User-Decryption Evidence

Pending. The source now includes the live `@zama-fhe/relayer-sdk` init/EIP-712/userDecrypt boundary. Add relayer SDK user-decryption output after a real encrypted balance handle, EIP-712 signature, and relayer response are available.

## Payout Details

Pending. Fill only through the official Season 3 Zama submission form or user-approved payout flow.

## Notes

The current public demo is intentionally credential-free. It does not contain private keys, wallet seeds, payout details, RPC secrets, signatures, or live transaction proofs.
