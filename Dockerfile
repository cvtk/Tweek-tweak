FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 443
CMD ["node", "server.json"]