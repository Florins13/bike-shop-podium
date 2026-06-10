FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY server.mjs ./
COPY assets/ ./assets/

EXPOSE 8000

CMD ["node", "server.mjs"]
