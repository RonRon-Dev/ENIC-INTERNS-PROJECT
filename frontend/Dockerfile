FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS development
COPY . .
EXPOSE 5173
# CMD ["npm", "run", "dev"]
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS builder
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
