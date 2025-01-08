FROM node:20

WORKDIR /node_backend

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx sequelize-cli db:migrate --config ./configs/config.js && npm run start-backend"]
