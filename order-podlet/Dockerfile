FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY index.mjs ./
COPY assets/ ./assets/

EXPOSE 7103

CMD ["node", "index.mjs"]
