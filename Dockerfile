FROM node:20-alpine

WORKDIR /app

COPY app.js index.html server.js styles.css ./

ENV NODE_ENV=production
ENV PORT=8155

EXPOSE 8155

CMD ["node", "server.js"]
