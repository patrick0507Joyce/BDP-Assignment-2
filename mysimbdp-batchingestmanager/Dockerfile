FROM node:15.10.0-alpine3.10 as debug
WORKDIR /usr/src/mysimbdp-batchingestmanager/                  
COPY package*.json ./

CMD npm config set cache-min 9999999 && \
    npm install && \
    npm run start:dev

FROM node:15.10.0-alpine3.10 as prod

WORKDIR /usr/src/mysimbdp-batchingestmanager/                  
COPY package*.json ./

CMD npm config set cache-min 9999999 && \
    npm install && \
    npm run start