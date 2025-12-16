FROM node:22.5

WORKDIR /app

COPY . .

RUN npm install -g pnpm

RUN pnpm install

RUN pnpm run build

# Default to port 3000; Railway/host can override PORT at runtime.
ENV PORT=3000
EXPOSE ${PORT}

CMD [ "pnpm", "run", "start:prod" ] 
