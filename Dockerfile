FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Debug: Check what files exist and run build with verbose output
RUN ls -la && \
    echo "=== Building server ===" && \
    cd server && \
    npx tsc --outDir ../dist-server --verbose && \
    echo "=== Checking dist-server ===" && \
    ls -la ../dist-server/

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# Copy from absolute path to avoid issues
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist/client ./dist/client
EXPOSE 3000
CMD ["node", "dist-server/index.js"]