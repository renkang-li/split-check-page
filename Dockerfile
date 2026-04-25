FROM node:24-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM golang:1.23-alpine AS backend-build

WORKDIR /app/backend

COPY backend/go.mod ./
COPY backend/cmd ./cmd
COPY backend/internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -o /split-check ./cmd/server

FROM alpine:3.22

WORKDIR /app

COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY --from=backend-build /split-check ./split-check

ENV PORT=8155
ENV FRONTEND_DIST=frontend/dist

EXPOSE 8155

CMD ["./split-check"]
