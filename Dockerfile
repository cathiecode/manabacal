FROM node:14-alpine

COPY . /manabacal

WORKDIR /manabacal

RUN yarn install

CMD [ "yarn", "start" ]