# SmartDine AGENTS.md

> 适用工具：Codex · Claude Code · Cursor  
> 核心原则：按阶段、按边界、先验证环境再写代码、遇阻塞先分类再排查。

---

## 0. 启动时必读文档

每次任务开始前，必须先读取以下两份文档，再判断当前任务的 Phase 和边界：

```
@smartdine-word/SmartDine_V1_开发执行顺序清单.md
@smartdine-word/SmartDine项目规划文档.md
```

> Claude Code 用户：直接用 `@` 引用路径。  
> Codex 用户：文件在项目根目录下，读取方式同源码文件。

文档不存在 → 停止，告知用户，不得自行脑补继续开发。

---

## 1. 项目结构速览

```
smartdine/
├── AGENTS.md                          ← 本文件
├── smartdine-word/
│   ├── SmartDine_V1_开发执行顺序清单.md   ← Phase 执行依据（必读）
│   └── SmartDine项目规划文档.md           ← 产品边界和技术选型（必读）
├── smartdine-api/                     ← Node.js + Hono 后端
│   ├── src/
│   │   ├── index.ts                   ← 路由入口（含 authMiddleware 挂载）
│   │   ├── config.ts                  ← 所有 env 统一读取，业务代码禁止直接读 process.env
│   │   ├── faq.ts                     ← FAQ 内存缓存 + CRUD + 匹配
│   │   ├── llm.ts                     ← Kimi/OpenAI SDK 调用封装
│   │   ├── middleware/auth.ts          ← x-api-key 校验
│   │   └── middleware/cors.ts          ← CORS，读 CORS_ORIGINS
│   ├── .env                           ← 本地密钥，禁止 AI 修改
│   └── .env.example                   ← 新增变量时同步更新
└── smartdine-h5/                      ← Vue 3 + Vite H5
    ├── src/
    │   ├── views/Chat.vue             ← 主页面，含品牌区 + 消息状态管理
    │   ├── components/MessageList.vue
    │   ├── components/InputBar.vue
    │   └── api/chat.js                ← postChat() 封装，含 x-api-key 注入
    ├── .env.local                     ← 本地变量，禁止 AI 修改
    └── .env.example                   ← 新增变量时同步更新
```

---

## 2. 开发阶段与当前状态

```
Phase 1：后端核心能力    ✅ 已完成
Phase 2：C 端 H5        ✅ 已完成（含品牌区 / FAQ-AI 标签 / 移动端适配）
Phase 3：B 端 Admin     ⏳ 待开始
Phase 4：联调验收部署    ⏳ 待开始
```

**规则：只做当前 Phase 的事，不跨阶段，不"顺手"实现下一 Phase 的功能。**  
跨 Phase 的任务：先说明，等用户确认，再执行。

---

## 3. V1 范围边界（禁止实现）

以下内容不属于 V1，收到相关需求时必须指出并拒绝实现：

- RAG / 向量检索 / 语义匹配算法
- 多轮对话上下文记忆
- 问答历史记录 / 数据统计报表
- 点赞 / 踩反馈体系
- 用户注册 / 多账号 / 多租户
- 微信小程序正式版
- 复杂鉴权升级 / 非必要数据库切换

---

## 4. 技术约束（不可违反）

| 端 | 约束 |
|----|------|
| H5 | Vue 3 + Vite，用 JavaScript（不用 TypeScript），不引入 Router / Pinia / axios / UI框架 |
| API | Node.js + Hono + TypeScript，密钥全部走 config.ts 读取，禁止硬编码 |
| Admin | Vue 3 + Ant Design Vue，V1 只做 FAQ 最小管理，不做完整后台 |

**H5 禁止使用 `<script setup lang="ts">`。**  
**API 新增路由时必须检查是否需要挂 `authMiddleware`。**

---

## 5. 环境变量规范

### API（smartdine-api/.env）
```env
AI_PROVIDER=kimi
AI_API_KEY=...
AI_MODEL=moonshot-v1-8k
AI_BASE_URL=https://api.moonshot.cn/v1
API_SECRET=...
CORS_ORIGINS=http://127.0.0.1:5173,http://127.0.0.1:5174
PORT=3000
```

