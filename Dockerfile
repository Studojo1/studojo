# Multi-stage build for humanizer-worker
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags='-w -s' -o worker ./cmd/worker

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/worker .

# Run
CMD ["./worker"]

