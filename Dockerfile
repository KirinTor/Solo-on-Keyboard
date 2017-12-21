FROM node:carbon

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8888
CMD [ "npm", "start" ]
CMD [ "npm", "test"]