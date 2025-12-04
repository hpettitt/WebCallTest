# Use Node.js 22 LTS
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of application code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
