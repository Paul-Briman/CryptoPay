FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build server with specific config
RUN echo "=== Building server ===" && \
    cd server && \
    npx tsc --project tsconfig.json --outDir ../dist-server

# Build client
RUN echo "=== Building client ===" && \
    cd client && \
    npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist/client ./dist/client
EXPOSE 3000
CMD ["node", "dist-server/index.js"]