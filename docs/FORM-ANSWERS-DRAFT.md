# Zama Bounty Form Answers Draft

Use this as the final-form source after the remaining live gates are completed. Do not submit this draft until the wallet demo, video, article/X post, and payout details are available.

## Project Name

Confidential Wrapper Registry

## Repository

https://github.com/BenItBuhner/zama-wrapper-registry-app

## Public Demo

https://benitbuhner.github.io/zama-wrapper-registry-app/

## Short Description

Confidential Wrapper Registry is a browser dApp for inspecting Zama ERC-20 to ERC-7984 confidential wrapper pairs on Sepolia and Ethereum mainnet. It shows official registry/wrapper addresses, validates wrapper-pair health, separates wallet and network readiness, prepares unsigned faucet/approve/wrap transaction intents, and documents the relayer user-decryption path without claiming live signatures before they happen.

## What Was Built

- Wrapper-pair browser for official Sepolia and mainnet registry/wrapper address seeds.
- Optional `viem` live registry reads through `VITE_SEPOLIA_RPC_URL` and `VITE_MAINNET_RPC_URL`.
- Registry validation using `getTokenConfidentialTokenPairs` and `getConfidentialTokenAddress`.
- Wallet readiness boundary using passive `eth_accounts` inspection.
- User-clicked wallet connection through `eth_requestAccounts`.
- Network readiness and user-clicked chain switching through `eth_chainId` and `wallet_switchEthereumChain`.
- Unsigned Sepolia faucet, ERC-20 approval, and wrapper `wrap(uint256)` transaction intent review.
- Fail-closed relayer-gated unwrap and finalize intent placeholders.
- Typed relayer user-decryption draft and EIP-712 signing boundary.
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

- Commit: `396b28b63a48e39a99dd1fd528e3cfd5210c41d7`
- Test result: `22/22`
- GitHub Pages workflow: `26859741226`
- Public demo: HTTP `200`
- Raw evidence service: HTTP `200` at `src/services/submissionEvidence.ts`
- Raw submission packet: HTTP `200` at `docs/SUBMISSION-PACKET.md`

## Demo Video Link

Pending. Record after live Sepolia wallet transactions and user-decryption output are available.

## Article Or X Thread Link

Pending. Publish from `docs/ARTICLE-DRAFT.md` after the live demo is complete.

## Transaction Evidence

Pending. Add Sepolia transaction hashes after executing the wallet-gated faucet, approve, and wrap path. Do not add fabricated hashes.

## User-Decryption Evidence

Pending. Add relayer SDK user-decryption output after a real encrypted balance handle, EIP-712 signature, and relayer response are available.

## Payout Details

Pending. Fill only through the official Zama submission form or user-approved payout flow.

## Notes

The current public demo is intentionally credential-free. It does not contain private keys, wallet seeds, payout details, RPC secrets, signatures, or live transaction proofs.
