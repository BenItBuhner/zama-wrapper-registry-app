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
- Separates local-only proof from external gates so the app does not imply a wallet transaction happened before it did.

## Validation Evidence

Local validation before publication:

```bash
bun run test
bun run build
bun run build:pages
```

GitHub Pages validation:

- Pages workflow `26856900220` passed test, build, artifact upload, and deployment.
- `https://benitbuhner.github.io/zama-wrapper-registry-app/` returned HTTP 200.
- Main JavaScript and CSS asset URLs returned HTTP 200.

## Remaining External Gates

- Execute Sepolia-only demo transactions with a real wallet.
- Wire the relayer SDK user-decryption flow against a real encrypted balance handle.
- Record a real demo video after the wallet and decryption path are exercised.
- Publish the final article or X thread.
- Submit the final Zama bounty form and payout details.

No private key, wallet seed, payout detail, RPC secret, signature, or transaction proof is committed here.
