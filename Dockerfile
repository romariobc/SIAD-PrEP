FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate --schema=src/database/prisma/schema.prisma

EXPOSE 3000

CMD ["npm", "run", "dev"]
