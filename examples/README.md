# examples

Runnable demos that exercise the Chalna program end to end. Each script is
self-contained: it loads the wallet from `ANCHOR_WALLET`, generates the
required position nonce, and drives a complete lifecycle so you can copy
the same code into your own integration.

## Index

| file | summary |
| --- | --- |
| `long-stop-loss.ts` | open a long, push price below stop, watch keeper fire SL |
| `short-take-profit.ts` | open a short, push price below TP, watch keeper fire TP |
| `trailing-stop.ts` | open a long, ratchet price up, then drop, watch trailing fire |

## Setup

```bash
yarn install --frozen-lockfile
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=~/.config/solana/id.json
```

Make sure the program is deployed and the SOL feed is initialized. See
[DEPLOY.md](../DEPLOY.md).

## Run

```bash
yarn ts-node examples/long-stop-loss.ts
```

Each script prints the position pubkey, every tick the keeper observes,
and the final settlement breakdown.
