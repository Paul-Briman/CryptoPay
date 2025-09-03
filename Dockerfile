FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Debug: List files and check TypeScript compilation
RUN echo "=== Listing files ===" && \
    ls -la && \
    echo "=== Listing server files ===" && \
    ls -la server/ && \
    echo "=== Attempting TypeScript build ===" && \
    cd server && \
    npx tsc --outDir ../dist-server --listFiles && \
    echo "=== Checking dist-server ===" && \
    ls -la ../dist-server/

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist/client ./dist/client
EXPOSE 3000
CMD ["node", "dist-server/index.js"]