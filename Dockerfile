FROM node:20-alpine AS builder
WORKDIR /app

ARG SERVER_NAME=localhost
ENV VITE_SERVER_NAME=$SERVER_NAME

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
