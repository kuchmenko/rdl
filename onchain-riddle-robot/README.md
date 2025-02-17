# Onchain Riddle Robot

This project is the backend robot service for the Onchain Riddle system. Written in Rust, the robot listens for on-chain Winner events. When a riddle is solved, it uses the OpenAI API to generate a new riddle (with a one-word answer) and sends a transaction to update the contract—ensuring that a new riddle is set every time the service starts and whenever a riddle is solved.

## Features

- Event Listening: Subscribes to Winner events from the smart contract.
- Riddle Generation: Calls the OpenAI API to generate a new riddle.
- On-Chain Update: Sends a transaction to update the contract with the new riddle.
- Auto Initialization: Always sets a new riddle on startup so that the contract never remains without a valid answer.

## Prerequisites

- Rust (v1.66 or later) and Cargo
- (Optional) Docker

## Running Locally

### Using Cargo

1. Set up Environment Variables:  
   Create a .env file in the project root (or set the following environment variables):

   RPC_URL=https://your_rpc_url
   PRIVATE_KEY=0xYourPrivateKey
   OPENAI_API_KEY=your_openai_api_key
   CONTRACT_ADDRESS=0xYourContractAddress
   CHAIN_ID=84531

2. Build and run the project:
   cargo run --release

### Using Docker

1. Build the Docker image:  
   From the repository root (if using a workspace-aware build), run:
   docker build -t yourusername/onchain-riddle-robot:latest -f onchain-riddle-robot/Dockerfile .

2. Run the container:
   docker run yourusername/onchain-riddle-robot:latest

## Deployment

This image can be pushed to a container registry and deployed together with the web service using Docker Compose or Portainer. See the overall deployment README (or your docker-compose.yml file) for instructions on running both services.
