# SmartDine AGENTS.md

> 适用工具：Claude Code · Codex · Cursor
> 核心原则：按阶段 · 按边界 · 先验证环境再写代码 · 遇阻塞先分类再排查

---

## 0. 启动必读

每次任务开始前，按顺序读取：

1. `@smartdine-word/SmartDine_V1.1_规划文档.md`
2. `@smartdine-word/SmartDine_V1.1_任务清单.md`
3. `@smartdine-word/SmartDine_V1.1_P0_详细任务清单_Spec模板.md`（如当前任务属于 V1.1 P0）
4. `@README.md`（如任务涉及启动、联调、环境、端口、FAQ 数据隔离）

文档不存在 → 停止，告知用户，不得自行脑补继续。

---

## 1. 项目结构

### 1.1 当前已存在结构

```text
smartdine/
├── AGENTS.md
├── README.md
├── smartdine-word/
│   ├── SmartDine_V1.1_规划文档.md
│   ├── SmartDine_V1.1_任务清单.md
│   └── SmartDine_V1.1_P0_详细任务清单_Spec模板.md
├── smartdine-api/
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── faq.ts
│       ├── llm.ts
│       ├── data/
│       └── middleware/
├── smartdine-admin/
└── smartdine-h5/
    └── src/
        ├── views/
        └── api/chat.js
```

### 1.2 V1.1 P0 目标结构

> 以下目录和文件会在 V1.1 P0 中逐步形成，不代表当前已经全部存在。

```text
smartdine-api/src/
├── routes/
├── services/
├── data/
├── ai/
└── types/

smartdine-admin/src/
└── stores/

smartdine-h5/src/
└── stores/
```

不要因为目标结构里出现某个目录，就默认仓库里已经存在。

---

## 2. 当前开发阶段

```text
V1   Phase 1 后端核心能力    ✅ 完成
V1   Phase 2 H5 基础页面    ✅ 完成
V1   Phase 3 Admin 基础     ✅ 完成
V1   Phase 4 联调验收部署    ✅ 完成
─────────────────────────────────────
V1.1 P0 产品骨架建设        ⏳ 进行中（当前阶段）
V1.1 P1 产品骨架完善        ⏸ 待 P0 验收后开始
V1.1 P2 深化方向            📋 预留，不进入当前交付
```

**只做当前 Phase 的事，不跨阶段。** 跨阶段需求 → 说明后等用户确认。

---

## 3. V1.1 范围边界

### 当前阶段（P0）核心任务
- 知识条目结构升级（替代原 FAQ）
- 基础命中能力（关键词 + 同义词）
- 问题日志 + 未命中记录
- Admin 知识管理页 + 未命中页
- H5 基础产品化（推荐问题、回答卡片、状态优化）
- Pinia 引入 + 基础状态收敛
- 后端基础分层（route / service / ai / data）

### 禁止在 V1.1 实现
- RAG / 向量检索 / 语义匹配
- 多轮对话上下文记忆
- 用户注册 / 多账号 / 多租户
- 个性化推荐 / 营养分析
- 主后端语言迁移（Java）
- 技术栈重构

---

## 4. 技术约束

| 端 | 约束 |
|----|------|
| H5 | Vue 3 + Vite + JavaScript（禁止 TypeScript）· 引入 Pinia · 禁止 axios / UI 框架 |
| API | Node.js + Hono + TypeScript · env 全部走 config.ts · 禁止硬编码密钥 |
| Admin | Vue 3 + Ant Design Vue · 引入 Pinia |

禁止：`<script setup lang="ts">`（H5）· 新路由未挂 `authMiddleware`

---

## 5. 接口契约（破坏性变更须告知用户）

### POST /chat
```text
Header: x-api-key: <API_SECRET>
Body:   { "question": "..." }
返回（命中）：  { "answer": "...", "source": "knowledge|faq", "matched": { "id": "...", "title": "..." } }
返回（未命中）：{ "answer": "...", "source": "ai_fallback", "matched": null }
```

### 知识条目结构（V1.1 升级）
```json
{
  "id": "k_001",
  "title": "...",
  "question": "...",
  "answer": "...",
  "aliases": ["..."],
  "tags": ["..."],
  "status": "active|inactive",
  "updatedAt": "ISO8601"
}
```

