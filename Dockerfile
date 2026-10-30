FROM node:22-alpine
WORKDIR /app
COPY server/ server/
COPY src/stand.js src/stand.js
COPY site/ site/
RUN mkdir -p /data && chown node:node /data
ENV DATEN=/data PORT=80 NODE_ENV=production
USER node
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/api/status || exit 1
CMD ["node", "server/server.js"]
