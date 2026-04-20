# SmartDine V1 开发执行顺序清单

> 执行工具：Codex · Claude Code  
> 用途：Phase 执行依据 + 联调前置验证 + 验收标准  
> 不覆盖：V2/V3 功能、RAG、多租户、向量检索

---

## 1. V1 目标（统一基线）

```
顾客进入 H5 → 输入问题 → 后端 /chat 处理
→ FAQ 命中 + AI 润色 / FAQ 未命中 AI 兜底 → 返回答案

管理员进入 Admin → 查看 FAQ 列表 → 增删改 FAQ → 修改后无需重启即生效
```

V1 必须同时具备：后端 API + C 端 H5 + B 端 Admin。

---

## 2. 当前进度

```
Phase 1：后端核心能力    ✅ 完成
Phase 2：C 端 H5        ✅ 完成
Phase 3：B 端 Admin     ⏳ 待开始  ← 当前位置
Phase 4：联调验收部署    ⏳ 待开始
```

---

## 3. 全局执行原则

- 先主链路，再补配套
- 先可运行，再做体验优化
- 先统一接口契约，再开始联调
- 只做当前 Phase，不跳阶段
- 禁止插入：RAG / 向量检索 / 多轮记忆 / 点赞踩 / 问答历史 / 多租户

---

## 4. 项目目录约定

```
smartdine/
├── smartdine-api/
│   ├── src/
│   │   ├── index.ts          ← 路由 + 中间件注册（TypeScript）
│   │   ├── config.ts         ← env 统一读取（TypeScript）
│   │   ├── faq.ts            ← FAQ 模块（TypeScript）
│   │   ├── llm.ts            ← AI 调用（TypeScript）
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── cors.ts
│   │   └── data/faq.json
│   ├── .env                  ← 本地密钥（禁止 AI 修改）
│   └── .env.example
│
├── smartdine-h5/
│   ├── src/
│   │   ├── views/Chat.vue
│   │   ├── components/MessageList.vue
│   │   ├── components/InputBar.vue
│   │   └── api/chat.js       ← JavaScript（不是 TypeScript）
│   ├── .env.local            ← 本地变量（禁止 AI 修改）
│   └── .env.example
│
└── smartdine-admin/          ← Phase 3 待创建
    ├── src/
    │   ├── views/Login.vue
    │   ├── views/Faq/List.vue
    │   ├── views/Faq/Edit.vue
    │   └── api/faq.js
    └── .env.example
```

---

## 5. 环境变量约定

### 后端
```env
AI_PROVIDER=kimi
AI_API_KEY=your_kimi_key
AI_MODEL=moonshot-v1-8k
AI_BASE_URL=https://api.moonshot.cn/v1
API_SECRET=your_random_secret
CORS_ORIGINS=http://127.0.0.1:5173,http://127.0.0.1:5174
PORT=3000
```

### H5（必须存在 .env.local，不接受进程级注入替代）
```env
VITE_API_BASE_URL=http://127.0.0.1:3000
VITE_API_SECRET=your_random_secret
VITE_RESTAURANT_NAME=LG食堂
VITE_RESTAURANT_LOGO=
```

### Admin
```env
VITE_API_BASE_URL=http://127.0.0.1:3000
VITE_API_SECRET=your_random_secret
```

---

## 6. 接口契约（已锁定，不可随意修改）

### POST /chat
```json
请求头：x-api-key: <API_SECRET>
请求体：{ "question": "今天有什么菜？" }

返回（FAQ 命中）：
{ "answer": "...", "matched": { "id": "faq_001", "question": "..." } }

返回（FAQ 未命中）：
{ "answer": "...", "matched": null }
```

### FAQ 数据结构
```json
{ "id": "faq_001", "question": "...", "answer": "...", "tags": ["菜单", "今日菜品"] }
```

### 标准验证命令
```bash
# 健康检查
curl http://127.0.0.1:3000/health

# chat 接口测试
curl -X POST http://127.0.0.1:3000/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: 你的API_SECRET" \
  -d '{"question":"几点营业"}'

# CORS 预检验证
curl -X OPTIONS http://127.0.0.1:3000/chat \
  -H "Origin: http://127.0.0.1:5173" \
  -H "Access-Control-Request-Method: POST" -v
```

---

## Phase 1：后端核心能力 ✅

> 验收标准：`curl` 能独立完成问答测试，所有接口可用。

### 1.1 项目初始化 ✅
- [x] Node.js + Hono + TypeScript
- [x] `src / middleware / data` 目录结构

### 1.2 config.ts ✅
- [x] 统一读取所有 env
- [x] 关键配置缺失时启动报错

### 1.3 faq.ts ✅
- [x] 启动时读取 `faq.json` 并缓存内存
- [x] `getFaqList / addFaq / updateFaq / deleteFaq / reloadFaqCache`
- [x] `getMatchedFaq(question)` 基础关键词匹配（`question` + `tags`）

### 1.4 llm.ts ✅
- [x] `askLLM()` 封装 Kimi 调用
- [x] FAQ 命中 → 基于 FAQ 答案自然表达
- [x] FAQ 未命中 → 控制在餐饮服务范围内兜底

### 1.5 POST /chat ✅
- [x] 空输入返回 400
- [x] 无效 key 返回 401
- [x] 模型失败返回 500
- [x] 返回 `{ answer, matched }`

### 1.6 GET /health ✅
- [x] 返回 `{ status, timestamp, provider, model }`

