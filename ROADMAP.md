# Roadmap

This document tracks shipped milestones for Hwal. For in-progress work,
see open issues and pull requests on GitHub.

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
