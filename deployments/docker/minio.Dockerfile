# MinIO community binaries are no longer distributed as official images.
FROM golang:1.26.0-alpine AS build
ARG GOPROXY=https://proxy.golang.org,direct
ARG MINIO_VERSION=v0.0.0-20260212201848-7aac2a2c5b7c
RUN CGO_ENABLED=0 go install github.com/minio/minio@${MINIO_VERSION}

FROM alpine:3.23
COPY --from=build /go/bin/minio /usr/local/bin/minio
EXPOSE 9000 9001
ENTRYPOINT ["/usr/local/bin/minio"]
