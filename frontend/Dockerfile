FROM node:20 AS build-environment

RUN apt-get update && apt-get install jq -y

WORKDIR /app

COPY package*.json ./

RUN cat package.json | jq 'del(.scripts.prepare)' > temp.json && mv temp.json package.json

RUN apt-get install -y nginx && apt-get clean

RUN npm install -g npm