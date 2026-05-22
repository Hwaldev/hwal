# Architecture

Hwal is a single Anchor program with three account types and eight
instructions. The on-chain state is minimal by design: a `Config` account
holds program-wide policy, a `PriceFeed` account stores the most recent
price update for a symbol, and one `Position` PDA per (owner, nonce)
records the collateral and three trigger conditions.

## Account model

```
Config PDA            seeds = ["config"]
PriceFeed PDA         seeds = ["feed", symbol(16 bytes, zero-padded)]
Position PDA          seeds = ["position", owner_pubkey, nonce_le8]
Position vault PDA    seeds = ["vault", position_pubkey]
```

The position vault holds the SOL collateral as a system-owned PDA so it can
both receive lamports on `open_position` and send lamports out on
`tick_position` (settle) or `cancel_position` (refund) via signed CPI from
the program.

## Lifecycle

```
                       ┌────────────────────┐
   open_position  ─>   │   Status: Open     │
                       └────────┬───────────┘
                                │
                                │ tick_position
                                │  (any signer; feed read; trailing update)
                                │
                       ┌────────▼───────────┐
                       │ trigger condition  │
                       │ evaluated in order │
                       └────────┬───────────┘
                                │ first match
                                │
                       ┌────────▼───────────┐
                       │ Status: Triggered  │
                       │ reason ∈ {SL,TP,TR}│
                       │ vault drained:     │
                       │   keeper reward    │
                       │   protocol fee     │
                       │   net to owner     │
                       └────────────────────┘

   Open  ──cancel_position (owner only)──>  Status: Cancelled
                                            full collateral refund
```

State transitions:

- `Open → Triggered`: any tick that finds a matching trigger condition. The
  fire-pay-settle sequence is one transaction.
- `Open → Cancelled`: owner-only manual close. No trigger required.

Once a position is `Triggered` or `Cancelled` it is terminal. The vault is
drained and the position account is rent-payer-refunded only by an explicit
close instruction in a future version.

## Trigger evaluation order

For each `tick_position`, the handler:

1. Asserts the position is `Open` and the feed referenced matches the
   position's stored feed pubkey.
2. Reads `feed.price`. If zero or older than `MAX_FEED_STALENESS_SECS`, it
   errors out with `PriceFeedStale` / `PriceFeedZero`.
3. Advances `trailing_extreme`:
   - Long: `trailing_extreme = max(trailing_extreme, price)`.
   - Short: `trailing_extreme = min(trailing_extreme, price)`.
4. Evaluates in this order, first match wins:
   1. Stop-loss
   2. Take-profit
   3. Trailing-stop
5. If a trigger fires, it computes payouts and CPI-transfers from the vault
   to keeper, fee receiver, then owner. Position is marked `Triggered`.
6. If no trigger fires, `last_tick_at` and `tick_count` are updated and the
   instruction returns success.

## Fee model

On every fired trigger, payouts come out of the position vault in this order:

1. Keeper reward = `collateral * keeper_reward_bps / 10_000`
2. Protocol fee = `collateral * fee_bps / 10_000`
3. Owner net = `vault_balance - keeper_reward - protocol_fee`

If `keeper_reward_bps + fee_bps > 10_000` the program rejects the config
update at `update_config` time, so payouts are guaranteed to fit.

## Why permissionless ticks

`tick_position` accepts any signer as the keeper. There is no allowlist. The
0.25%-of-collateral default reward is enough to make MEV-style competition
profitable. Whoever lands the tick first earns it.

This is the key property the MagicBlock ER and Pyth Lazer integrations rely
on. The Lazer verify path lets any participant push a fresh 1 ms price into
the `PriceFeed` cache, and the permissionless `tick_position` lets any
participant act on it. When the position is delegated to a MagicBlock ER,
both calls happen inside the rollup at 50 ms cadence, and the settlement
commits back to L1 atomically. L1 keepers continue to operate as the
fallback path, so an undelegated position or a Lazer outage degrades to V0
behavior rather than freezing.

## Failure modes

| failure | error | when it can happen |
| --- | --- | --- |
| Tick on closed position | `PositionNotOpen` | retry after settlement |
| Stale feed | `PriceFeedStale` | feed authority needs to push a price |
| Zero feed | `PriceFeedZero` | feed was initialized but never updated |
| Wrong feed account | `FeedMismatch` | client passed wrong PriceFeed PDA |
| No trigger met | `NoTriggerHit` | only returned by `tick_position` test helper |
| Math overflow | `MathOverflow` | unrealistic collateral or price magnitudes |
| Fee bps too high | `FeeBpsTooHigh` | admin tried to set fee_bps > 500 |
| Keeper reward too high | `KeeperRewardTooHigh` | admin tried to set keeper_reward_bps > 200 |

See [threat-model.md](threat-model.md) for the adversarial analysis behind
each constraint.
