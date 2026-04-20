# Phase 4 生产化准备清单

## 0. 说明

- 本文档只收口 Phase 4 的静态准备项，不替代浏览器联调、运行态验收和公网正式部署。
- 当前仓库以 V1 为边界，不新增 V2/V3 功能，不调整现有接口契约，不重构业务主逻辑。
- H5 当前未在 `127.0.0.1:5173` 监听，这会阻塞浏览器联调和最终回归，但不阻塞本文档整理。

## A. Phase 4 当前可交付范围

### API

已完成：

- `GET /health` 已实现，返回 `status / timestamp / provider / model`
- `POST /chat` 已实现，保持 `{ answer, matched }` 契约
- `GET/POST/PUT/DELETE /admin/faq` 已实现
- `/chat` 和 `/admin/faq` 已挂 `authMiddleware`
- CORS 已实现，开发/生产均通过 `CORS_ORIGINS` 控制
- FAQ 文件读写、内存缓存、写后热刷新已实现
- API 已支持通过 `FAQ_FILE_PATH` 切换 FAQ 数据源
- 本地开发环境和 AI 环境已形成两套 FAQ 数据链路

未完成：

- 仓库内没有正式生产环境配置文件
- 仓库内没有正式 LG 食堂 FAQ 数据文件
- 没有本轮确认过的生产部署地址、生产白名单和生产密钥口径

待确认：

- 生产环境最终使用的 `AI_PROVIDER / AI_MODEL / AI_BASE_URL`
- 生产 `CORS_ORIGINS` 的正式域名列表
- 生产 `FAQ_FILE_PATH` 的最终落点

当前仍属本地开发态，不适合直接部署：

- 当前默认 FAQ 数据只有 2 条占位内容，不是 LG 食堂正式数据
- 当前 FAQ 文案提到“首页”“健康相关页面”，与现有 H5 单页聊天形态不一致

### Admin

已完成：

- 登录页已实现
- 路由守卫已实现，未登录访问 `/faq` 会回到 `/login`
- FAQ 列表页已实现
- FAQ 关键字搜索已实现，覆盖 `question / answer / tags`
- FAQ 新增、编辑、删除页已实现
- Admin 已通过真实 API 调用 FAQ CRUD

未完成：

- 没有服务端管理员鉴权
- 没有生产环境访问地址与部署口径
- 没有对外生产发布所需的静态资源路径和路由回退说明

待确认：

- 生产 Admin 是否只做内网访问或额外网关保护
- 生产 `VITE_API_BASE_URL` 和 `VITE_API_SECRET`
- 生产访问域名或路径前缀

当前仍属本地开发态，不适合直接部署：

- 登录逻辑是纯前端临时方案：固定 `admin / admin123`，只写浏览器 `localStorage`
- 当前实现适合 V1 演示和本地联调，不适合直接作为公网后台登录方案

### H5

已完成：

- 单页聊天主界面已实现
- 餐厅名称和 Logo 占位已接入环境变量
- 消息 `loading / done / error` 状态已实现
- FAQ 命中与 AI 兜底标签区分已实现
- 移动端布局、输入栏固定底部和安全区处理已实现
- 已通过 `src/api/chat.js` 接入 `/chat`

未完成：

- 本轮未完成浏览器运行态验收
- 没有生产环境访问地址
- 页面元信息仍是默认 Vite 标题，未收口为交付态文案

待确认：

- 生产 `VITE_API_BASE_URL`
- 生产 `VITE_API_SECRET`
- 生产 `VITE_RESTAURANT_NAME`
- 生产 `VITE_RESTAURANT_LOGO`
- 生产 H5 访问域名或路径前缀

当前仍属本地开发态，不适合直接部署：

- 当前 H5 运行验收被 `127.0.0.1:5173` 未监听阻塞
- `index.html` 仍是默认标题 `Vite App`
- 构建产物使用根路径资源引用，默认按站点根路径部署

## B. 正式 FAQ 数据接入方案

### 1. 当前 FAQ 数据源位置

- 开发环境默认 FAQ：`smartdine-api/src/data/faq.json`
- AI 环境 FAQ：`smartdine-api/src/data/faq.ai.json`
- API 读取逻辑：
  - 若配置了 `FAQ_FILE_PATH`，优先读取该路径
  - 未配置时回退到默认 FAQ 文件

### 2. 当前仓库里的 FAQ 现状

- `faq.json` 与 `faq.ai.json` 结构兼容当前 API
- 两个文件当前内容相同，均只有 2 条占位 FAQ
- 现有内容不是 LG 食堂正式 FAQ
- 现有内容包含“首页”“健康相关页面”等描述，与当前 H5 仅有聊天页的能力不一致

