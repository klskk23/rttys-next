# rttys

[1]: https://img.shields.io/badge/license-MIT-brightgreen.svg?style=plastic
[2]: /LICENSE
[3]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=plastic
[4]: https://github.com/zhaojh329/rttys/pulls
[5]: https://img.shields.io/badge/Issues-welcome-brightgreen.svg?style=plastic
[6]: https://github.com/zhaojh329/rttys/issues/new
[7]: https://img.shields.io/badge/release-5.6.0-blue.svg?style=plastic
[8]: https://github.com/zhaojh329/rttys/releases
[9]: https://github.com/zhaojh329/rttys/workflows/build/badge.svg
[10]: https://img.shields.io/github/downloads/zhaojh329/rttys/total
[12]: https://deepwiki.com/badge.svg
[13]: https://deepwiki.com/zhaojh329/rttys
[14]: https://goreportcard.com/badge/github.com/zhaojh329/rttys/v5
[15]: https://goreportcard.com/report/github.com/zhaojh329/rttys/v5

[![license][1]][2]
[![PRs Welcome][3]][4]
[![Issue Welcome][5]][6]
[![Release Version][7]][8]
![Build Status][9]
[![Go Report Card][14]][15]
![Downloads][10]
[![Ask DeepWiki][12]][13]

> **This fork** ([klskk23/rttys-next](https://github.com/klskk23/rttys-next)) tracks upstream
> [zhaojh329/rttys](https://github.com/zhaojh329/rttys) with a Material 3 web UI and a container image
> published to `ghcr.io/klskk23/rttys-next`. Image versions follow the upstream release version.
>
> [![docker](https://github.com/klskk23/rttys-next/actions/workflows/docker.yml/badge.svg)](https://github.com/klskk23/rttys-next/actions/workflows/docker.yml)

> **🔗 This is the server component of the rtty project. For complete information please visit the main [rtty client repository](https://github.com/zhaojh329/rtty).**

![](/img/terminal.gif)
![](/img/file.gif)
![](/img/web.gif)
![](/img/virtual-keyboard.jpg)

## 📖 About

**rttys** is the server-side component of the [rtty](https://github.com/zhaojh329/rtty) remote terminal system. It provides a web-based management interface and handles connections from rtty clients running on remote devices.

## 🏗️ Project Structure

This repository contains only the server-side components:
- **Server binary**: The main rttys server program
- **Web UI**: Browser-based management interface
- **API**: RESTful API for device management

## 🐳 Deploy with Docker Compose

1. Get the compose file and environment template:

   ```sh
   mkdir rttys && cd rttys
   curl -fsSLO https://raw.githubusercontent.com/klskk23/rttys-next/master/compose.yaml
   curl -fsSL -o .env https://raw.githubusercontent.com/klskk23/rttys-next/master/.env.example
   ```

2. Edit `.env` and set at least `RTTYS_PASSWORD`. All variables are listed below.

3. Start the server:

   ```sh
   docker compose up -d
   ```

4. Open `http://<server>:5913` and sign in.

5. Connect a device:

   ```sh
   rtty -h <server> -p 5912 -I my-device -a          # add -t <token> if RTTYS_TOKEN is set
   ```

| Variable | Default | Description |
|----------|---------|-------------|
| `RTTYS_VERSION` | `latest` | Image tag |
| `TZ` | `UTC` | Container time zone |
| `RTTYS_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `RTTYS_PASSWORD` | — | Web management password (required) |
| `RTTYS_TOKEN` | empty | Token devices must present; empty allows any device |
| `RTTYS_ALLOW_ORIGINS` | `false` | Allow cross-origin API requests |
| `RTTYS_DEV_PORT` | `5912` | Host port for device connections |
| `RTTYS_WEB_PORT` | `5913` | Host port for the web UI and API |
| `RTTYS_HTTP_PROXY_PORT` | `5914` | Device web proxy port (same on host and container) |
| `RTTYS_HTTP_PROXY_REDIR_URL` | empty | Redirect URL for the device web proxy |
| `RTTYS_HTTP_PROXY_REDIR_DOMAIN` | empty | Cookie domain for the device web proxy |
| `RTTYS_SHARE_PUBLIC_HOST` | empty | Host shown in share connection details |
| `RTTYS_SHARE_PORT_START` | `20000` | First temporary share port |
| `RTTYS_SHARE_PORT_END` | `20099` | Last temporary share port |
| `RTTYS_DEV_HOOK_URL` | empty | Called when a device connects |
| `RTTYS_USER_HOOK_URL` | empty | Called when a user accesses a device |
| `RTTYS_CERT_DIR` | `./certs` | Host directory mounted at `/etc/rttys/certs` |
| `RTTYS_SSL_CERT` | empty | Device TLS certificate, e.g. `/etc/rttys/certs/server.crt` |
| `RTTYS_SSL_KEY` | empty | Device TLS private key |
| `RTTYS_CA_CERT` | empty | CA certificate to verify devices (mTLS) |

Hook URLs run inside the container; use `host.docker.internal` to reach a service on the host.
Hook semantics are described in [deploy/rttys.conf](deploy/rttys.conf).

Upgrade with `docker compose pull && docker compose up -d`.
Images are tagged `latest`, `<version>` (e.g. `5.6.0`), `<major>.<minor>` and `sha-<commit>`.

To build the image locally instead: `docker build -t ghcr.io/klskk23/rttys-next:latest .`

## ⭐ Star History
[![Star History Chart](https://api.star-history.com/svg?repos=zhaojh329/rttys&type=Date)](https://www.star-history.com/#zhaojh329/rttys&Date)

## 🤝 Contributing
If you would like to help making [rttys](https://github.com/zhaojh329/rttys) better,
see the [CONTRIBUTING.md](https://github.com/zhaojh329/rttys/blob/master/CONTRIBUTING.md) file.

## ❤️ [Donation](https://zhaojh329.github.io/zhaojh329/)
