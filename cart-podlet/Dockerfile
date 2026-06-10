FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY index.mjs ./
COPY assets/ ./assets/

EXPOSE 7102

CMD ["node", "index.mjs"]
