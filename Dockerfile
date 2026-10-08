FROM node:24-alpine AS build
WORKDIR /app/client
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production PORT=5000
RUN apk upgrade --no-cache && apk add --no-cache curl
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY server/ ./
COPY --from=build /app/client/dist /app/client/dist
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app
ENV DATA_FILE=/app/data/db.json UPLOADS_DIR=/app/uploads
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 CMD curl --fail --silent --show-error --max-time 5 http://127.0.0.1:5000/api/health || exit 1
CMD ["sh","-c","node scripts/database.js migrate && exec node index.js"]
