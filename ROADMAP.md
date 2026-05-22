# Roadmap

This document tracks shipped milestones for Hwal. For in-progress work,
see open issues and pull requests on GitHub.

## Positioning

Hwal is the trigger execution primitive purpose-built for the Solana
infrastructure that shipped in the last six months. Pyth Lazer brings a
1 ms signed price channel that can be verified on-chain. MagicBlock
ephemeral rollups bring 50 ms slot cadence with atomic L1 commit. Hwal
is the program that sits between them and turns the pair into an
end-to-end stop-loss path that fires inside the same rollup block as the
price update.

V0 ships the core program on plain L1 with a polled keeper. V1 and V2
swap the off-chain pieces for the new infrastructure without touching
the trigger evaluation, the settlement path, or the keeper market.

## Shipped (V0)

- [x] Anchor program with eight instructions: initialize_config, update_config,
      initialize_price_feed, update_price_feed, open_position, update_triggers,
      tick_position, cancel_position
- [x] `Config` PDA with fee bps, keeper reward bps, fee receiver, lifetime
      counters
- [x] `PriceFeed` PDA with authority-driven push updates
- [x] `Position` PDA per (owner, nonce) with native SOL collateral
- [x] Trigger evaluation order: stop-loss, take-profit, trailing-stop
- [x] Trailing extreme advances per tick, before trigger evaluation
- [x] Atomic settlement: keeper reward + fee + owner refund in one tx on fire
- [x] Permissionless `tick_position` callable by any signer
- [x] Owner-only `update_triggers` and `cancel_position`
- [x] Anchor 0.31.1 with `InitSpace` derives
- [x] TypeScript keeper bot with configurable poll interval
- [x] Devnet deploy runbook (`DEPLOY.md`)
- [x] Smoke test script that exercises open, tick, fire, settle
- [x] CI workflow with format, build, and secret scan jobs
- [x] Multi-stage Dockerfile for the keeper bot
- [x] Devcontainer config for reproducible setup
- [x] Architecture, threat-model, and instruction reference docs

## Planned (V1) — Pyth Lazer integration

- [ ] `update_price_feed_from_lazer` instruction that consumes a signed
      Lazer message and writes the verified price into the existing
      `PriceFeed` cache. `tick_position` remains untouched and keeps
      reading from `feed.price`.
- [ ] Ed25519 signature verification path via the on-chain
      `Ed25519SigVerify` precompile, with a Hwal-side check that the
      message timestamp is recent and that the feed id matches the
      `PriceFeed` PDA.
- [ ] Channel selection per `PriceFeed` (1 ms / 50 ms / 200 ms) recorded
      in account state so the staleness threshold can be tightened per
      feed.
- [ ] Fallback path: `update_price_feed` from the dev authority remains
      available so a Lazer outage degrades gracefully to authority-pushed
      Pyth Core values rather than freezing every position.
- [ ] Documentation pass on the Lazer verify flow and channel selection,
      including end-to-end latency budgets per channel.

## Planned (V2) — MagicBlock ER delegation

- [ ] `delegate_position` instruction that delegates the `Position` PDA
      into a MagicBlock ephemeral rollup via the
      `ephemeral-rollups-sdk` CPI.
- [ ] `commit_position` instruction that triggers an atomic state
      commit from the ER back to L1, used both on demand and as the
      settlement leg when a trigger fires inside the ER.
- [ ] `undelegate_position` for owner-initiated exit from the ER while
      the position is still open.
- [ ] ER-aware keeper bot that subscribes to the rollup's slot stream
      and submits `tick_position` at ER cadence. The L1 keeper continues
      to run for undelegated positions as the fallback path.
- [ ] Settlement path inside the ER: trigger evaluation marks the
      position as `Triggered` and writes payouts into the same
      transaction; the L1 commit pays keeper, fee receiver, and owner
      atomically.
- [ ] Documentation pass on the ER delegation lifecycle, the failure
      modes during commit, and the recovery procedure if the rollup
      stalls.
