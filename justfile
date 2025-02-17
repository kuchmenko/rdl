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

