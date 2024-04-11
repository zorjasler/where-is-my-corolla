FROM --platform=linux/amd64 node:iron-slim
USER node:node
WORKDIR /where-is-my-corolla
COPY ./src/ /where-is-my-corolla/src/
COPY package.json tsconfig.json /where-is-my-corolla/
# Uncomment this for manual configuration
# ENV WHERE_IS_MY_COROLLA_USERNAME=<your-toyota-username>
# ENV WHERE_IS_MY_COROLLA_PASSWORD=<your-toyota-password>
# ENV WHERE_IS_MY_COROLLA_TELEGRAM_APITOKEN=<your-telegram-bot-apitoken>
RUN yarn
RUN yarn build
CMD node build/index.js