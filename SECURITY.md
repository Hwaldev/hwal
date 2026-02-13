# Security Policy

## Supported versions

| version | supported |
| --- | --- |
| 0.1.x | yes |
| < 0.1 | no |

Hwal is pre-1.0. The on-chain program may receive breaking upgrades in the
0.1.x line. Each release notes the upgrade path under `CHANGELOG.md`.

## Reporting a vulnerability

If you find a vulnerability that affects user funds, on-chain state integrity,
or settlement correctness, please report it privately. Do not file a public
issue.

Send a report to the maintainer listed in the GitHub repository profile, or
open a private security advisory via
`https://github.com/Hwaldev/hwal/security/advisories/new`.

Include:

- The relevant program version or commit hash
- Reproduction steps, including transaction signatures from devnet if possible
- The smallest test case that demonstrates the issue
- Your proposed fix, if you have one

We aim to acknowledge reports within 72 hours and to publish a fix or
mitigation within 14 days for high-severity issues.

## Out of scope

- Issues in third-party dependencies that are tracked upstream
- Theoretical attacks against keccak256, ed25519, or the Solana consensus layer
- Off-chain client misconfigurations (RPC endpoint trust, leaked wallet keys)

## Public disclosure

Once a fix is shipped on mainnet (or on devnet for unreleased issues) we will
credit reporters in the corresponding `CHANGELOG.md` entry, unless the
reporter prefers to remain anonymous.
