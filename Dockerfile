FROM node:20-alpine
WORKDIR /app
COPY api/package*.json /app/api/
RUN npm --prefix /app/api install --omit=dev
COPY . /app
EXPOSE 3001
CMD ["npm", "--prefix", "/app/api", "start"]