结论：

- 当前仓库内没有可直接上线的正式 FAQ 数据文件
- 当前仓库内只有“结构可复用、内容不可直接上线”的占位 FAQ

### 3. 正式 FAQ 建议接入口径

建议文件位置：

- 建议新增正式 FAQ 文件：`smartdine-api/src/data/faq.prod.json`
- 已落地模板文件：`smartdine-api/src/data/faq.prod.json.example`
- 生产环境通过 `FAQ_FILE_PATH=src/data/faq.prod.json` 显式接入
- 若部署平台不适合直接写仓库内文件，则改为平台挂载的绝对路径，并在生产环境里设置绝对路径

建议原因：

- 不改现有业务逻辑
- 复用现有 `FAQ_FILE_PATH` 机制
- 保持开发、AI、生产三套 FAQ 数据源隔离

### 4. 建议字段结构

当前代码兼容结构如下：

```json
[
  {
    "id": "faq_001",
    "question": "请填写已确认的问题",
    "answer": "请填写已确认的正式答案",
    "tags": ["请填写关键词", "同义表达"]
  }
]
```

字段要求：

- `id`：字符串，唯一，建议保持 `faq_001` 这类稳定编号
- `question`：字符串，非空
- `answer`：字符串，非空
- `tags`：字符串数组，每个元素非空

模板落地方式：

1. 复制 `smartdine-api/src/data/faq.prod.json.example`
2. 重命名为 `smartdine-api/src/data/faq.prod.json`
3. 只录入已确认的正式 FAQ 内容
4. 在生产环境设置 `FAQ_FILE_PATH=src/data/faq.prod.json`

### 5. 可直接上线的内容

- FAQ 文件结构
- API 的 FAQ 读写与热加载机制
- Admin 的 FAQ CRUD 链路
- `FAQ_FILE_PATH` 作为生产 FAQ 切换入口

### 6. 待确认、不能直接进入正式数据的内容

- 当前仓库里的 2 条占位 FAQ 文案
- 任何未经过 LG 食堂确认的营业、菜单、服务规则、联系方式类信息
- 任何会引用当前产品并不存在页面或功能的答案文案
- 任何时间敏感、价格敏感、窗口敏感但没有确认更新时间和责任人的内容

### 7. 可作为整理依据的现有文档

- `smartdine-word/SmartDine项目规划文档.md`
  - 明确 V1 是 LG 食堂场景
  - 明确 FAQ 结构和 V1 产品边界
- `smartdine-word/SmartDine_V1_开发执行顺序清单.md`
  - 明确 Phase 4 需要整理 15~30 条 LG 食堂高频 FAQ
- `smartdine-word/Phase3_Admin_完成归档.md`
  - 明确当前热更新链路已经成立
  - 明确 Phase 4 前需要替换为真实 LG 食堂 FAQ 数据

注意：

- 这些文档能提供结构、范围和验收口径
- 它们不是正式 FAQ 数据源，不能直接当正式上线内容导入

### 8. 导入前校验规则

- 文件编码必须为 UTF-8
- 根节点必须是 JSON 数组
- 每条 FAQ 都必须包含 `id / question / answer / tags`
- `id` 必须唯一，且不允许空字符串
- `question`、`answer` 不能为空，导入前要去掉首尾空格
- `tags` 必须是数组，且至少有 1 个非空字符串
- 不允许把测试数据、演示数据、未确认口径数据混入正式文件
- 不允许保留引用不存在页面或不存在业务能力的答案
- 导入前至少抽样验证 3 类问题：
  - 能明确命中的已知问题
  - 依赖 `tags` 命中的近义问法
  - 明确应落到 AI 兜底的问题
- 按当前文档口径，正式首版 FAQ 建议准备 15~30 条高频问题

## C. 生产环境前置配置收口清单

### API

