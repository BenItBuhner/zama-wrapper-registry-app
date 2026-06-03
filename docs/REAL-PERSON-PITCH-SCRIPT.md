# Real-Person Pitch Script

Use this script for the required 3-minute Season 3 video. The form says AI-generated video or voice will not be considered, so this must be recorded by a real person before final submission.

## Target

- Length: about 3 minutes.
- Format: real-person voice and/or face, plus screen share of the deployed app.
- Required links to show or mention: public demo, GitHub repository, submission packet, and X thread/article.

## Script

Hi, I am presenting Confidential Wrapper Registry, built for the Zama Developer Program Season 3 bounty.

The challenge asks for a production-ready app that turns the official Zama ERC-20 to ERC-7984 wrapper registry into a usable product. The problem is that many builders spin up their own test tokens and confidential wrappers instead of reusing the official registry. That fragments demos, integrations, and user flows.

This app focuses on making the official registry easy to inspect and use. On the first screen, you can browse Sepolia and Ethereum mainnet wrapper pairs. Each pair shows the underlying ERC-20 token, the confidential ERC-7984 token, wrapper address, registry address, conversion rate, faucet availability, and local health checks.

The app is designed around explicit wallet boundaries. It can detect whether an injected EIP-1193 wallet is available, but it does not force a connection on page load. Wallet connection, network switching, transaction submission, EIP-712 signing, and relayer user decryption are all separate user-clicked actions.

For Sepolia, the app prepares deterministic transaction intents for the mock-token faucet, ERC-20 approval, and wrapper `wrap(uint256)` call. Each card shows the target contract, method, amount, chain ID, and calldata before any wallet prompt. Mainnet faucet and public submit paths fail closed.

For decryption, the app includes a live `@zama-fhe/relayer-sdk` boundary. It initializes the SDK, creates the official user-decryption EIP-712 payload, signs through the injected wallet adapter, and calls `userDecrypt` only when a real encrypted handle is supplied.

The public evidence packet links the repository, deployed demo, article, demo video, relayer plan, and validation commands. The latest local checks are `bun run test`, `bun run build`, and `bun run build:pages`.

The current public demo is credential-free and does not include private keys, wallet seeds, RPC secrets, payout details, fabricated signatures, or fabricated transaction hashes. Any live Sepolia transaction hashes and user-decryption output should be added only after the wallet flow is actually executed.

In short, Confidential Wrapper Registry is a product layer for the official Zama wrapper registry: discover pairs, validate them, prepare wrap and unwrap flows, and expose the user-decryption path in a way that is clear, testable, and safe.
