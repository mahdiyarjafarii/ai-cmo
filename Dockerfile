FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built application (assumes npm run build was run)
COPY dist ./dist

# Set environment
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Create output directory
RUN mkdir -p /app/output

# Use dumb-init to run the application
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Run the application
CMD ["node", "dist/main.js"]