### 1.7 中间件 ✅
- [x] auth.ts：校验 `x-api-key`
- [x] cors.ts：开发期全开，生产读 `CORS_ORIGINS`

### 1.8 FAQ Admin CRUD ✅
- [x] `GET/POST/PUT/DELETE /admin/faq`
- [x] 写操作同步写回 `faq.json` + 刷新内存缓存

---

## Phase 2：C 端 H5 ✅

> 验收标准：H5 可成功与后端联调，移动端可正常问答。

### 联调前置检查（Phase 2 专属）
在开始任何 H5 开发或联调前，必须先确认：
- [ ] `smartdine-h5/.env.local` 存在且 `VITE_API_BASE_URL` 有值
- [ ] `curl http://127.0.0.1:3000/health` 返回 200
- [ ] API 的 `CORS_ORIGINS` 包含 H5 开发端口（默认 5173）
- [ ] `VITE_API_SECRET` 与 `API_SECRET` 完全一致

任何一项不满足 → 先修复，再开始开发。

### 2.1 项目初始化 ✅
- [x] Vue 3 + Vite，JavaScript（不用 TypeScript）
- [x] `.env.example` 和 `.env.local`

### 2.2 聊天主页面 ✅
- [x] Chat.vue / MessageList.vue / InputBar.vue
- [x] 消息状态：`loading / done / error`
- [x] 按 id 替换消息（不直接原地修改对象）

### 2.3 接入 /chat ✅
- [x] `src/api/chat.js` 封装请求
- [x] 请求头自动带 `x-api-key`
- [x] loading 状态 + 失败提示

### 2.4 顶部品牌区 ✅
- [x] 餐厅名称 + Logo 占位

### 2.5 FAQ/AI 视觉区分 ✅
- [x] `matched != null` → FAQ 标签
- [x] `matched == null` → AI 标签
- [x] 欢迎语不标记为 AI 回答

### 2.6 移动端适配 ✅
- [x] 输入框固定底部，含 `safe-area-inset-bottom`
- [x] 消息区可滚动
- [x] `height: 100dvh`

---

## Phase 3：B 端 Admin ⏳（当前阶段）

> 验收标准：管理员可登录并完成 FAQ 增删改，修改后 H5 即时生效。

### 联调前置检查（Phase 3 专属）
在开始 Admin 开发或联调前，必须先确认：
- [ ] `smartdine-admin/.env.local` 存在且 `VITE_API_BASE_URL` 有值
- [ ] `curl http://127.0.0.1:3000/admin/faq` 带正确 key 返回 200
- [ ] API 的 `CORS_ORIGINS` 包含 Admin 开发端口（默认 5174）

### 3.1 初始化 Admin 项目
- [ ] Vue 3 + Vite + JavaScript
- [ ] 集成 Ant Design Vue
- [ ] `.env.example` 和 `.env.local`

### 3.2 登录页（最小实现）
- [ ] 单账号：`admin / admin123`（V1 临时方案）
- [ ] 登录成功跳转 FAQ 列表页
- [ ] 不做注册 / 不做 JWT / 不做多账号

### 3.3 FAQ 列表页
- [ ] 展示 `question / tags / answer`
- [ ] 支持按关键字搜索
- [ ] 提供新增 / 编辑 / 删除入口

### 3.4 FAQ 新增 / 编辑
- [ ] 字段：`id / question / answer / tags`
- [ ] `tags` 支持逗号分隔
- [ ] 保存后刷新列表

### 3.5 FAQ 删除
- [ ] 删除前二次确认
- [ ] 删除成功后刷新列表

### 3.6 热加载验证
- [ ] 后台修改 FAQ → H5 重新提问 → 新内容已生效
- [ ] 无需重启 API 服务

---

## Phase 4：联调验收部署 ⏳

> 验收标准：公网可访问，链路跑通，可演示。

### 4.1 联调验收清单
- [ ] 顾客输入问题 5 秒内返回答案
- [ ] FAQ 命中时 `matched` 不为 null
- [ ] FAQ 未命中时 `matched` 为 null
- [ ] 空输入返回 400
- [ ] 错误 API Key 返回 401
- [ ] FAQ 修改后无需重启立即生效
- [ ] H5 顶部展示餐厅名称
- [ ] Admin 可正常增删改 FAQ

### 4.2 FAQ 数据准备
- [ ] 整理 15~30 条 LG 食堂高频 FAQ 录入 `faq.json`
- [ ] 补上客服兜底话术

### 4.3 部署前强制检查
- [ ] `CORS_ORIGINS` 已改为生产域名（不含本地地址）
- [ ] `API_SECRET` 已改为高强度随机值
- [ ] 所有 `VITE_API_BASE_URL` 已指向生产 API
- [ ] `npm run build` 无报错
- [ ] `/health` 生产环境可访问

### 4.4 部署
- [ ] API → Railway（配置生产环境变量）
- [ ] H5 → Vercel 静态托管
- [ ] Admin → Vercel 静态托管
- [ ] 公网访问验证

---

## 7. 文档使用方式

**给 Codex / Claude Code 的标准引用方式：**

```
请严格按照 @smartdine-word/SmartDine_V1_开发执行顺序清单.md 推进当前 Phase 任务。
禁止实现 V2/V3 内容。每次只完成当前阶段，并返回代码、运行方式和验证结果。
```

---

> 这份清单的核心问题：**用户现在能不能在 H5 问一句话，拿到一个正确、可解释、可维护的回答？**  
> 只要这件事成立，V1 就是成功的。
