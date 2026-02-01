# Multi-stage build for humanizer-worker
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy humanizer-worker files (build context is ./services/)
COPY humanizer-worker/go.mod humanizer-worker/go.sum* ./
RUN go mod download
COPY humanizer-worker/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags='-w -s' -o worker ./cmd/worker

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/worker .

# Run
CMD ["./worker"]

