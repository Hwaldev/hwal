# Chalna devnet deploy runbook

Status as of this commit:

- `target/deploy/chalna.so` is built (322 KB)
- Program ID is `fSLsjTm9PGfbrAgosY2kYb1MnFEpn8LALo5cY5a4AkJ`
- Program upgrade keypair backed up to `C:\Users\baayo\.claude\keys\chalna\`
- `node_modules` installed
- Anchor.toml cluster is `devnet`
- Wallet `7uWAijGKK2aRBvab6mgbU8QgkM4arfcZbAn15P2cAPxX` holds only 0.166 SOL.
  Devnet RPC airdrop is rate-limited so the wallet must be topped up out of band.

## Fund the wallet

Pick one. Need ~4.5 SOL for the program account + buffer.

1. CLI when the limit resets:
   ```powershell
   solana airdrop 2
   solana airdrop 2
   ```
2. Web faucet, paste the wallet address:
   - https://faucet.solana.com
   - https://solfaucet.com

Verify:

```powershell
solana balance
```

## Deploy

```powershell
cd C:\Users\baayo\Desktop\pro\낭만\chalna
anchor deploy --provider.cluster devnet
```

This sends the buffer + deploys the program at `fSLsjTm9PGfbrAgosY2kYb1MnFEpn8LALo5cY5a4AkJ` and burns ~2.24 SOL of rent (refundable on close).

## Bootstrap config + SOL feed

```powershell
$env:ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com"
$env:ANCHOR_WALLET = "C:\Users\baayo\.config\solana\id.json"
npx ts-node scripts/setup-devnet.ts
```

Outputs the addresses of `Config` and the `SOL` price feed. A feed-authority keypair is written to `~\.config\solana\chalna-feed-authority.json`.

## Push a price

```powershell
npx ts-node scripts/push-price.ts SOL 152000000
```

Argument is USD price scaled by 1e6 (matches the 6 decimals set at feed init).

## Run the keeper

```powershell
npx ts-node scripts/keeper-bot.ts 500
```

Polls every 500 ms, sweeps every `Position` that is still in status `Open`, and submits a `tick_position` for each. On a trigger fire it earns 0.25% of the position's collateral.

## Smoke test from the dashboard

After deploy:

1. push price 152.000000
2. open a long position with collateral 0.05 SOL, stop 140e6, tp 155e6, trailing 0
3. push price 156.000000
4. keeper bot fires take-profit at 156e6
5. owner receives 0.05 SOL minus 0.50% fee minus 0.25% keeper reward

## Rollback / close

To recover the rent-exempt SOL from the program account:

```powershell
solana program close fSLsjTm9PGfbrAgosY2kYb1MnFEpn8LALo5cY5a4AkJ --bypass-warning
```

Only do this if you are sure no positions are still open under the program.
