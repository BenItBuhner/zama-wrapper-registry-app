# Building A Confidential Wrapper Registry Browser For Zama

This project is a public demo app for Zama's confidential wrapper registry. It helps users inspect ERC-20 tokens and their ERC-7984 confidential wrappers before attempting wrap, unwrap, or user-decryption flows.

## Why The Registry Matters

Confidential wrappers let ordinary ERC-20 tokens become confidential ERC-7984 tokens. Before a user wraps an asset, the dApp should verify the wrapper through the official registry rather than trusting a pasted address. The registry exposes token/wrapper pairs and an `isValid` flag, which lets the UI distinguish usable wrappers from missing or revoked entries.

## What The App Does

The app surfaces Sepolia and Ethereum mainnet wrapper pairs with:

- underlying token metadata
- confidential token metadata
- wrapper address
- registry address
- conversion rate
- faucet availability
- registry health checks

It also shows the operational sequence for faucet, approval, wrap, unwrap, finalize, and user decryption. This is intentionally explicit: users should see which steps need a wallet signature, which steps need relayer support, and which steps are only deterministic local proof until a live RPC or wallet is connected.

## User Decryption Plan

The final encrypted-balance flow follows Zama's relayer SDK user-decryption model:

1. Retrieve a ciphertext handle from a contract view.
2. Generate a relayer keypair in the browser.
3. Create an EIP-712 user-decryption request for the target contract.
4. Ask the connected wallet to sign the typed data.
5. Call the relayer SDK `userDecrypt` method with the handle, keypair, signature, contract address, user address, timestamp, and duration.
6. Display the decrypted value only to the user who signed the request.

## Current Public Proof

- Repository: https://github.com/BenItBuhner/zama-wrapper-registry-app
- Demo: https://benitbuhner.github.io/zama-wrapper-registry-app/
- Validation: `bun run test`, `bun run build`, and `bun run build:pages`

The public demo is deployed through GitHub Pages. The remaining external gates are a Sepolia wallet demo, relayer SDK user-decryption execution, a final video, and the Zama form submission.
