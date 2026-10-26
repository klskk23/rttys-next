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

The container starts with `rttys -c /etc/rttys/rttys.conf`, the same as the deb package and systemd service.

1. Get the compose file and the container config:

   ```sh
   mkdir rttys && cd rttys
   curl -fsSLO https://raw.githubusercontent.com/klskk23/rttys-next/master/deploy/docker/compose.yaml
   curl -fsSLO https://raw.githubusercontent.com/klskk23/rttys-next/master/deploy/docker/rttys.conf
   ```

2. Edit `rttys.conf`: change `password`, and set any other option as in a regular install.

3. Start the server:

   ```sh
   docker compose up -d
   ```

4. Open `http://<server>:5913` and sign in.

5. Connect a device:

   ```sh
   rtty -h <server> -p 5912 -I my-device -a          # add -t <token> if token is set
   ```

Both files live in [deploy/docker](deploy/docker); you can also run `docker compose up -d` from that directory of a checkout.
`rttys.conf` there is the stock [deploy/rttys.conf](deploy/rttys.conf) with these container settings enabled.
If you change them, update the published ports in `compose.yaml` to match:

| Option | Value | Published port |
|--------|-------|----------------|
| `addr-dev` | `:5912` | `5912` (host port may differ) |
| `addr-user` | `:5913` | `5913` (host port may differ) |
| `addr-http-proxy` | `:5914` | `5914` (must be the same on the host) |
| `share-port-start` / `share-port-end` | `20000` / `20099` | `20000-20099` (must be the same on the host) |
| `share-host-key` | `/var/lib/rttys/ssh_host_ed25519_key` | kept in the `rttys-data` volume |

- Hook URLs are called from inside the container; use `host.docker.internal` to reach a service on the host.
- For device TLS, uncomment the `./certs` volume in `compose.yaml` and point `sslcert`, `sslkey` and `cacert`
  to `/etc/rttys/certs/...`.
- `RTTYS_VERSION` (image tag, default `latest`) and `TZ` (default `UTC`) can be set in the shell or a `.env` file.

Upgrade with `docker compose pull && docker compose up -d`.
Images are tagged `latest`, `<version>` (e.g. `5.6.0`), `<major>.<minor>` and `sha-<commit>`.

To build the image locally instead: `docker build -t ghcr.io/klskk23/rttys-next:latest .`

## ⭐ Star History
[![Star History Chart](https://api.star-history.com/svg?repos=zhaojh329/rttys&type=Date)](https://www.star-history.com/#zhaojh329/rttys&Date)

## 🤝 Contributing
If you would like to help making [rttys](https://github.com/zhaojh329/rttys) better,
see the [CONTRIBUTING.md](https://github.com/zhaojh329/rttys/blob/master/CONTRIBUTING.md) file.

## ❤️ [Donation](https://zhaojh329.github.io/zhaojh329/)
