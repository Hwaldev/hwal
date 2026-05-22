.PHONY: help build check clean test lint format keeper smoke deploy idl

help:
	@echo "Hwal make targets:"
	@echo "  build         anchor build the program"
	@echo "  check         cargo check the workspace"
	@echo "  test          run integration test suite"
	@echo "  lint          rustfmt --check + prettier --check"
	@echo "  format        rustfmt + prettier write"
	@echo "  clean         remove target/ and node_modules"
	@echo "  keeper        run the keeper bot against devnet"
	@echo "  smoke         run the devnet smoke test"
	@echo "  deploy        anchor deploy to devnet"
	@echo "  idl           refresh the IDL JSON snapshot under programs/hwal/idl"

build:
	anchor build

check:
	cargo check --workspace

test:
	anchor test --skip-local-validator

lint:
	cargo fmt --all -- --check
	yarn lint

format:
	cargo fmt --all
	yarn lint:fix

clean:
	cargo clean
	rm -rf node_modules

keeper:
	yarn ts-node scripts/keeper-bot.ts 500

smoke:
	yarn ts-node scripts/smoke-test.ts

deploy:
	anchor deploy --provider.cluster devnet

idl:
	anchor build
	mkdir -p programs/hwal/idl
	cp target/idl/hwal.json programs/hwal/idl/hwal.json
