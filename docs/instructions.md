# Instructions reference

Per-instruction reference for the Hwal Anchor program. For account
layout and lifecycle, see [architecture.md](architecture.md).

## initialize_config

Bootstrap the program with admin and fee policy. Admin-only.

| account | role |
| --- | --- |
| `config` | new PDA, seeds `["config"]`, init by admin |
| `admin` | signer, becomes `config.admin` and `config.fee_receiver` initially |
| `system_program` | required by `init` |

| arg | type | constraint |
| --- | --- | --- |
| `fee_bps` | `u16` | `<= MAX_FEE_BPS` (500) |
| `keeper_reward_bps` | `u16` | `<= MAX_KEEPER_REWARD_BPS` (200) |

Emits: `ConfigInitialized`.

## update_config

Rotate any subset of admin, fee receiver, fee bps, keeper reward.

| account | role |
| --- | --- |
| `config` | mut |
| `admin` | signer, must match `config.admin` |

| arg | type | constraint |
| --- | --- | --- |
| `new_admin` | `Option<Pubkey>` | none = unchanged |
| `new_fee_receiver` | `Option<Pubkey>` | none = unchanged |
| `new_fee_bps` | `Option<u16>` | if set, `<= MAX_FEE_BPS` |
| `new_keeper_reward_bps` | `Option<u16>` | if set, `<= MAX_KEEPER_REWARD_BPS` |

Emits: `ConfigUpdated`.

## initialize_price_feed

Create a feed for a symbol with an authority that can later push prices.

| account | role |
| --- | --- |
| `feed` | new PDA, seeds `["feed", symbol]`, init by admin |
| `admin` | signer, must match `config.admin` |
| `system_program` | required by `init` |

| arg | type | constraint |
| --- | --- | --- |
| `symbol` | `[u8; 16]` | UTF-8 bytes, zero-padded |
| `decimals` | `u8` | implementation defined; tests use 6 |
| `initial_price` | `u64` | scaled by `10^decimals` |

Emits: `PriceFeedInitialized`.

## update_price_feed

Push a new price. Feed authority only. V1 will swap this for Pyth.

| account | role |
| --- | --- |
| `feed` | mut |
| `authority` | signer, must match `feed.authority` |

| arg | type | constraint |
| --- | --- | --- |
| `new_price` | `u64` | non-zero |

Emits: `PriceFeedUpdated`.

## open_position

Deposit collateral and create a position with three triggers.

| account | role |
| --- | --- |
| `position` | new PDA, seeds `["position", owner, nonce_le]`, init by owner |
| `vault` | system-owned PDA, seeds `["vault", position]`, init by owner |
| `feed` | read-only, copied into `position.feed` |
| `owner` | signer, pays collateral and rent |
| `system_program` | required by `init` |

| arg | type | constraint |
| --- | --- | --- |
| `nonce` | `u64` | per-owner unique identifier |
| `side` | `u8` | 0 = long, 1 = short |
| `collateral` | `u64` | `>= MIN_COLLATERAL_LAMPORTS` (1_000_000) |
| `stop_price` | `u64` | long: `< entry`, short: `> entry`; 0 = disabled |
| `take_profit_price` | `u64` | long: `> entry`, short: `< entry`; 0 = disabled |
| `trailing_offset` | `u64` | distance in price units; 0 = disabled |

Side effects:

- `position.entry_price = feed.price` at the time of the call.
- `position.trailing_extreme = entry_price`.
- Vault receives `collateral` lamports via SystemProgram::transfer from owner.

Emits: `PositionOpened`.

## update_triggers

Replace any of the trigger fields on an open position.

| account | role |
| --- | --- |
| `position` | mut |
| `owner` | signer, must match `position.owner` |

| arg | type | constraint |
| --- | --- | --- |
| `stop_price` | `u64` | same rules as `open_position`; pass 0 to disable |
| `take_profit_price` | `u64` | same |
| `trailing_offset` | `u64` | same |

Emits: `TriggersUpdated`.

## tick_position

Permissionless. Read feed, advance trailing extreme, evaluate triggers,
settle if any fires.

| account | role |
| --- | --- |
| `position` | mut |
| `vault` | mut |
| `feed` | read-only |
| `config` | read-only |
| `fee_receiver` | mut, must match `config.fee_receiver` |
| `keeper` | mut, the caller |
| `owner` | mut, must match `position.owner` |
| `system_program` | required for CPI transfers |

| arg | type |
| --- | --- |
| (none) |  |

Side effects:

- Updates `trailing_extreme` per side.
- On trigger fire: sets `status = Triggered`, sets `trigger_reason`,
  CPIs three transfers (keeper, fee receiver, owner) from the vault.
- On no trigger: increments `tick_count`, updates `last_tick_at`.

Emits: `PositionTicked`, optionally `PositionTriggered`.

## cancel_position

Owner-only manual close with full collateral refund.

| account | role |
| --- | --- |
| `position` | mut, must be `Open` |
| `vault` | mut |
| `owner` | signer + mut, receives refund |
| `system_program` | required for CPI transfer |

Side effects:

- Vault drained back to owner.
- `position.status = Cancelled`.

Emits: `PositionCancelled`.
