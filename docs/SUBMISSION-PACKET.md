# Zama Wrapper Registry App Submission Packet

## Public Links

- Repository: https://github.com/BenItBuhner/zama-wrapper-registry-app
- Demo: https://benitbuhner.github.io/zama-wrapper-registry-app/
- Demo video: https://benitbuhner.github.io/zama-wrapper-registry-app/zama-wrapper-registry-demo.webm
- Published article: https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/ARTICLE.md
- GitHub Pages workflow: https://github.com/BenItBuhner/zama-wrapper-registry-app/actions/workflows/pages.yml
- Form answers draft: https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/FORM-ANSWERS-DRAFT.md

## What This App Demonstrates

- Browses official ERC-20 to ERC-7984 confidential wrapper pairs for Sepolia and Ethereum mainnet.
- Uses official deployed registry/wrapper address seeds for deterministic public demos.
- Supports optional live registry reads through `VITE_SEPOLIA_RPC_URL` and `VITE_MAINNET_RPC_URL`.
- Validates registry pairs through `getTokenConfidentialTokenPairs` and `getConfidentialTokenAddress`.
- Shows an explicit wallet action plan for faucet, approval, wrap, unwrap request, finalize, and user decryption.
- Detects an injected EIP-1193 wallet provider without forcing connection.
- Offers a user-clicked wallet connection path through `eth_requestAccounts`.
- Checks the selected wrapper network through `eth_chainId` and offers a user-clicked `wallet_switchEthereumChain` path for Sepolia/mainnet alignment.
- Prepares unsigned transaction intents for Sepolia faucet, ERC-20 approval, wrapper wrap, relayer-gated unwrap request, and unwrap finalization review.
- Prepares typed user-decryption signing payloads behind an explicit adapter boundary without forcing a real signature in the public demo.
- Packages a final-form evidence checklist with public links, validation commands, completed local boundaries, and remaining external gates.
- Separates local-only proof from external gates so the app does not imply a wallet transaction happened before it did.

## Validation Evidence

Local validation before publication:

```bash
bun run test
bun run build
bun run build:pages
```

Latest GitHub Pages validation:

- Pages workflow `26859741226` passed test, build, artifact upload, and deployment for commit `396b28b63a48e39a99dd1fd528e3cfd5210c41d7`.
- `https://benitbuhner.github.io/zama-wrapper-registry-app/` returned HTTP 200.
- Raw source URLs for `src/services/submissionEvidence.ts` and `docs/SUBMISSION-PACKET.md` returned HTTP 200.

Unsigned transaction-intent coverage:

- Sepolia faucet intent builds mock-token `mint(address,uint256)` calldata only after a connected wallet address is known.
- Approval intent builds ERC-20 `approve(address,uint256)` calldata for the selected wrapper and one demo token amount.
- Wrap intent builds wrapper `wrap(uint256)` calldata for the same demo amount.
- Mainnet faucet intent fails closed as not supported.
- Unwrap and finalize intents record target contract, method shape, and required live relayer inputs while keeping calldata null until encrypted handles/proofs exist.

Evidence-packet coverage:

- Public repository, GitHub Pages demo, demo video, published article, submission packet, demo script, relayer plan, and form-answer draft links are visible in the app.
- Required local validation commands are visible in the app: `bun run test`, `bun run build`, and `bun run build:pages`.
- Remaining external gates are explicitly separated from local validation so the app does not claim wallet signatures, transaction proof, video publication, article/X publication, or form submission before they happen.

## Remaining External Gates

- Execute Sepolia-only demo transactions with a real wallet.
- Wire the relayer SDK user-decryption flow against a real encrypted balance handle.
- Produce a real EIP-712 signature and relayer user-decryption response from a connected wallet.
- Replace or supplement the credential-free demo video if the final reviewer requires live wallet transaction footage.
- Use the published article link, or replace it with an X thread if the final form requires X specifically.
- Submit the final Zama bounty form with the prepared answers and payout details.

No private key, wallet seed, payout detail, RPC secret, signature, or transaction proof is committed here.
