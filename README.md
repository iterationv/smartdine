# SmartDine

## 项目说明

本仓库包含 3 个独立子项目：

- `smartdine-api`：Node.js + Hono + TypeScript 后端
- `smartdine-admin`：Vue 3 + Vite + Ant Design Vue 的 Admin
- `smartdine-h5`：Vue 3 + Vite 的 H5 客户端

当前仓库根目录没有 `package.json`，也没有 `workspaces`。这不是 monorepo/workspace 统一启动结构，不能在根目录直接执行 `npm run dev`。

## 环境要求

- 已实测本地环境：
  - `node v22.22.0`
  - `npm 10.9.4`
- 包管理器：`npm`
- Lock 文件：
  - `smartdine-api/package-lock.json`
  - `smartdine-admin/package-lock.json`
  - `smartdine-h5/package-lock.json`
- 根目录没有：
  - `package.json`
  - `package-lock.json`
  - `pnpm-lock.yaml`
  - `yarn.lock`
- `smartdine-h5/package.json` 显式声明 Node 版本要求：
  - `^20.19.0 || >=22.12.0`

## 项目结构

```text
smartDine/
├─ AGENTS.md
├─ README.md
├─ smartdine-word/
├─ smartdine-api/
├─ smartdine-admin/
└─ smartdine-h5/
```

三端目录：

- API：`D:\projects\smartDine\smartdine-api`
- Admin：`D:\projects\smartDine\smartdine-admin`
- H5：`D:\projects\smartDine\smartdine-h5`

## 安装依赖

根目录不能执行 `npm install`，因为没有根 `package.json`。

请分别进入每个子项目安装：

```powershell
cd D:\projects\smartDine\smartdine-api
npm install

cd D:\projects\smartDine\smartdine-admin
npm install

cd D:\projects\smartDine\smartdine-h5
npm install
```

## 启动项目

### API

- 启动目录：`D:\projects\smartDine\smartdine-api`
- 开发环境：`npm run dev`
- AI 测试环境：`npm run dev:ai`
- 生产启动：`npm start`
- 启动前置条件：
  - 已执行 `npm install`
  - 开发环境需要 `smartdine-api/.env`
  - AI 测试环境需要 `smartdine-api/.env.ai`

### Admin

- 启动目录：`D:\projects\smartDine\smartdine-admin`
- 开发环境：`npm run dev`
- AI 测试环境：`npm run dev:ai`
- 预览：`npm run preview`
- 启动前置条件：
  - 已执行 `npm install`
  - 开发环境默认读取 `smartdine-admin/.env.local`
  - AI 测试环境默认读取 `smartdine-admin/.env.ai`

### H5

- 启动目录：`D:\projects\smartDine\smartdine-h5`
- 开发环境：`npm run dev`
- AI 测试环境：`npm run dev:ai`
- 预览：`npm run preview`
- 启动前置条件：
  - 已执行 `npm install`
  - 开发环境默认读取 `smartdine-h5/.env.local`
  - AI 测试环境默认读取 `smartdine-h5/.env.ai`

## 本地双环境运行

### 为什么要区分开发环境和 AI 测试环境

区分两套本地环境的目的，是让日常开发调试和 AI 自动测试/验收能够同时运行，互不抢占端口，也尽量避免把测试操作写进开发环境正在使用的 FAQ 数据文件。

### 两套环境端口表

| 端 | 开发环境 | AI 测试环境 |
|---|---:|---:|
| API | 3000 | 3300 |
| Admin | 5174 | 5274 |
| H5 | 5173 | 5273 |

### 两套环境的启动命令

#### 开发环境

```powershell
cd D:\projects\smartDine\smartdine-api
npm run dev

cd D:\projects\smartDine\smartdine-admin
npm run dev

cd D:\projects\smartDine\smartdine-h5
npm run dev
```

#### AI 测试环境

```powershell
cd D:\projects\smartDine\smartdine-api
npm run dev:ai

cd D:\projects\smartDine\smartdine-admin
npm run dev:ai

cd D:\projects\smartDine\smartdine-h5
npm run dev:ai
```

### 推荐启动顺序

开发环境和 AI 测试环境都建议按下面顺序启动：

1. 先启动 API
2. 再启动 Admin
3. 最后启动 H5

原因：

- Admin 的 FAQ 页面依赖 API
- H5 的 `/chat` 请求依赖 API
- API 不启动时，前端 dev server 仍可能启动成功，但接口功能不可用

### 常见冲突说明

- 根目录执行 `npm run dev` 或 `npm run dev:ai` 会失败，因为根目录没有 `package.json`
- Admin 开发环境固定使用 `5174`，AI 测试环境固定使用 `5274`
- H5 开发环境默认使用 `5173`，AI 测试环境固定使用 `5273`
- 如果同一套环境已经启动，再次启动同一端口会因为端口占用报错
- 当前本地开发环境和 AI 测试环境都统一使用 `127.0.0.1`

