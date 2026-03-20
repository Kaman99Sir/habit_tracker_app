FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Start the application using cross-env and tsx
# Ensure we specify that we're running in production
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run the unified start script defined in package.json
CMD ["npm", "start"]
