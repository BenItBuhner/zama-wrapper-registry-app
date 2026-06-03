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

The wallet boundary is separated from the registry browser. On page load, the app can inspect whether an injected EIP-1193 provider already exposes an account through `eth_accounts`, but it does not force a connection. The only path that calls `eth_requestAccounts` is the visible `Connect wallet` control. Network readiness is handled the same way: the app passively reads `eth_chainId`, compares it to the selected Sepolia or mainnet wrapper network, and only calls `wallet_switchEthereumChain` from an explicit user action.

The transaction boundary is also explicit. The app can prepare unsigned intent data for the deterministic pieces of the flow: Sepolia mock-token faucet mint, ERC-20 approval, and wrapper `wrap(uint256)`. It shows the target contract, method, chain ID, amount, and calldata before any wallet submit path exists. For relayer-dependent unwrap and finalization, the app records the target and required live inputs but keeps calldata empty until encrypted amount handles and public-decryption proofs are actually available.

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
