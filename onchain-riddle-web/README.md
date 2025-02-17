# Onchain Riddle Web

This project is the front-end web application for the Onchain Riddle system. Built with Next.js (using Yarn) and styled with Tailwind CSS, it displays the current riddle from the on-chain contract and allows users to submit answer attempts. When a riddle is solved, the app automatically updates to show the new riddle.

## Features

- Display Current Riddle: Fetches and renders the active riddle from the smart contract.
- Submit Answer: Provides a UI for users to submit their answers via blockchain transactions.
- Auto Refresh: Detects when a riddle is solved and updates the displayed riddle automatically.

## Prerequisites

- Node.js (v18 or later)
- Yarn package manager
- (Optional) Docker

## Running Locally

### Using Yarn

1. Install dependencies:

````bash    
yarn install
````

2. Build the project:

````bash    
yarn build      
````

3. Run the development server:

````bash    
yarn dev
````

   The app will be available at http://localhost:3000

### Using Docker

Run docker-compose at top level of project

## Environment Variables

```bash
cp .env.example .env
```

## Deployment

This image can be pushed to a container registry (e.g., GitHub Container Registry) and deployed using Docker Compose or Portainer.
