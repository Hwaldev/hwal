# Contributing to Chalna

Thanks for taking the time to look at the codebase. Pull requests and issues
are both welcome.

## Local setup

```bash
git clone https://github.com/Hwaldev/chalna.git
cd chalna
yarn install --frozen-lockfile
anchor build
```

You will need:

- Rust 1.78+ with the `cargo` toolchain
- Solana CLI 1.18+
- Anchor CLI 0.31.1 (`avm install 0.31.1 && avm use 0.31.1`)
- Node 20 LTS and Yarn 1.x for the test and keeper scripts

## Branching

- `main` is always deployable to devnet. Every commit must build cleanly with
  `anchor build` and pass `yarn lint`.
- Feature work goes on `feat/<slug>` branches and lands via pull request.
- Hotfixes go on `fix/<slug>` branches.

## Commit messages

Use conventional commits. The most common prefixes in this repo:

- `feat:` — new behavior visible from the outside
- `fix:` — bug fix
- `refactor:` — internal change with no behavior delta
- `perf:` — measurable performance improvement
- `docs:` — README, architecture, comments
- `test:` — adding or fixing tests
- `chore:` — build, deps, tooling
- `ci:` — GitHub Actions workflows

When a commit touches a single area, scope it: `feat(program): add tick_position`,
`fix(keeper): handle 429 from rpc`, `docs(deploy): clarify airdrop step`.

## Tests

Local validator tests run with:

```bash
anchor test
```

Devnet smoke test (assumes the program is already deployed and the wallet has
some SOL):

```bash
yarn ts-node scripts/smoke-test.ts
```

Add or update tests in the same PR as the behavior change. Untested behavior
will be rejected by review.

## Pull request checklist

- [ ] `cargo fmt --all` clean
- [ ] `anchor build` succeeds
- [ ] `yarn lint` passes
- [ ] `anchor test --skip-local-validator` passes against a running validator
- [ ] CHANGELOG.md updated with a one-line entry under the appropriate section
- [ ] No new top-level dependencies without justification in the PR description

## Reporting security issues

Do not file public issues for security-sensitive reports. Follow the
disclosure policy in [SECURITY.md](SECURITY.md).