### H5（smartdine-h5/.env.local）
```env
VITE_API_BASE_URL=http://127.0.0.1:3000
VITE_API_SECRET=...       ← 必须与 API_SECRET 完全一致
VITE_RESTAURANT_NAME=LG食堂
VITE_RESTAURANT_LOGO=
```

**新增环境变量时必须同步：**
1. `.env.example`（加注释说明）
2. `config.ts` 或页面的 `import.meta.env.VITE_XXX`
3. `.env.local` / `.env`（否则本地静默失效，不报错）

---

## 6. 接口契约（不可随意修改）

任何修改以下契约的改动都是**破坏性变更**，必须提前告知用户并等待确认：

### POST /chat
```
请求头：x-api-key: <API_SECRET>
请求体：{ "question": "..." }
返回（命中）：{ "answer": "...", "matched": { "id": "...", "question": "..." } }
返回（未命中）：{ "answer": "...", "matched": null }
```

### FAQ 数据结构
```json
{ "id": "faq_001", "question": "...", "answer": "...", "tags": ["..."] }
```

---

## 7. 任务开始前强制检查（每次必做，不可跳过）

按顺序执行，任何一项不满足 → **停止，报告用户，不得临时绕过后继续**：

```bash
# 1. 环境文件存在性
ls smartdine-api/.env
ls smartdine-h5/.env.local          # 不存在则提示用户创建

# 2. API 服务存活
curl http://127.0.0.1:3000/health

# 3. 带鉴权的接口连通
curl -X POST http://127.0.0.1:3000/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_SECRET" \
  -d '{"question":"测试"}'

# 4. CORS 预检（H5 联调时）
curl -X OPTIONS http://127.0.0.1:3000/chat \
  -H "Origin: http://127.0.0.1:5173" \
  -H "Access-Control-Request-Method: POST" -v
# 检查返回头中 Access-Control-Allow-Origin 是否包含 H5 端口

# 5. 端口占用（Windows）
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

---

## 8. 多端联调阻塞处理

遇到任何阻塞，禁止只说"卡住了"。必须先输出：

```
- 阻塞分类：H5前端 / API后端 / 环境变量 / CORS / 工具链 / 任务边界
- 当前现象：
- 已确认事实：
- 未确认假设：
- 最可能根因：
- 下一步最小验证动作：
```

### 症状 → 根因速查

| 现象 | 优先排查 |
|------|---------|
| 页面显示"SmartDine 餐厅"而不是餐厅名 | `VITE_RESTAURANT_NAME` 未注入，检查 `.env.local` |
| 请求返回 401 | `x-api-key` 未带 或 `VITE_API_SECRET` ≠ `API_SECRET` |
| 浏览器 CORS 报错 | H5 端口不在 `CORS_ORIGINS`，检查 `smartdine-api/.env` |
| curl 通但浏览器不通 | 100% 是 CORS 问题，origin 不在白名单 |
| `matched` 永远是 `null` | FAQ 匹配未命中，检查 `faq.json` 关键词覆盖 |
| FAQ 修改后 H5 没生效 | `faq.json` 写入失败 或 缓存未刷新，查 API 日志 |
| Vite dev server 持续热更新 | 项目目录内有非源码文件被 watch（如浏览器 profile 目录） |
| `import.meta.env.VITE_*` 是 undefined | `.env.local` 不存在 或 变量名拼错 或 dev server 未重启 |
| 新路由返回 401 但 key 正确 | 新路由忘记挂 `authMiddleware`，检查 `index.ts` |

### 固定排查顺序

1. 确认任务边界（允许改哪些文件）
2. 确认环境文件和变量是否真实生效
3. 确认服务端口是否真实存活
4. 确认 CORS / 网络层
5. 最后才排查页面状态流和响应式逻辑

**同一路径最多连续尝试 2 次，失败后必须切换排查层级。**

---

## 9. Windows 本地环境约定

- 启动服务后用 `netstat -ano | findstr :端口` 确认端口真实监听
- 不使用 `Start-Process + 日志重定向` 方式启动服务（不稳定）
- 推荐前台启动，日志直接可见
- 清理进程：`taskkill /PID <pid> /F`
- 浏览器自动化的临时 profile 目录**不得放在项目目录内**（会触发 Vite watch）
- 浏览器验收默认使用 Chrome，找不到 Chrome 时停止报告，不自动 fallback 到 Edge

---

## 10. 禁止修改的文件

未经用户明确授权，以下文件禁止修改：

| 文件 | 原因 |
|------|------|
| `smartdine-api/.env` | 包含密钥 |
| `smartdine-h5/.env.local` | 包含密钥 |
| `smartdine-api/src/data/faq.json` | 生产数据，只能通过 API 接口修改 |
| 任意 `package.json` 的 `dependencies` | 依赖变更需明确授权 |
| `tsconfig.json` / `vite.config.ts` | 构建配置变更需明确授权 |

---

## 11. 破坏性变更识别

以下改动执行前必须说明影响并等待用户确认：

- 修改 `/chat` 返回结构中的字段名或类型
- 修改 `x-api-key` 鉴权机制
- 修改 CORS 逻辑
- 修改 FAQ 数据结构（`id / question / answer / tags`）
- 修改端口号
- 修改 `vite.config.ts`

---

## 12. 代码修改规则

- 只修改本次任务相关文件
- 不做"顺手优化"和"顺便重构"
- H5 的 `import.meta.env.VITE_*` 调用必须写回退默认值
- API 新增路由必须检查是否需要挂 `authMiddleware`
- 不留 `console.log` 调试残留（`console.error` 保留）
- 新增依赖前必须告知用户，等待确认

---

## 13. 代码改完自查清单

提交结果前必须自检：

- [ ] 是否引入新依赖？（是 → 是否已告知用户）
- [ ] 是否修改了接口契约？（是 → 是否已告知用户）
- [ ] 是否新增了环境变量？（是 → 是否已同步 `.env.example` 和 `.env.local`）
- [ ] H5 的 `import.meta.env` 调用有没有默认值？
- [ ] API 新增路由有没有挂 `authMiddleware`？
- [ ] 有没有把浏览器 profile 或临时文件放进项目目录？
- [ ] 有没有修改禁止修改的文件？

---

## 14. 任务收口格式（每次任务结束必须输出）

```
### 本次改动
- 修改文件：
- 改动原因：
- 未改动但受影响的文件：

