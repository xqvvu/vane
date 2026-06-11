# Vane Docker 部署

Vane MVP 的默认部署形态是单进程、单镜像、SQLite 数据卷，不需要 Redis、Postgres、
Kafka 或独立 worker。

应用进程内会自动启动 SQLite-backed delivery worker，周期性处理 pending deliveries；
控制台里的 `Run worker` 按钮只是手动即时触发一次处理。

## 构建镜像

```bash
docker build -t vane:local .
```

## 使用 Docker Compose 启动

先生成并导出一个生产专用的 Better Auth secret：

```bash
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
```

```bash
docker compose up -d
```

启动后访问：

```text
http://localhost:3000
```

首次进入 `/login` 后使用 `First setup` 创建 owner 用户。创建成功后，后续注册会被拒绝。

## 数据卷

Compose 默认创建并挂载 `vane-data` 到容器内 `/data`。SQLite 文件默认写入：

```text
/data/vane.sqlite
```

备份时保留这个 volume 即可。直接 `docker run` 时也应挂载 `/data`：

```bash
docker run --rm -p 3000:3000 \
  -v vane-data:/data \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  vane:local
```

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `BETTER_AUTH_URL` | 无 | 浏览器访问 Vane 的完整 URL，生产环境必须设置。 |
| `BETTER_AUTH_SECRET` | 无 | Better Auth secret，至少 32 字符，生产环境必须设置，并且不能使用示例占位值。 |
| `SERVER_URL` | 无 | Vane server URL；未设置 `BETTER_AUTH_URL` 时可作为 base URL。 |
| `VANE_DATABASE_PATH` | `/data/vane.sqlite` | SQLite 数据库路径。 |
| `VANE_MAX_WEBHOOK_BYTES` | `1048576` | 单个 inbound webhook JSON payload 最大字节数。 |
| `VANE_WORKER_BATCH_SIZE` | `10` | 进程内 delivery worker 每轮最多认领的 pending deliveries 数。 |
| `VANE_WORKER_INTERVAL_MS` | `5000` | 进程内 delivery worker 自动运行间隔，单位毫秒。 |

## Webhook URL

Source 创建后会生成 source token。上游系统应使用：

```text
POST /api/sources/<sourceId>/webhook
Authorization: Bearer <source-token>
Content-Type: application/json
```

也可以使用 `x-vane-source-token` header 传 token。