| 配置项 | 开发环境 | AI 环境 | 生产环境 | 说明 |
| --- | --- | --- | --- | --- |
| `PORT` | 已具备，开发口径为 `3000` | 已具备，AI 口径为 `3300` | 必须人工确认 | 生产端口通常由平台注入，需与部署平台一致 |
| `API_SECRET` | 已具备 | 已具备 | 必须人工确认 | 生产必须重新生成高强度随机值，不写入仓库 |
| `CORS_ORIGINS` | 已具备，开发应覆盖 `127.0.0.1:5173,5174` | 已具备，AI 应覆盖 `127.0.0.1:5273,5274` | 必须人工确认 | 生产必须替换为正式 Admin/H5 域名，不再保留本地地址 |
| `AI_PROVIDER` | 已具备 | 已具备 | 必须人工确认 | 代码当前按 Kimi 口径封装 |
| `AI_API_KEY` | 已具备 | 已具备 | 必须人工确认 | 不写入仓库 |
| `AI_MODEL` | 已具备 | 已具备 | 必须人工确认 | 要与实际 provider 对齐 |
| `AI_BASE_URL` | 已具备 | 已具备 | 必须人工确认 | 要与实际 provider 对齐 |
| `FAQ_FILE_PATH` | 当前未显式配置，代码回退 `src/data/faq.json` | 已具备，指向 AI FAQ 文件 | 必须人工确认 | 建议生产设置为 `src/data/faq.prod.json` 或平台挂载绝对路径 |

生产环境变量模板建议：

```env
PORT=3000
API_SECRET=<replace-with-strong-random-secret>
CORS_ORIGINS=https://admin.example.com,https://h5.example.com
AI_PROVIDER=kimi
AI_API_KEY=<replace-with-production-key>
AI_MODEL=moonshot-v1-8k
AI_BASE_URL=https://api.moonshot.cn/v1
FAQ_FILE_PATH=src/data/faq.prod.json
```

已落地模板文件：

- `smartdine-api/.env.production.example`

### Admin

| 配置项 | 开发环境 | AI 环境 | 生产环境 | 说明 |
| --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `.env.local` 已具备 | `.env.ai` 已具备 | 必须人工确认 | 生产必须指向正式 API 地址 |
| `VITE_API_SECRET` | `.env.local` 已具备 | `.env.ai` 已具备 | 必须人工确认 | 必须与生产 `API_SECRET` 一致 |

生产访问地址：

- 当前仓库未配置，必须人工确认
- 建议单独使用稳定域名或子域名

构建后静态资源路径风险：

- 当前构建产物使用根路径资源，如 `/assets/...`
- 这意味着默认更适合部署在站点根路径，而不是子路径
- Admin 使用 `createWebHistory()`，生产环境必须提供 `index.html` 回退，否则直接访问 `/faq`、`/faq/edit/:id` 会返回 404

生产环境变量模板建议：

```env
VITE_API_BASE_URL=https://api.example.com
VITE_API_SECRET=<same-as-production-api-secret>
```

已落地模板文件：

- `smartdine-admin/.env.production.example`

### H5

| 配置项 | 开发环境 | AI 环境 | 生产环境 | 说明 |
| --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `.env.local` 已具备 | `.env.ai` 已具备 | 必须人工确认 | 生产必须指向正式 API 地址 |
| `VITE_API_SECRET` | `.env.local` 已具备 | `.env.ai` 已具备 | 必须人工确认 | 必须与生产 `API_SECRET` 一致 |
| `VITE_RESTAURANT_NAME` | `.env.local` 已具备 | `.env.ai` 已具备 | 必须人工确认 | 需确认最终对外品牌名 |
| `VITE_RESTAURANT_LOGO` | `.env.local` 已具备，当前可为空 | `.env.ai` 已具备，当前可为空 | 必须人工确认 | 可为空，但若使用需确认正式静态资源 URL |

生产访问地址：

- 当前仓库未配置，必须人工确认

聊天接口联调依赖：

- `VITE_API_BASE_URL` 必须可访问
- `VITE_API_SECRET` 必须与 API 一致
- 生产 API 必须放行 H5 域名到 `CORS_ORIGINS`

构建后静态资源路径风险：

- 当前构建产物使用根路径资源，如 `/assets/...` 和 `/favicon.ico`
- 默认更适合部署在站点根路径
- `index.html` 当前标题仍是 `Vite App`，上线前应确认对外交付文案

生产环境变量模板建议：

```env
VITE_API_BASE_URL=https://api.example.com
VITE_API_SECRET=<same-as-production-api-secret>
VITE_RESTAURANT_NAME=<confirmed-restaurant-name>
VITE_RESTAURANT_LOGO=<optional-logo-url>
```

已落地模板文件：

- `smartdine-h5/.env.production.example`

## D. 部署策略收口

### 1. Admin 暂不应直接公网裸暴露

原因：

- 当前 Admin 登录是前端临时方案
- 账号口径仍是 `admin / admin123`
- 登录态只存浏览器 `localStorage`

建议保护策略：

- 仅内网访问
- 部署平台自带密码保护
- 反向代理 Basic Auth
- VPN / IP 白名单

说明：

- 以上策略属于部署层保护，不要求本轮改业务代码

