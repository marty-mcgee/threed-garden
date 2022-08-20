FROM node:lts-alpine

WORKDIR /app

ADD . .

RUN pnpm && pnpm build
EXPOSE 8888
CMD ["pnpm", "preview"]