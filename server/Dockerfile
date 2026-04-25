# Development — node_modules mounted from host root via docker-compose
FROM node:20-alpine AS dev
WORKDIR /app
COPY server/package.json ./
COPY server/src ./src
COPY server/db ./db
EXPOSE 3001
CMD ["node_modules/.bin/nodemon", "src/index.js"]

# Production — full install inside image
FROM node:20-alpine AS prod
WORKDIR /app
COPY server/package.json ./
RUN npm install --omit=dev --fetch-retry-mintimeout 20000 --fetch-retries 5
COPY server/src ./src
COPY server/db ./db
EXPOSE 3001
CMD ["node", "src/index.js"]
