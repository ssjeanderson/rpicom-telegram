FROM node:16-alpine

LABEL version="0.1.0"
LABEL description="A Telegram based voice comunicator for Raspberry Pi"

COPY package.json package-lock.json /app/
COPY src /app/src
COPY media /app/media

WORKDIR /app/

RUN apk add alsa-utils opus-tools g++ python3 make --no-cache && \
    npm install --only=prod

CMD npm start