### 当前系统状态
- API：端口 / 是否需要重启 / 有无破坏性改动
- H5：是否需要重新构建 / env 是否有新增变量
- Admin：（如涉及）

### 验证结果
- 验证命令：
- 验证结论：
- 验收路径类型：完整浏览器交互 / 接口+渲染组合（临时）

### 遗留问题
- 已知未修复：
- 已知绕过未永久修复：
- 下一步建议第一件事：
```

---

## 15. 执行优先级

1. 用户当前明确指令（最高；与文档冲突时执行用户指令，但必须指出冲突）
2. 本文件（AGENTS.md）
3. SmartDine_V1_开发执行顺序清单.md
4. SmartDine项目规划文档.md
5. AI 默认行为

---

## 16. 部署前强制检查

进入 Phase 4 时，以下各项必须全部确认后才可部署：

- [ ] `CORS_ORIGINS` 已改为生产域名（不再含本地地址）
- [ ] `API_SECRET` 已改为高强度随机值（不是 example 占位值）
- [ ] `faq.json` 已替换为真实 LG 食堂数据
- [ ] H5 的 `VITE_API_BASE_URL` 已指向生产 API 地址
- [ ] `/health` 接口在生产环境可访问
- [ ] H5 和 Admin 的生产构建（`npm run build`）无报错

---

## 17. 最终提醒

SmartDine V1 的核心目标：

> **最小可用、可演示、可联调、可部署的餐饮 FAQ 问答 MVP。**

所有执行围绕这条主线：**按文档 · 按阶段 · 按当前步骤 · 按最小闭环推进。**
