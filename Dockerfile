# Stage 1: Build the site
FROM node:20 AS builder

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

# Stage 2: Serve with nginx (or http-server)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
