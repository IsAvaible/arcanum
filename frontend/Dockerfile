# Stage 1: Build Stage
FROM node:20-alpine AS build-stage

# Install jq for JSON manipulation
RUN apk add --no-cache jq

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Entferne das "prepare"-Skript, ohne die JSON-Struktur zu beschädigen
RUN cat package.json | jq 'del(.scripts.prepare)' > temp.json && mv temp.json package.json

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve Stage
FROM nginx:stable-alpine AS production-stage

# Copy built application from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
