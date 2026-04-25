# split-check-page

一个用于对比源站和复刻站页面效果的小工具，现已整理成前后端分离结构：

- `frontend`: React + TypeScript + Vite
- `backend`: Go + `net/http`

## 目录结构

```text
.
├─ frontend/   # React + TypeScript 前端
├─ backend/    # Go 服务端
├─ Dockerfile
└─ docker-compose.yml
```

## 功能

- 支持粘贴或文件导入对比链接
- 浏览器本地持久化
- 移动端 / PC 端预览切换
- 左右并排查看源站和复刻站效果
- 服务端代理源站页面，便于 iframe 预览

## 本地开发

### 前端

```bash
cd frontend
npm install
npm run dev
```

默认打开 `http://localhost:5173`。

### 后端

需要本机安装 Go 1.23+：

```bash
cd backend
go run ./cmd/server
```

默认监听 `http://localhost:8155`。

Vite 已经把 `/proxy` 和 `/health` 代理到 `8155`，所以前端开发时只需要同时启动前后端即可。

## 生产构建

### 前端构建

```bash
cd frontend
npm run build
```

### 后端运行

```bash
cd backend
go run ./cmd/server
```

服务端默认读取 `../frontend/dist` 的构建产物；也可以用环境变量覆盖：

```bash
FRONTEND_DIST=frontend/dist
```

## Docker

```bash
docker compose up -d --build
```

打开 `http://localhost:8155`。

## 环境变量

- `PORT`: 服务端端口，默认 `8155`
- `FRONTEND_DIST`: 前端构建目录，默认 `frontend/dist`
- `ALLOWED_ORIGINS`: 允许跨域的来源列表，逗号分隔，默认 `*`
- `ALLOW_PRIVATE_NETWORKS`: 是否允许代理私网地址，默认 `false`

## 备注

- 如果只启动后端但还没有执行前端构建，根路径会返回提示信息。
- 当前机器若未安装 Go，可以先用 Docker 跑完整环境。
