# Base image
FROM node:20-alpine

# Install OpenSSL (Required for Prisma engine on Alpine)
RUN apk add --no-cache openssl

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all project files FIRST (so prisma.config.ts is included)
COPY . .

# Generate prisma client NOW
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD [ "npm", "run", "start" ]