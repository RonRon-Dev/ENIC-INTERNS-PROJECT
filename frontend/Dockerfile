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
RUN npm run docs:build
# Build each versioned snapshot if docs-versions/ exists
RUN if [ -d "docs-versions" ]; then \
      for dir in docs-versions/*/; do \
        if [ -f "${dir}.vitepress/config.ts" ]; then \
          echo "Building versioned docs: $dir" && \
          npx vitepress build "$dir"; \
        fi; \
      done; \
    fi

FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
COPY --from=builder /app/docs/.vitepress/build /usr/share/nginx/html/docs
# Copy each versioned snapshot built output into /docs/v{version}/
RUN mkdir -p /usr/share/nginx/html/docs
COPY --from=builder /app/docs-versions /tmp/docs-versions
RUN if [ -d "/tmp/docs-versions" ]; then \
      for dir in /tmp/docs-versions/*/; do \
        version=$(basename "$dir"); \
        if [ -d "${dir}.vitepress/build" ]; then \
          cp -r "${dir}.vitepress/build" "/usr/share/nginx/html/docs/${version}"; \
          echo "Copied versioned docs: ${version}"; \
        fi; \
      done; \
    fi
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
