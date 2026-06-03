# Zama Wrapper Registry App Submission Packet

## Public Links

- Repository: https://github.com/BenItBuhner/zama-wrapper-registry-app
- Demo: https://benitbuhner.github.io/zama-wrapper-registry-app/
- GitHub Pages workflow: https://github.com/BenItBuhner/zama-wrapper-registry-app/actions/workflows/pages.yml

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
- Separates local-only proof from external gates so the app does not imply a wallet transaction happened before it did.

## Validation Evidence

Local validation before publication:

```bash
bun run test
bun run build
bun run build:pages
```

Latest GitHub Pages validation:

- Pages workflow `26858542545` passed test, build, artifact upload, and deployment for commit `38d9e6c29f6c48f6b76904a4a843335c406e654c`.
- `https://benitbuhner.github.io/zama-wrapper-registry-app/` returned HTTP 200.
- Raw source URLs for `src/services/transactionIntents.ts` and `src/App.tsx` returned HTTP 200.

Unsigned transaction-intent coverage:

- Sepolia faucet intent builds mock-token `mint(address,uint256)` calldata only after a connected wallet address is known.
- Approval intent builds ERC-20 `approve(address,uint256)` calldata for the selected wrapper and one demo token amount.
- Wrap intent builds wrapper `wrap(uint256)` calldata for the same demo amount.
- Mainnet faucet intent fails closed as not supported.
- Unwrap and finalize intents record target contract, method shape, and required live relayer inputs while keeping calldata null until encrypted handles/proofs exist.

## Remaining External Gates

- Execute Sepolia-only demo transactions with a real wallet.
- Wire the relayer SDK user-decryption flow against a real encrypted balance handle.
- Produce a real EIP-712 signature and relayer user-decryption response from a connected wallet.
- Record a real demo video after the wallet and decryption path are exercised.
- Publish the final article or X thread.
- Submit the final Zama bounty form and payout details.

No private key, wallet seed, payout detail, RPC secret, signature, or transaction proof is committed here.
