# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-22

### Added

- Initial Anchor program with seven instructions: `initialize_config`,
  `update_config`, `initialize_price_feed`, `update_price_feed`,
  `open_position`, `update_triggers`, `tick_position`, `cancel_position`.
- `Config` account with admin, fee receiver, fee bps, keeper reward bps, and
  lifetime counters.
- `PriceFeed` account with authority-driven price updates and decimals.
- `Position` account with native SOL collateral, three trigger fields,
  trailing extreme, and a per-owner nonce-derived PDA.
- Trigger evaluation order: stop-loss, take-profit, trailing-stop. First hit
  wins; trailing extreme advances each tick.
- Settlement path: keeper reward + protocol fee paid out atomically with the
  net collateral refund to the position owner.
- TypeScript keeper bot (`scripts/keeper-bot.ts`) that polls every N ms and
  submits `tick_position` for every open position.
- Devnet deploy runbook (`DEPLOY.md`).
- Smoke test (`scripts/smoke-test.ts`) that exercises the full lifecycle
  against a configured RPC endpoint.

### Notes

- V0 ships with an authority-driven mock price feed. V1 will swap this for a
  Pyth pull receiver verify path while keeping the authority for emergency
  override.
- V2 will move `tick_position` execution into a MagicBlock ephemeral rollup
  for the 50 ms cadence path.

[0.1.0]: https://github.com/Hwaldev/hwal/releases/tag/v0.1.0
