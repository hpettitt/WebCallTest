# Use Node.js 22 LTS
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package.json server/package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy server application code
COPY server/ ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
