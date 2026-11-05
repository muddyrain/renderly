FROM golang:1.23-alpine AS build
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
ARG APP_TARGET=api
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/renderly ./cmd/${APP_TARGET}

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/renderly /renderly
EXPOSE 8080
ENTRYPOINT ["/renderly"]
