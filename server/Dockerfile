# Use Node.js official image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json from current folder
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all server files
COPY . ./

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