## 打包命令

### API

- 目录：`D:\projects\smartDine\smartdine-api`
- 命令：`npm run build`
- 产物：`dist`
- 打包后运行：`npm start`

### Admin

- 目录：`D:\projects\smartDine\smartdine-admin`
- 命令：`npm run build`
- 产物：`dist`

### H5

- 目录：`D:\projects\smartDine\smartdine-h5`
- 命令：`npm run build`
- 产物：`dist`

## 环境变量说明

### API

实际文件：

- 开发环境：`smartdine-api/.env`
- AI 测试环境：`smartdine-api/.env.ai`
- 示例文件：`smartdine-api/.env.example`

当前使用到的变量：

- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL`
- `AI_BASE_URL`
- `API_SECRET`
- `CORS_ORIGINS`
- `PORT`
- `FAQ_FILE_PATH`

影响说明：

- 缺少 `.env` 或 `.env.ai` 不一定会让 API 进程直接启动失败
- 但会导致以下问题：
  - `API_SECRET` 为空时，受保护接口会返回 `401`
  - `AI_API_KEY` / `AI_MODEL` 缺失时，`/chat` 调用 LLM 会失败
  - `PORT` 缺失时会回退到 `3000`
  - `FAQ_FILE_PATH` 未配置时，会回退到默认 FAQ 文件

FAQ 数据隔离：

- 开发环境默认 FAQ 文件：`smartdine-api/src/data/faq.json`
- AI 测试环境 FAQ 文件：`smartdine-api/src/data/faq.ai.json`
- `FAQ_FILE_PATH` 通过环境变量指定，因此 AI 测试环境的增删改不会写回开发环境的 `faq.json`

### Admin

实际文件：

- 开发环境：`smartdine-admin/.env.local`
- AI 测试环境：`smartdine-admin/.env.ai`
- 示例文件：`smartdine-admin/.env.example`

当前使用到的变量：

- `VITE_API_BASE_URL`
- `VITE_API_SECRET`

影响说明：

- 缺少环境文件不会阻止 Vite 启动
- 但 FAQ 接口联调会受影响：
  - `VITE_API_SECRET` 为空时，请求会因鉴权失败返回 `401`
  - `VITE_API_BASE_URL` 未配置时，会回退到 `http://127.0.0.1:3000`

### H5

实际文件：

- 开发环境：`smartdine-h5/.env.local`
- AI 测试环境：`smartdine-h5/.env.ai`
- 示例文件：`smartdine-h5/.env.example`

当前使用到的变量：

- `VITE_API_BASE_URL`
- `VITE_API_SECRET`
- `VITE_RESTAURANT_NAME`
- `VITE_RESTAURANT_LOGO`

影响说明：

- 缺少环境文件不会阻止 Vite 启动
- 但聊天功能会受影响：
  - `VITE_API_BASE_URL` 为空时，前端会直接报“当前服务暂不可用”
  - `VITE_API_SECRET` 为空时，请求会因鉴权失败返回 `401`
  - `VITE_RESTAURANT_NAME` 缺失时，页面会回退到默认文案

## 常见问题

### 为什么根目录执行 `npm run dev` 会报错？

因为根目录没有 `package.json`。实际报错是：

- `npm error enoent Could not read package.json`

### 三端是不是都用 `npm run dev`？

开发环境下，是：

- API：`npm run dev`
- Admin：`npm run dev`
- H5：`npm run dev`

AI 测试环境下，是新增的：

- API：`npm run dev:ai`
- Admin：`npm run dev:ai`
- H5：`npm run dev:ai`

### 为什么 Admin 会报 `Port 5174 is already in use`？

因为 Admin 开发环境固定使用 `5174`，且启用了严格端口策略。只要 `5174` 已经有实例在跑，再次启动就会直接失败。

### 为什么 AI 测试环境不会和开发环境抢端口？

因为 AI 测试环境单独使用另一组端口：

- API：3300
- Admin：5274
- H5：5273

### 为什么现在统一使用 `127.0.0.1`？

因为本地开发环境和 AI 测试环境共存时，统一 hostname 更容易排查 CORS、Origin 和端口占用问题，也能减少文档口径和实际环境不一致的情况。

## Phase 4 生产物料

本轮已落地的生产物料：

- 正式 FAQ 模板：`smartdine-api/src/data/faq.prod.json.example`
- API 生产变量模板：`smartdine-api/.env.production.example`
- Admin 生产变量模板：`smartdine-admin/.env.production.example`
- H5 生产变量模板：`smartdine-h5/.env.production.example`

部署前总说明见：

- `smartdine-word/Phase4_生产化准备清单.md`

当前部署策略口径：

- Admin 当前不应直接公网裸暴露
- Admin 与 H5 默认按站点根路径部署
- Admin history 路由需要 `index.html` 回退
- H5 页面标题和品牌文案需在上线前替换为正式口径