### 未命中回退策略（默认行为）
命中失败时：先返回 AI 兜底回答，同时入库未命中记录。
回答前缀统一为：`这个问题暂时没有找到准确答案，以下仅供参考：`

---

## 6. 环境变量与运行环境规范

### 6.1 开发环境
- API：`smartdine-api/.env` → `npm run dev` → `3000`
- Admin：`smartdine-admin/.env.local` → `npm run dev` → `5174`
- H5：`smartdine-h5/.env.local` → `npm run dev` → `5173`

### 6.2 AI 测试环境
- API：`smartdine-api/.env.ai` → `npm run dev:ai` → `3300`
- Admin：`smartdine-admin/.env.ai` → `npm run dev:ai` → `5274`
- H5：`smartdine-h5/.env.ai` → `npm run dev:ai` → `5273`

### 6.3 默认规则
- 纯本地开发调试：默认开发环境
- AI 自动测试 / Codex 验收 / P0 分步开发验证：默认 AI 测试环境
- 禁止混用端口口径
- 涉及 FAQ 写入验证时，优先使用 AI 测试环境，避免污染 `smartdine-api/src/data/faq.json`

### 6.4 额外说明
- 根目录没有 `package.json`，不能在根目录直接执行 `npm run dev` 或 `npm run dev:ai`
- 三端必须分别进入各自目录启动
- 启动前统一使用 `127.0.0.1`

---

## 7. 任务开始前检查（每次必做）

先判断本任务运行环境：

- 若用户、README、当前任务说明已明确指定环境 → 以指定环境为准
- 若任务属于 AI 自动测试 / 验收 / Codex 分步开发验证 → 默认 AI 测试环境
- 若只是日常人工开发调试 → 默认开发环境

### 7.1 通用必查

```bash
# 必读文档
ls smartdine-word/SmartDine_V1.1_规划文档.md
ls smartdine-word/SmartDine_V1.1_任务清单.md

# 如当前任务属于 V1.1 P0
ls smartdine-word/SmartDine_V1.1_P0_详细任务清单_Spec模板.md

# 如任务涉及启动、联调、端口、FAQ 隔离
ls README.md
```

### 7.2 开发环境检查

```bash
# 1. 环境文件
ls smartdine-api/.env && ls smartdine-h5/.env.local

# 2. 服务存活
curl http://127.0.0.1:3000/health

# 3. 接口连通
curl -X POST http://127.0.0.1:3000/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_SECRET" \
  -d '{"question":"测试"}'

# 4. CORS（H5 联调时）
curl -X OPTIONS http://127.0.0.1:3000/chat \
  -H "Origin: http://127.0.0.1:5173" \
  -H "Access-Control-Request-Method: POST" -v
```

### 7.3 AI 测试环境检查

```bash
# 1. 环境文件
ls smartdine-api/.env.ai

# 2. 服务存活
curl http://127.0.0.1:3300/health

# 3. 接口连通
curl -X POST http://127.0.0.1:3300/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_SECRET" \
  -d '{"question":"测试"}'

# 4. CORS（H5 联调时）
curl -X OPTIONS http://127.0.0.1:3300/chat \
  -H "Origin: http://127.0.0.1:5273" \
  -H "Access-Control-Request-Method: POST" -v
```

### 7.4 覆盖规则
- 如果 AGENTS 的通用检查口径，与 README 或当前任务已明确指定的运行环境冲突：
  - 以**当前任务明确环境**为准
  - 其次以 **README** 为准
  - 不得继续套用旧端口或旧环境口径

任一步骤失败 → 停止，报告用户，不得绕过继续。

---

## 8. 阻塞处理

遇阻塞必须先输出：

```text
阻塞分类：H5前端 / API后端 / Admin前端 / 环境变量 / CORS / 工具链 / 任务边界
当前现象：
已确认事实：
最可能根因：
下一步最小验证动作：
```

**同一路径最多尝试 2 次，失败后必须切换排查层级。**

常见症状速查：

