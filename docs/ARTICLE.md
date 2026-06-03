# Building A Confidential Wrapper Registry Browser For Zama

Confidential wrappers let standard ERC-20 tokens move into Zama's ERC-7984 confidential-token flow. That makes address provenance and user workflow clarity important: before a user approves or wraps an asset, a dApp should be able to show which wrapper pair it selected, where the registry lives, which operations still require a wallet, and which parts depend on the relayer.

This project builds that public inspection layer as a credential-free browser app:

- Public demo: https://benitbuhner.github.io/zama-wrapper-registry-app/
- Repository: https://github.com/BenItBuhner/zama-wrapper-registry-app
- Demo video: https://benitbuhner.github.io/zama-wrapper-registry-app/zama-wrapper-registry-demo.webm

## Registry-First Wrapper Discovery

The app surfaces Sepolia and Ethereum mainnet wrapper pairs from official deployed-address seeds and can optionally validate those pairs through configured RPC reads. The registry boundary follows the documented wrapper-registry methods:

- `getTokenConfidentialTokenPairs`
- `getConfidentialTokenAddress`
- the pair `isValid` flag

The UI keeps the selected wrapper's underlying token, confidential token, wrapper contract, registry contract, conversion rate, faucet availability, and health state visible before any transaction path is considered.

## Wallet And Network Boundaries

The wallet path is deliberately explicit. On page load, the app can inspect an injected EIP-1193 provider with `eth_accounts`, but it does not force a wallet connection. The only path that calls `eth_requestAccounts` is the visible `Connect wallet` button.

Network readiness is treated the same way. The app reads `eth_chainId`, compares it to the selected wrapper network, and only calls `wallet_switchEthereumChain` from a user-clicked action.

## Unsigned Transaction Review

The app prepares unsigned transaction intents for the deterministic parts of the Sepolia demo:

- mock-token faucet `mint(address,uint256)`
- ERC-20 `approve(address,uint256)`
- wrapper `wrap(uint256)`

Each intent shows target contract, method, chain ID, amount, parameters, and calldata before any wallet submission. Mainnet faucet paths fail closed, and relayer-dependent unwrap/finalize paths keep calldata empty until live encrypted handles and proofs are available.

## Relayer User-Decryption Boundary

The current implementation also drafts the relayer user-decryption request shape and EIP-712 signing payload without forcing a live signature. The boundary checks:

- ciphertext handle and contract pairs
- signer address
- public key
- timestamp and duration
- total ciphertext bit length limit
- wallet address/signing blockers

This makes the relayer path reviewable while preserving the external gate for a real encrypted balance handle, real EIP-712 signature, and live relayer SDK `userDecrypt` call.

## Evidence And Remaining Gates

The public app includes an evidence packet with repository, demo, docs, validation commands, form-answer draft, and remaining external gates. Local validation currently passes:

```bash
bun run test
bun run build
bun run build:pages
```

The current public demo and video are credential-free and do not claim live wallet transactions. The remaining live gates are Sepolia transaction execution, live relayer user decryption, final form submission, and payout details.
