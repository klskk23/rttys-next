FROM --platform=$BUILDPLATFORM node:24-alpine AS ui
WORKDIR /rttys/ui
COPY ui/package.json ui/package-lock.json ./
RUN npm ci
COPY ui .
RUN npm run build

FROM --platform=$BUILDPLATFORM golang:1.27-alpine AS rttys
ARG TARGETOS TARGETARCH
ARG GIT_COMMIT=""
ARG BUILD_TIME=""
WORKDIR /rttys
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=ui /rttys/internal/server/assets/dist internal/server/assets/dist
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags="-s -w -X main.GitCommit=$GIT_COMMIT -X main.BuildTime=$BUILD_TIME" -o rttys ./cmd/rttys

FROM alpine:3
RUN apk add --no-cache ca-certificates tzdata
COPY --from=rttys /rttys/rttys /usr/bin/rttys
VOLUME /var/lib/rttys
EXPOSE 5912 5913
ENTRYPOINT ["/usr/bin/rttys"]
