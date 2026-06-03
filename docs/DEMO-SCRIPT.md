# Demo Script

Use this script for the final video after the wallet and Sepolia gates are satisfied.

## 1. Open The Public Demo

Open https://benitbuhner.github.io/zama-wrapper-registry-app/.

Show the registry status pill and explain whether the app is using local seeded registry data or live chain RPC reads.

## 2. Browse Wrapper Pairs

Switch between `all`, `sepolia`, and `mainnet`.

For each selected pair, point out:

- underlying token
- confidential token
- wrapper contract
- registry contract
- conversion rate
- faucet availability
- registry health

## 3. Sepolia Faucet Flow

Select a Sepolia pair with faucet support.

Show the wallet boundary panel:

- injected provider status
- connected account status
- typed user-decryption signing readiness
- current chain ID
- selected wrapper network match

Click `Connect wallet` only when ready to request an account, then click the network switch control if the wallet is not on Sepolia. Show the faucet action plan and execute the faucet step only on Sepolia.

## 4. Unsigned Transaction Intent Review

Show the prepared transaction boundary panel before submitting anything.

For a Sepolia pair, point out:

- faucet `mint(address,uint256)` intent requires a connected wallet address
- approval `approve(address,uint256)` targets the underlying ERC-20
- wrap `wrap(uint256)` targets the wrapper contract
- unwrap and finalize remain relayer-gated and do not invent calldata before live encrypted handles and proofs exist

For a mainnet pair, show that the faucet intent fails closed as not supported and the public submit controls stay disabled.

## 5. Wrap Flow

Show the approval step first, then the wrap step.

Confirm the wrapper address before submitting. Use only a small Sepolia test amount.

Click the explicit `Submit on Sepolia` controls for the faucet, approval, and wrap intents only after the wallet is connected and on Sepolia. Record the returned transaction hashes for the final form.

## 6. Unwrap Flow

Show the unwrap request step, then the finalize step after public decryption is available.

Explain that unwrap is asynchronous and requires finalization proof handling.

## 7. User Decryption

Show the relayer user-decryption path:

- retrieve the ciphertext handle for the selected balance
- generate the relayer keypair
- create the EIP-712 user-decryption request
- sign the typed data with the connected wallet
- call `userDecrypt`
- show the decrypted value only to the connected user

## 8. Submission Wrap-Up

Show the submission readiness panel and explain which gates are complete.

End with repository, demo URL, and validation commands.
