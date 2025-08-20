# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy the rest of the project
COPY . .

# Expose port
EXPOSE 3000

# Start the server (serves both signaling + static frontend)
CMD ["node", "server/server.js"]
