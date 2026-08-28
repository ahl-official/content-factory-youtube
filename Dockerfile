FROM node:18-alpine

WORKDIR /app

# Only copy package.json first to cache dependencies layers
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend files (excluding the frontend via dockerignore)
COPY . .

# Expose the API port
EXPOSE 3000

# Start the Node server
CMD ["node", "server.js"]
