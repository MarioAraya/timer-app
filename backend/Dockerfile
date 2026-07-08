FROM golang:1.21-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /timer-app-backend ./cmd/api

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=build /timer-app-backend /timer-app-backend
EXPOSE 8080
ENTRYPOINT ["/timer-app-backend"]
