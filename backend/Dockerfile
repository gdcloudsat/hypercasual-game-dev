# ---------- BUILD STAGE ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY src ./src

RUN npm run build


# ---------- RUN STAGE ----------
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist

EXPOSE 3000 3001

CMD ["node", "dist/main.js"]
