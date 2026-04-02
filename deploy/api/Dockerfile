FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY *.mjs ./

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run migrations then start server
CMD ["sh", "-c", "node ./migrate.mjs && node --enable-source-maps ./index.mjs"]
