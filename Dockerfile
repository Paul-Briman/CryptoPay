FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server && npm run build:client

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist/client ./dist/client
EXPOSE 3000
CMD ["node", "dist-server/index.js"]