# Backend Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install backend dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the API port
EXPOSE 5000

# Define environment variables (Can be overridden by Docker Compose/Docker run)
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["npm", "start"]