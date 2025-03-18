# Use the official Python 3.8 image as a base
FROM python:3.8-slim

# Set the working directory in the container
WORKDIR /app

# Install Node.js, npm, Ansible dependencies, and build tools in a single layer
RUN apt-get update && \
    apt-get install -y curl gnupg sshpass make gcc g++ python3-dev && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    pip3 install --upgrade pip && \
    pip3 install ansible && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of your application code
COPY . ./

# Build the NextJs app
RUN npm run build

# Set up for production
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy NextJS standalone build artifacts
COPY /.next/standalone ./
COPY /.next/static ./.next/static

# Expose the port your app runs on
EXPOSE 3000

# Command to run your application
CMD ["node", "server.js"]