### 2. Admin 与 H5 默认按站点根路径部署

- 当前 Admin 构建产物使用 `/assets/...`
- 当前 H5 构建产物使用 `/assets/...` 和 `/favicon.ico`
- 默认更适合部署在站点根路径

如果必须部署到子路径：

- 需要单独调整 Vite `base` 配置并重新验证
- 这属于部署策略变更，不能默认假设已支持

### 3. Admin history 路由必须提供 `index.html` 回退

- Admin 使用 `createWebHistory()`
- 生产环境必须把 `/faq`、`/faq/new`、`/faq/edit/:id` 这类访问回退到 `index.html`
- 否则直接刷新或直接打开深链接会返回 404

### 4. H5 上线前必须替换的标题/品牌文案

必须确认：

- `VITE_RESTAURANT_NAME`
- `VITE_RESTAURANT_LOGO`
- H5 `index.html` 的页面标题，当前仍是默认 `Vite App`

建议确认：

- H5 顶部提示文案是否符合正式口径
- FAQ 文案中是否还引用不存在页面

## E. 部署前最小验收清单

以下是 Phase 4 的最小验收清单。本清单描述“要验什么”，不代表本文档已经全部实际执行。

### API

- `/health` 可访问
- `/chat` 带正确 `x-api-key` 时可用
- 空问题返回 `400`
- 错误 `x-api-key` 返回 `401`
- FAQ 修改后，无需重启 API 即可联动生效
- CORS 对 H5/Admin 生产域名放行正确

### Admin

- 登录页可访问
- FAQ 列表页可访问
- FAQ 搜索可用
- FAQ 新增可用
- FAQ 编辑可用
- FAQ 删除可用
- 调用真实 API 正常
- 生产环境中直接访问 `/faq`、`/faq/new`、`/faq/edit/:id` 不会因为缺少路由回退而 404

### H5

- 首页可访问
- 聊天发送可用
- FAQ 命中时 `matched` 不为 `null`
- FAQ 未命中时 `matched` 为 `null`
- FAQ / AI 标签表现符合预期
- 调用真实 API 正常

### Build

- `smartdine-api` 执行 `npm run build` 通过
- `smartdine-admin` 执行 `npm run build` 通过
- `smartdine-h5` 执行 `npm run build` 通过
- 构建产物路径明确：
  - API：`smartdine-api/dist`
  - Admin：`smartdine-admin/dist`
  - H5：`smartdine-h5/dist`

### 部署前人工确认项

- 正式域名
- 正式 API 地址
- 正式 Admin 地址
- 正式 H5 地址
- 正式 FAQ 数据文件
- 正式 `API_SECRET`
- 正式 `AI_API_KEY`
- 正式 `CORS_ORIGINS`
- 正式 `VITE_RESTAURANT_NAME`
- 正式 `VITE_RESTAURANT_LOGO`

## F. 部署前最终放行清单

- [ ] 正式 FAQ 已整理为 `smartdine-api/src/data/faq.prod.json` 或等价生产文件
- [ ] `FAQ_FILE_PATH` 已指向正式 FAQ 文件
- [ ] 正式 API 域名已确认
- [ ] 正式 Admin 域名已确认
- [ ] 正式 H5 域名已确认
- [ ] 生产 `API_SECRET` 已生成并配置
- [ ] 生产 `AI_API_KEY` 已生成并配置
- [ ] 生产 `CORS_ORIGINS` 已只保留正式域名
- [ ] Admin 保护策略已明确并生效
- [ ] Admin history 路由已配置 `index.html` 回退
- [ ] Admin 与 H5 的站点根路径部署口径已确认
- [ ] `VITE_RESTAURANT_NAME` 已替换为正式品牌名
- [ ] `VITE_RESTAURANT_LOGO` 已确认或明确为空
- [ ] H5 页面标题已替换为正式标题
- [ ] FAQ 内容中不存在未确认信息和不存在页面引用

## G. 当前运行验收阻塞项

- H5 当前未在 `127.0.0.1:5173` 监听
- 这会阻塞浏览器联调、FAQ 修改后 H5 实测和最终回归
- 这不影响本文档所覆盖的静态收口结论

## H. 当前还不能直接上线的核心阻塞

- 正式 LG 食堂 FAQ 数据缺失
- Admin 仍是前端临时登录方案，不适合直接公网暴露
- 生产域名、生产 API 地址、生产密钥、生产白名单尚未确认
- Admin/H5 当前构建默认按站点根路径部署，Admin 还需要路由回退策略
- H5 页面元信息仍是默认 Vite 口径，尚未完全收口为交付态
