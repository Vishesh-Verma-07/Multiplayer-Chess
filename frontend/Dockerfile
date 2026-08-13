FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_HTTPS_BACKEND_URL=http://localhost:8000
ENV VITE_HTTPS_BACKEND_URL=$VITE_HTTPS_BACKEND_URL
ARG VITE_WEBSOCKET_BACKEND_URL=ws://localhost:8080/api/ws
ENV VITE_WEBSOCKET_BACKEND_URL=$VITE_WEBSOCKET_BACKEND_URL
ARG VITE_ENVI=production
ENV VITE_ENVI=$VITE_ENVI

RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]