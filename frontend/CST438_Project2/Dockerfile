# syntax=docker/dockerfile:1

# Stage 1: Build the application
FROM node:22.13.1-slim AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY --link package.json package-lock.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy the rest of the application files
COPY --link . .

# Build the application
RUN npm run build

# Stage 2: Prepare the production image
FROM node:22.13.1-slim AS final

# Set the working directory
WORKDIR /app

# Copy the built application and necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production

# Create a non-root user and switch to it
RUN useradd -m appuser
USER appuser

# Expose the port the application runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]