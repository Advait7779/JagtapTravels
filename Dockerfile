FROM node:26-alpine AS build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:26-alpine AS runtime
ENV NODE_ENV=production PORT=5000
RUN apk update && apk upgrade --no-cache
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY server/ ./
COPY --from=build /app/client/dist /app/client/dist
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app
ENV DATA_FILE=/app/data/db.json UPLOADS_DIR=/app/uploads
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","index.js"]
