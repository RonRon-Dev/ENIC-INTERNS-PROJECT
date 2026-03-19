FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS development
COPY . .
EXPOSE 5173 5174
# CMD ["npm", "run", "dev"]
CMD ["sh", "-c", "npm run dev & npm run docs:dev & wait"]

FROM base AS builder
COPY . .
ARG VITE_APP_VERSION=dev
ENV VITE_APP_VERSION=$VITE_APP_VERSION
RUN npm run build

FROM base AS docs-builder
COPY . .
RUN npm run docs:build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=docs-builder /app/docs/.vitepress/dist /usr/share/nginx/html/docs
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf