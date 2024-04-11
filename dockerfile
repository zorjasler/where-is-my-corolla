FROM --platform=linux/amd64 node:iron-slim
USER node:node
WORKDIR /where-is-my-corolla
COPY ./src/ /where-is-my-corolla/src/
COPY package.json tsconfig.json /where-is-my-corolla/
# This args will be overridden on build time
ARG WHERE_IS_MY_COROLLA_USERNAME=<your-toyota-username>
ARG WHERE_IS_MY_COROLLA_PASSWORD=<your-toyota-password>
ARG WHERE_IS_MY_COROLLA_APITOKEN=<your-telegram-bot-apitoken>
# Set env variables from build args
ENV WHERE_IS_MY_COROLLA_USERNAME=$WHERE_IS_MY_COROLLA_USERNAME
ENV WHERE_IS_MY_COROLLA_PASSWORD=$WHERE_IS_MY_COROLLA_PASSWORD
ENV WHERE_IS_MY_COROLLA_APITOKEN=$WHERE_IS_MY_COROLLA_APITOKEN
RUN yarn
RUN yarn build
CMD node build/index.js