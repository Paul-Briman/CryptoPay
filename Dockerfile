FROM node:18-alpine
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build server
RUN cd server && npx tsc --outDir ../dist-server

# Build client  
RUN cd client && npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist-server/index.js"]