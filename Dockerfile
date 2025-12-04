FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
EXPOSE 3000
CMD ["npm", "start"]
