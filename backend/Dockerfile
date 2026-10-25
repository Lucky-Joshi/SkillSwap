FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma7.config.ts ./
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build" \
    DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build" \
    npx prisma generate

COPY --chown=node:node . .
RUN mkdir -p /app/uploads /tmp/skillswap-resumes && chown -R node:node /app/uploads /tmp/skillswap-resumes

EXPOSE 5000
USER node
CMD ["node", "server.js"]
