# X Thread Draft

Use this as the source for the required Season 3 X thread or X article. Replace bracketed fields only if live wallet evidence is available before posting.

## Thread

1. I built Confidential Wrapper Registry for the Zama Developer Program Season 3 bounty.

It turns the official Zama ERC-20 to ERC-7984 wrapper registry into a browser dApp for developers and users.

#ZamaDeveloperProgram

2. The app surfaces Sepolia and Ethereum mainnet wrapper pairs, including underlying token, confidential token, wrapper address, registry address, conversion rate, faucet support, and health checks.

Demo: https://benitbuhner.github.io/zama-wrapper-registry-app/

3. The goal is to reduce duplicated test wrappers.

Instead of every builder deploying new ERC-20 mocks and confidential wrappers, the app makes the official registry easy to inspect, validate, and use.

4. Wallet actions are explicit.

The app separates passive wallet readiness from user-clicked connection, chain switching, transaction review, transaction submission, EIP-712 signing, and relayer user decryption.

5. The Sepolia path prepares faucet, ERC-20 approval, and wrapper wrap transaction intents before any wallet prompt.

Mainnet faucet and submit paths fail closed.

6. The user-decryption path uses `@zama-fhe/relayer-sdk`.

It initializes the SDK, creates the official user-decryption EIP-712 payload, signs through an injected wallet adapter, and calls `userDecrypt` only when a real encrypted handle is supplied.

7. Evidence and source:

Repo: https://github.com/BenItBuhner/zama-wrapper-registry-app
Submission packet: https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/SUBMISSION-PACKET.md
Article: https://github.com/BenItBuhner/zama-wrapper-registry-app/blob/main/docs/ARTICLE.md

8. Current validation:

`bun run test`
`bun run build`
`bun run build:pages`

All local checks pass, and the public app is deployed through GitHub Pages.

9. Live evidence status:

[Add Sepolia faucet/approve/wrap hashes here if available.]
[Add user-decryption output summary here if available.]

The public repo does not include private keys, signatures, RPC secrets, payout details, or fabricated transaction proof.

10. This is a focused product layer for the Season 3 challenge: a production-ready Confidential Wrapper Registry App that makes official Zama wrapper pairs easier to discover, validate, wrap, unwrap, and decrypt.
