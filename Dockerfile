ARG NODE_VERSION=24.17.0
FROM node:${NODE_VERSION}-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
