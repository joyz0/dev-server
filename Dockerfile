FROM node:14-alpine

WORKDIR /usr/src/reactcases/node

COPY package.json .

RUN npm install --production

RUN npm run build

COPY ./dist .

EXPOSE 7002

CMD [ "npm", "start" ]