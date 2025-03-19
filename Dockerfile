# Single-stage build with Python as base
FROM python:3.8-slim AS base

WORKDIR /app

# Install system dependencies including Node.js
RUN apt-get update && \
    apt-get install -y curl gnupg gcc make g++ sshpass && \
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
COPY . .

# Build the NextJs app
RUN npm run build

# Make sure next.config.js includes output: 'standalone'
# (This is just a comment, not a command)


FROM base AS runner
# Set up for production
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Expose the port your app runs on
EXPOSE 3000

COPY --from=base /app/public ./public

COPY --from=base /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static

# Command to run your application
CMD ["node", "server.js"]