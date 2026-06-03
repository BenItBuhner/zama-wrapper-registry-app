# Relayer User-Decryption Integration Plan

This file tracks the wallet-gated implementation path without requiring a wallet signature during local publication.

## Official Flow

Zama's relayer SDK user-decryption guide describes this client-side sequence:

1. Retrieve a ciphertext handle from the contract.
2. Generate a relayer keypair.
3. Build an EIP-712 `UserDecryptRequestVerification` message.
4. Sign typed data with the connected wallet.
5. Call `userDecrypt` with the handle/contract pairs, keypair, signature, contract addresses, user address, start timestamp, and duration.

Reference: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption

## App Boundary

The app already separates the decryption button from real relayer execution:

- current public mode uses deterministic mock balances
- readiness state marks balance decryption as an external gate
- action plans identify user decryption as relayer-gated
- `src/services/relayerUserDecryption.ts` validates and prepares the unsigned request payload shape needed for `userDecrypt`
- `src/services/signingAdapter.ts` prepares the EIP-712 wallet-signing payload and reports wallet blockers without forcing a signature
- `src/services/providerAdapter.ts` adapts an injected EIP-1193 provider into the signing boundary using `eth_requestAccounts`, `eth_accounts`, and `eth_signTypedData_v4`
- `src/services/userDecryptionSigningSession.ts` connects the selected wrapper pair and injected wallet adapter into a UI-ready signing session with blockers, draft metadata, and explicit signature invocation
- `src/services/liveRelayerUserDecryption.ts` lazy-loads `@zama-fhe/relayer-sdk/web`, runs `initSDK`, creates a Sepolia instance, generates the SDK keypair, creates the official EIP-712 user-decryption payload, and calls `userDecrypt` only after a matching wallet signature is supplied
- `src/services/transactionIntents.ts` prepares faucet/approve/wrap calldata where inputs are deterministic and leaves unwrap/finalize calldata empty until relayer encrypted handles and proofs are available
- `src/services/transactionSubmission.ts` submits only ready Sepolia intents through explicit injected-wallet `eth_sendTransaction` clicks after account and network checks
- the public UI exposes user-clicked controls to prepare the EIP-712 request, request an injected-wallet signature, and submit Sepolia faucet/approval/wrap transactions
- tests cover missing handles, malformed addresses, the documented 2048-bit batch limit, missing wallet connection, missing signing capability, address mismatch, absent providers, malformed provider accounts, UI signing-session summaries, fake-provider typed-data calls, guarded Sepolia transaction submission, and fake-SDK live relayer user-decryption flow

## Implementation Checklist

- Add `@zama-fhe/relayer-sdk` after confirming the currently recommended browser package version. Done with npm latest `0.4.3`.
- Connect the provider adapter boundary to the browser UI and supported wallet provider. Done for explicit request preparation/signature prompts; live wallet execution evidence remains pending.
- Confirm the Sepolia mock-token faucet ABI in the live demo before submitting the unsigned faucet intent through a wallet.
- Capture Sepolia faucet, approval, and wrap transaction hashes from the explicit submit controls.
- Retrieve the selected confidential token balance ciphertext handle from the wrapper or token contract.
- Ensure ACL permissions exist for the handle before requesting user decryption.
- Generate the keypair through the relayer instance in-browser.
- Create the EIP-712 request with the selected contract address, start timestamp, and bounded duration. Done in the SDK boundary; live evidence still requires a real handle.
- Pass signature data to `userDecrypt`. Implemented in the SDK boundary; live evidence still requires a real signature and encrypted handle.
- Display the decrypted balance result in the existing balance readout.
- Add tests for missing-wallet and missing-live-handle states once the wallet adapter is present.

## Fail-Closed Rules

- Never store wallet private keys, seed phrases, signatures, or decrypted balances in source.
- Do not attempt mainnet signing during bounty validation.
- Do not show a decrypted value unless the relayer call succeeds for the connected user.
- Keep local seeded demo mode available when no RPC or wallet is configured.
