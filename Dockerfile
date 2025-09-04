FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# IGNORE TypeScript build - use tsx to run directly from source
EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]