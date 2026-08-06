# Build stage
FROM node:22-alpine as build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build the app
COPY . .
# If building for prod, we typically want env variables passed, but for now Vite static build is fine.
RUN npm run build

# Serve stage
FROM nginx:alpine
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
