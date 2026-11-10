# Stage 1: Build
FROM node:22.23.4-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/v1/api
ARG VITE_SOCKET_URL=
ARG VITE_USER_MANUAL_URL=
ARG VITE_PRIVACY_POLICY_URL=
ENV VITE_API_URL=$VITE_API_URL VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_USER_MANUAL_URL=$VITE_USER_MANUAL_URL VITE_PRIVACY_POLICY_URL=$VITE_PRIVACY_POLICY_URL
RUN npm run build

# Stage 2: Serve via nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# 127.0.0.1, bukan localhost: wget di Alpine mencoba ::1 dulu, sedangkan nginx.conf hanya IPv4.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80 || exit 1
