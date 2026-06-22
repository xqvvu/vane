# Vane Console

`apps/console` 是 Vane 的 TanStack Start 控制台。它拥有登录/setup、dashboard shell、API routes、server functions、Better Auth、SQLite 持久化、显式 migrations、按能力组织的 services、SQLite repositories 和进程内 delivery worker。

## 本地运行

从仓库根目录执行：

```bash
pnpm install
cp apps/console/.env.example apps/console/.env.local
pnpm --filter @vane/console dev
```

默认 `.env.example` 使用 `http://localhost:6180`。如果 dev server 端口变了，需要同步更新 `BETTER_AUTH_URL` 和 `SERVER_URL`。

如果通过 PVC、反向代理或临时外部域名访问本地 dev server，把外部 Host 加进
`BETTER_AUTH_ALLOWED_HOSTS`，并把完整外部 Origin 加进
`BETTER_AUTH_TRUSTED_ORIGINS`。例如：

```env
BETTER_AUTH_URL=https://vane.example.test
BETTER_AUTH_ALLOWED_HOSTS=localhost:6180,vane.example.test
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:6180,https://vane.example.test
SERVER_URL=https://vane.example.test
```

## 常用脚本

```bash
pnpm --filter @vane/console fmt
pnpm --filter @vane/console fmt:check
pnpm --filter @vane/console lint
pnpm --filter @vane/console test
pnpm --filter @vane/console build
```

## 目录边界

- `src/routes`：TanStack Router 文件路由、loader、URL search params、薄页面入口和 API routes。
- `src/features`：Sources、Routes、Destinations、Events、Deliveries、Settings/Auth 的 client-safe UI、query/mutation 和 model。
- `src/server`：server functions、request context、application container、按能力组织的 `*.service.ts` / `*.service.types.ts`。
- `src/infra/sqlite`：SQLite connection、migrations、repository implementations、store assembly。
- `src/components/ui`：shadcn primitives。
- `src/components/common`：跨 feature 复用但不拥有业务规则的 console UI 组合。

共享 command schema、DTO 和投影类型放在 `@vane/core`；仅后端使用的 dashboard session 类型放在 `src/server/runtime/dashboard-session.ts`。

## 开发约束

Dashboard 数据读写走 `*.functions.ts` server function，并在服务端重新建立 dashboard request context。Webhook intake API route 使用 Source token 或额外共享密钥，不依赖浏览器 session。

前端 route、feature、组件不能导入 `src/infra/*`、SQLite store、server runtime container、secret helper 或其他 server-only implementation。需要数据时通过 feature `queryOptions` / mutations 调用 server functions。
