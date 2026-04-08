# Threat Model

This document enumerates the attackers the Hwal program defends against
and the residual risks the protocol does not address.

## In scope

### Front-running keeper

A keeper that watches the mempool and races to land a `tick_position` ahead
of another keeper to capture the reward.

**Mitigation**: this is not adversarial behavior. Permissionless
competition for the keeper reward is the design. The system intentionally
allows it; it is the reason the trigger latency converges to the underlying
block / rollup cadence.

### Malicious feed authority

A compromised price feed authority pushes a false price to trigger
unintended settlements.

**Mitigation**: V0 ships with an authority-driven mock feed for development
only. V1 swaps the feed for a Pyth Lazer verify path that does not
trust the authority for the price value, only for emergency override.
Integrators on mainnet should not deploy V0 with real value at stake.

### Re-entrancy on settlement

A position's vault is a system-owned PDA. The program does a CPI to
SystemProgram::transfer to drain the vault on settlement.

**Mitigation**: the position status is written to `Triggered` before the
CPI sequence and the position account is mutable in the same instruction.
A re-entrant call would observe `PositionNotOpen` and abort. The vault PDA
has no executable code, so an attacker cannot inject a malicious program
into the CPI path.

### Stale feed exploitation

An attacker waits for the feed authority to fall behind, then ticks every
open position at the now-stale price to capture rewards on positions that
would not fire at the true price.

**Mitigation**: every tick checks `now - feed.updated_at <
MAX_FEED_STALENESS_SECS` (120s). Stale ticks abort. The 120-second window
is conservative for the V0 mock feed; V1 with Pyth reduces it implicitly
because Pyth pulls land with their own timestamp.

### Trigger spoofing

An attacker tries to fire a trigger on a position they do not own without
the on-chain price actually meeting the condition.

**Mitigation**: the trigger evaluation reads `feed.price` directly inside
the program. The caller passes only account references, not the price
value. A spoofed feed account fails the `feed` pubkey assertion against
`position.feed`.

### Math overflow

Collateral and price multiplications could overflow `u64` for large values.

**Mitigation**: all bps multiplications use `checked_mul` and `checked_div`.
Trailing extreme arithmetic uses `checked_add` / `checked_sub` and aborts
with `MathOverflow` or `TrailingUnderflow` on failure. Tests cover the
boundary cases.

### Admin compromise

A compromised admin key could redirect protocol fees to an attacker
address or set keeper reward to zero (DoS).

**Mitigation**: the program enforces `fee_bps <= MAX_FEE_BPS` (500) and
`keeper_reward_bps <= MAX_KEEPER_REWARD_BPS` (200) at every
`update_config`, so the worst case is fees redirected but not exfiltrated
beyond bounds. Admin key custody is the operator's responsibility; we
recommend a hardware-wallet multisig for mainnet.

## Out of scope

### Off-chain wallet compromise

If a position owner's wallet is stolen, the attacker can call
`cancel_position` and drain the vault. The program has no way to detect
this. Standard wallet hygiene applies.

### RPC censorship

A censoring RPC can refuse to forward `tick_position` transactions or
selectively delay them. Multiple independent RPCs and a transaction
broadcaster mitigate this off-chain.

### Validator-side reordering

A leader validator can reorder transactions within their slot to favor
one keeper over another. The trigger evaluation itself is not affected
because it reads on-chain state at slot finality.

### Cross-program reentrancy via system program

The settlement CPI uses `solana_program::system_instruction::transfer`,
which is an opaque syscall in BPF. There is no way for a malicious program
to interpose between the position state write and the lamport movement.

## Audit trail

| version | scope | result |
| --- | --- | --- |
| 0.1.0 | initial deployment | informal self-review, no findings |

The project has not received a paid third-party audit. Mainnet deployment
with real value at stake should wait for one.
