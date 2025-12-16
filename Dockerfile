FROM node:22.5

WORKDIR /app

COPY . .

RUN npm install -g pnpm

RUN pnpm install

RUN pnpm run build

ARG APP_PORT=3000
EXPOSE $APP_PORT

CMD [ "pnpm", "run", "start:prod" ] 