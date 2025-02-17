# Justfile for onchain-riddle monorepo
# Usage:
#   just build      # Build Rust apps and Foundry contracts
#   just test       # Run tests for Rust apps and Foundry contracts
#   just projects   # Run both Rust applications concurrently

build:
	@echo "Building Rust apps..."
	cargo build --workspace
	@echo "Building Foundry contracts..."
	cd onchain-riddle-contracts && forge build

test:
	@echo "Testing Rust apps..."
	cargo test --workspace
	@echo "Testing Foundry contracts..."
	cd onchain-riddle-contracts && forge test

run-robot:
@echo "Running onchain-riddle-robot..."
cargo run -p onchain-riddle-robot



run-web:
	@echo "Running onchain-riddle-web..."
  cargo run -p onchain-riddle-web

