FROM node:carbon

COPY package*.json ./

COPY . .

EXPOSE 8888
CMD [ "npm", "start" ]