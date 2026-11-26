FROM node:24-alpine

WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

RUN chown -R nodejs:nodejs /app

USER nodejs

COPY --chown=nodejs:nodejs package*.json .

RUN npm ci --omit=dev

COPY --chown=nodejs:nodejs . .

EXPOSE 3000

CMD [ "npm", "start" ]
