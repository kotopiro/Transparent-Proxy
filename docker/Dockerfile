FROM node:18-alpine

WORKDIR /app
COPY server ./server
COPY web ./web
COPY package*.json ./

RUN cd server && npm install

EXPOSE 8080
CMD ["node", "server/server.js"]
