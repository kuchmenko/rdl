# Dockerfile for Rust Robot Service (Workspace-Aware)

# Stage 1: Build the robot binary
FROM rust:1.82-slim AS builder
WORKDIR /app

# Install required packages for OpenSSL and pkg-config
RUN apt-get update && apt-get install -y pkg-config libssl-dev

# Copy the workspace root Cargo.toml and Cargo.lock, and workspace config if available
COPY Cargo.toml Cargo.lock ./

# Copy the robot member directory (adjust the path if necessary)
COPY onchain-riddle-robot ./onchain-riddle-robot

# Build only the robot package (the member) using the workspace context
RUN cargo build --release -p onchain-riddle-robot

# Stage 2: Minimal runtime image
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# Copy the built binary from the builder stage
COPY --from=builder /app/target/release/onchain-riddle-robot /usr/local/bin/onchain-riddle-robot

# Run the robot service
CMD ["onchain-riddle-robot"]
