FROM node

WORKDIR /var/www/html/mongoApi

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

EXPOSE 7000

CMD ["node", "app/index.js"]