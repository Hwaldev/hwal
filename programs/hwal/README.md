# hwal program

Anchor program implementing the Hwal trigger engine on Solana.

## Instructions

| instruction | accounts | summary |
| --- | --- | --- |
| `initialize_config` | config, admin, system_program | bootstrap admin + fee policy |
| `update_config` | config, admin | rotate admin or fee policy |
| `initialize_price_feed` | feed, admin, system_program | create a feed for a symbol |
| `update_price_feed` | feed, authority | push a new price (mock feed; V1 swaps for Pyth) |
| `open_position` | position, vault, feed, owner, system_program | deposit collateral, snapshot entry price, set triggers |
| `update_triggers` | position, owner | replace any of the three trigger fields |
| `tick_position` | position, vault, feed, config, fee_receiver, keeper, owner, system_program | permissionless: read feed, advance trailing, evaluate triggers, settle |
| `cancel_position` | position, vault, owner, system_program | owner-only manual close with full refund |

## Accounts

### Config

PDA seeds: `["config"]`

| field | type | notes |
| --- | --- | --- |
| admin | Pubkey | only signer allowed for update_config and initialize_price_feed |
| fee_receiver | Pubkey | recipient of protocol fees |
| fee_bps | u16 | protocol fee in basis points, <= 500 |
| keeper_reward_bps | u16 | keeper reward in basis points, <= 200 |
| positions_opened | u64 | lifetime counter |
| positions_triggered | u64 | lifetime counter |
| positions_cancelled | u64 | lifetime counter |
| total_fees_collected | u64 | lifetime lamport sum |
| bump | u8 | cached PDA bump |

### PriceFeed

PDA seeds: `["feed", symbol]` where symbol is 16 bytes zero-padded UTF-8.

| field | type | notes |
| --- | --- | --- |
| authority | Pubkey | only signer allowed for update_price_feed |
| symbol | [u8; 16] | zero-padded UTF-8 identifier |
| decimals | u8 | scaling exponent |
| price | u64 | latest price scaled by 10^decimals |
| updated_at | i64 | unix timestamp of latest push |
| update_count | u64 | lifetime counter |
| bump | u8 | cached PDA bump |

### Position

PDA seeds: `["position", owner, nonce_le8]`

| field | type | notes |
| --- | --- | --- |
| owner | Pubkey | trader |
| feed | Pubkey | price feed used at open |
| vault | Pubkey | system-owned PDA holding collateral |
| nonce | u64 | per-owner uniqueness |
| side | u8 | 0 = long, 1 = short |
| status | u8 | 0 = open, 1 = triggered, 2 = cancelled |
| trigger_reason | u8 | 0 = none, 1 = SL, 2 = TP, 3 = trailing |
| collateral | u64 | lamports deposited |
| entry_price | u64 | feed price at open |
| stop_price | u64 | 0 = disabled |
| take_profit_price | u64 | 0 = disabled |
| trailing_offset | u64 | 0 = disabled |
| trailing_extreme | u64 | running max (long) / min (short) |
| opened_at | i64 | unix timestamp |
| last_tick_at | i64 | unix timestamp |
| settled_at | i64 | unix timestamp on fire / cancel |
| tick_count | u64 | total ticks observed |
| bump | u8 | PDA bump |
| vault_bump | u8 | vault PDA bump |
| reserved | [u8; 32] | forward-compatibility padding |

## Why permissionless tick

`tick_position` accepts any signer as `keeper`. The keeper earns
`keeper_reward_bps` of the position collateral on a successful fire. This
makes the trigger competition open and converges trigger latency to the
underlying block / rollup cadence rather than a centralized keeper poll
interval.

## Build

```bash
anchor build
```

The IDL is emitted to `target/idl/hwal.json` and a snapshot is kept at
[idl/hwal.json](idl/hwal.json) for client code generation.
