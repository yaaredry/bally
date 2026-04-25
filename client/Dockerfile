# Development — node_modules mounted from host root via docker-compose
FROM node:20-alpine AS dev
WORKDIR /app
COPY client/package.json ./
COPY client/src ./src
COPY client/public ./public
COPY client/index.html ./
COPY client/vite.config.js ./
COPY client/tailwind.config.js ./
COPY client/postcss.config.js ./
EXPOSE 5173
CMD ["node_modules/.bin/vite", "--host", "0.0.0.0"]

# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package.json ./
RUN npm install --fetch-retry-mintimeout 20000 --fetch-retries 5
COPY client/src ./src
COPY client/public ./public
COPY client/index.html ./
COPY client/vite.config.js ./
COPY client/tailwind.config.js ./
COPY client/postcss.config.js ./
RUN npm run build

# Production — nginx serves static build + proxies API
FROM nginx:alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