| 现象 | 优先排查 |
|------|---------|
| 401 | `x-api-key` 未带 或 `VITE_API_SECRET ≠ API_SECRET` |
| CORS 报错 | H5 端口不在 `CORS_ORIGINS` |
| `matched` 永远 null | 知识条目关键词未覆盖，查 knowledge 数据 |
| `import.meta.env.VITE_*` 是 undefined | 对应环境文件不存在 或 dev server 未重启 |
| 新路由 401 但 key 正确 | 忘记挂 `authMiddleware` |
| 明明已启动但健康检查失败 | 先核对当前是开发环境还是 AI 测试环境，再核对端口 |

---

## 9. 禁止修改的文件

| 文件 | 原因 |
|------|------|
| `smartdine-api/.env` | 密钥 |
| `smartdine-api/.env.ai` | 密钥 |
| `smartdine-h5/.env.local` | 密钥 |
| `smartdine-h5/.env.ai` | 密钥 |
| `smartdine-admin/.env.local` | 密钥 |
| `smartdine-admin/.env.ai` | 密钥 |
| `smartdine-api/src/data/faq.json` | 生产数据，只通过接口修改 |
| 任意 `package.json` dependencies | 需明确授权 |
| `tsconfig.json` / `vite.config.ts` | 需明确授权 |

---

## 10. 代码修改规则

- 只改本次任务相关文件，不做“顺手优化”
- H5 `import.meta.env.VITE_*` 必须写回退默认值
- API 新增路由必须检查是否挂 `authMiddleware`
- 不留 `console.log` 调试残留（`console.error` 保留）
- 新增依赖前告知用户，等待确认
- 新增环境变量前先说明影响，再同步 `.env.example` 与读取逻辑

### 10.1 任务颗粒度规则

默认目标：每一步尽量有效、低耦合、少错、便于复盘。

可合并执行：
- 同层、低耦合、无联调风险的纯新建/纯实现任务
- 同一文件内的连续小逻辑
- 同一闭环内的最小验证动作（如编译检查 + 手动函数验证 + 回归检查）

必须拆开执行：
- 涉及 route / service / data / ai 分层边界的任务
- 涉及鉴权、参数校验、路由注册的任务
- 涉及环境切换、联调、CORS、回归验证的任务
- 涉及用户可见行为变化或接口契约风险的任务

若不确定：
- 优先拆开，不要为了省步骤而扩大风险

---

## 11. 提交自查

- [ ] 引入新依赖？→ 已告知用户
- [ ] 修改接口契约？→ 已告知用户
- [ ] 新增环境变量？→ 已同步 `.env.example`
- [ ] H5 `import.meta.env` 有默认值？
- [ ] API 新路由挂了 `authMiddleware`？
- [ ] 修改了禁止修改的文件？
- [ ] 本轮使用的环境口径（开发 / AI 测试）是否与验证命令一致？

---

## 12. 任务收口格式

```text
### 本次改动
- 修改文件：
- 改动原因：
- 受影响但未改动：

### 系统状态
- API：端口 / 是否需重启 / 有无破坏性改动
- H5：是否需重建 / env 有无新增
- Admin：（如涉及）

### 验证结果
- 验证命令：
- 验证结论：

### 遗留问题
- 已知未修复：
- 下一步建议：
```

---

## 13. 执行优先级

1. 用户当前明确指令（最高；与文档冲突时执行，但必须指出冲突）
2. 当前任务明确指定的运行环境 / 端口 / 启动命令
3. `README.md`（启动、端口、双环境、FAQ 数据隔离）
4. 本文件（AGENTS.md）
5. `SmartDine_V1.1_P0_详细任务清单_Spec模板.md`
6. `SmartDine_V1.1_任务清单.md`
7. `SmartDine_V1.1_规划文档.md`
8. AI 默认行为

---

## 14. Windows 本地约定

- 启动后用 `netstat -ano | findstr :端口` 确认监听
- 推荐前台启动，日志直接可见
- 清理进程：`taskkill /PID <pid> /F`
- 浏览器临时 profile 目录不得放在项目目录内
- 验收默认使用 Chrome，找不到时停止报告
- PowerShell 中文请求体如有编码噪音，允许使用等价的 Unicode 转义 JSON 做接口验证

---

## 最终提醒

> **按文档 · 按阶段 · 按当前步骤 · 按最小闭环推进。**
