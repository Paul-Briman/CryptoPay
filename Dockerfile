FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Debug with timeout to prevent hanging
RUN echo "=== Listing files ===" && \
    ls -la && \
    echo "=== Listing server files ===" && \
    ls -la server/ && \
    echo "=== Attempting TypeScript build ===" && \
    cd server && \
    timeout 30s npx tsc --outDir ../dist-server --listFiles || echo "Build timed out or failed" && \
    echo "=== Checking if dist-server exists ===" && \
    ls -la ../ || true

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist/client ./dist/client
EXPOSE 3000
CMD ["node", "dist-server/index.js"]