FROM node:20-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY tsconfig.json ./
COPY uploads ./uploads
RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=10000
ENV DATABASE_URL=file:/app/data/dev.db
ENV UPLOADS_DIR=/app/data/uploads
ENV JWT_EXPIRES_IN=7d
ENV CORS_ORIGIN=*
ENV OTP_TTL_SECONDS=300
ENV EXPOSE_DEBUG_OTP=false
ENV BOOTSTRAP_DEMO_DATA=false

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/uploads ./uploads
COPY docker-start.sh ./docker-start.sh

RUN mkdir -p /app/data /app/uploads

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "const http=require('http');const req=http.get('http://127.0.0.1:4000/api/v1/health',res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));"

CMD ["sh", "./docker-start.sh"]
