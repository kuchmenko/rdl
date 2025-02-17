
# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app
# Copy dependency definitions and install dependencies with Yarn
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
# Copy the entire source code and build the app
COPY . .
RUN cp .env.example .env
RUN yarn build

# Stage 2: Production Runner
FROM node:18-alpine AS runner
WORKDIR /app
# Copy node_modules so that next (and other binaries) are available
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["yarn", "start"]
