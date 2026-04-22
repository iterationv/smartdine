# SmartDine AGENTS.md

> 适用工具：Claude Code · Codex · Cursor
> 核心原则：按阶段 · 按边界 · 先验证环境再写代码 · 遇阻塞先分类再排查

---

## 0. 文档读取策略

**默认只读 3 类，按需补读，不默认全量读取。**

### 0.1 每次启动必读（固定，不可省）

1. `@CLAUDE.md` — 项目结构、当前阶段、目录总览
2. `@GIT_RULES_CLAUDE.md` — Claude/Codex 的 Git 行为边界与提交规范

> `@GIT_RULES.md` 只在需要查通用 Git 规范时补读，不默认读。

### 0.2 当前任务清单（二选一，按实际任务读）

| 当前任务 | 读取 |
|----------|------|
| P1 代码执行 | `@smartdine-word/SmartDine_V1.1_P1_Codex开发执行任务清单.md` |
| P0 任务执行 | `@smartdine-word/SmartDine_V1.1_P0_Codex开发执行任务清单.md` |

> 默认到这里就停，不继续扩读。

### 0.3 按场景补读（触发才读）

| 触发条件 | 补读文件 | 原因 |
|----------|----------|------|
| 涉及启动、端口、联调、环境变量、数据隔离 | `@README.md` | 端口与双环境口径以 README 为准 |
| 出现规则冲突、阶段边界不清、执行包边界判断 | `@AGENTS.md` 对应章节 | 确认执行规则与阻塞口径 |
| 需要提交代码、起草 commit、判断是否 PR | `@GIT_RULES.md` | 通用 Git 规范 |
| 需要判断"这个需求是否属于当前阶段" | `@AGENTS.md` 第 2～3 节 | 确认阶段边界与禁止范围 |
| 不清楚某任务是否已完成或全局任务归属 | `@smartdine-word/SmartDine_V1.1_任务清单.md` | 全局任务地图 |
| 需要理解产品目标或 P1 拆包逻辑 | `@smartdine-word/SmartDine_V1.1_规划文档.md` | 只在方向讨论时读 |

### 0.4 禁止默认读取

以下文件**每次 session 不得默认重读**，仅在上表触发条件满足时才读：

- `@smartdine-word/SmartDine_V1.1_规划文档.md`
- `@smartdine-word/SmartDine_V1.1_任务清单.md`
- `@README.md`
- `@GIT_RULES.md`
- `@AGENTS.md`（当前文件本身，除非规则冲突时主动查）

### 0.5 文件不存在时

文档不存在 → 停止，告知用户，不得自行脑补继续。

---

## 1. 项目结构

### 1.1 当前实际结构

```text
smartdine/
├── .claude/
│   └── worktrees/
├── smartdine-admin/
│   ├── src/
│   │   ├── api/
│   │   ├── router/
│   │   ├── stores/
│   │   ├── utils/
│   │   ├── views/
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── .env.ai / .env.local / .env.example
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── smartdine-api/
│   ├── src/
│   │   ├── ai/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── config.ts
│   │   ├── faq.ts
│   │   ├── index.ts
│   │   └── llm.ts
│   ├── .env / .env.ai / .env.example
│   ├── package.json
│   └── tsconfig.json
├── smartdine-h5/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── views/
│   │   ├── App.vue
│   │   └── main.js
│   ├── .env.ai / .env.local / .env.example
│   ├── package.json
│   ├── README.md
│   └── vite.config.ts
├── smartdine-word/
│   ├── archive/
│   ├── SmartDine_V1.1_P0_Codex开发执行任务清单.md
│   ├── SmartDine_V1.1_P1_Codex开发执行任务清单.md
│   ├── SmartDine_V1.1_P1_文档级任务清单.md
│   ├── SmartDine_V1.1_规划文档.md
│   ├── SmartDine_V1.1_任务清单.md
│   ├── SmartDine_V1_指令包复盘与阻塞处理规范.md
│   └── SmartDine项目规划文档.md
├── test-results/
├── .curl-chat.cfg
├── .curl-chat.json
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── GIT_RULES.md
├── GIT_RULES_CLAUDE.md
└── README.md
```

### 1.2 结构使用约定

- 根目录没有 `package.json`，**不能在根目录执行 `npm run dev` / `npm run dev:ai`**
- 三端必须分别进入各自目录启动
- `.claude/worktrees/` 是 Claude Code 的工作目录，不代表主分支代码目录
- `dist/`、`node_modules/`、`test-results/` 在本地可能已存在，但**不得仅凭其存在就默认构建成功或服务可用**
- 运行状态、服务可用性、端口监听必须通过实际命令确认

---

## 2. 当前开发阶段

```text
V1   Phase 1 后端核心能力    ✅ 完成
V1   Phase 2 H5 基础页面    ✅ 完成
V1   Phase 3 Admin 基础     ✅ 完成
V1   Phase 4 联调验收部署    ✅ 完成
─────────────────────────────────────
V1.1 P0 产品骨架建设        ✅ 完成（已验收）
V1.1 P1 产品骨架完善        ⏳ 进行中（当前阶段）
     ├─ 执行包 A：后端检索增强
     ├─ 执行包 B：Admin 运营闭环
     └─ 执行包 C：H5 场景优化
V1.1 P2 深化方向            📋 预留，不进入当前交付
```

**只做当前 Phase 的事，不跨阶段。** 跨阶段需求 → 说明后等用户确认。

---

## 3. V1.1 范围边界

### 3.1 已完成范围（P0，已验收）

- 知识条目结构升级（替代原 FAQ）
- 基础命中能力（关键词 + 同义词）
- 问题日志 + 未命中记录
- Admin 知识管理页 + 未命中页
- H5 基础产品化（推荐问题、回答卡片、状态优化）
- Pinia 引入 + 基础状态收敛
- 后端基础分层（route / service / ai / data）

### 3.2 当前阶段范围（P1）

#### 执行包 A（纯后端）
- Query Rewrite：未命中时对原始 query 改写后重试
- BM25 / 混合检索并入现有 retrieve 链路
- Rerank：对检索结果重排序
- 向量检索函数签名预留（只定义接口，不实现）
- 工程清理：`questionLogs.json` / `missedQuestions.json` 移出 git tracking

#### 执行包 B（Admin）
- Dashboard 趋势图增强
- 未命中转知识条目真实实现
- `missedQuestions` 增加 `handled` 字段
- 依赖执行包 A 完成

#### 执行包 C（H5）
- 推荐问题接口化
- 快捷分类 Tab
- 相关推荐
- 结果页跳转预留
- 可与执行包 B 并行

### 3.3 禁止在 V1.1 实现

- RAG 真正落地 / 向量库接入 / embedding 实装
- 多轮对话上下文记忆
- 用户注册 / 多账号 / 多租户
- 个性化推荐 / 营养分析
- 主后端语言迁移（Java）
- 技术栈重构
- 未经确认的大范围目录重组

---

## 4. 技术约束

| 端 | 约束 |
|----|------|
| H5 | Vue 3 + Vite + JavaScript（禁止 TypeScript）· 引入 Pinia · 禁止 axios / UI 框架 |
| API | Node.js + Hono + TypeScript · env 全部走 `config.ts` · 禁止硬编码密钥 |
| Admin | Vue 3 + Ant Design Vue · 引入 Pinia |
| 文档 | 规划、任务清单、规范文件统一放 `smartdine-word/` 或根目录规范文件，不混入业务源码目录 |

禁止：
- H5 出现 `<script setup lang="ts">`
- API 新路由未挂 `authMiddleware`
- 未经确认直接新增依赖
- 未经确认修改主契约结构

---

## 5. 接口契约（破坏性变更须告知用户）

### POST /chat

```text
Header: x-api-key: <API_SECRET>
Body:   { "question": "..." }
返回（命中）：  { "answer": "...", "source": "knowledge|faq", "matched": { "id": "...", "title": "..." } }
返回（未命中）：{ "answer": "...", "source": "ai_fallback", "matched": null }
```

### 知识条目结构（V1.1）

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

### 未命中回退策略（当前默认行为）

命中失败时：先返回 AI 兜底回答，同时入库未命中记录。  
回答前缀统一为：

```text
这个问题暂时没有找到准确答案，以下仅供参考：
```

### P1 允许的非破坏性扩展

- 检索链路内部新增 `rewrite / bm25 / rerank` 等中间能力
- `POST /chat` 返回体允许**追加可选字段**，但不得破坏现有字段含义
- 新增 Admin / 日志 / 推荐问题类接口时，必须保持现有链路兼容

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
- AI 自动测试 / Codex 验收 / 分步开发验证：默认 AI 测试环境
- 禁止混用端口口径
- 涉及真实知识 / 日志写入验证时，优先使用 AI 测试环境，避免污染默认数据

### 6.4 额外说明
- 根目录不能直接执行 `npm run dev` 或 `npm run dev:ai`
- 三端必须分别进入各自目录启动
- 启动前统一使用 `127.0.0.1`
- `.env.ai` 属于受保护文件，只允许读取验证，不允许擅自修改

---

## 7. 任务开始前检查（每次必做）

先判断本任务运行环境：

- 若用户、README、当前任务说明已明确指定环境 → 以指定环境为准
- 若任务属于 AI 自动测试 / 验收 / Codex 分步开发验证 → 默认 AI 测试环境
- 若只是日常人工开发调试 → 默认开发环境

### 7.1 通用必查

```bash
# 固定必读（每次）
ls CLAUDE.md
ls GIT_RULES_CLAUDE.md

# 按当前任务读其中一个
ls smartdine-word/SmartDine_V1.1_P1_Codex开发执行任务清单.md   # P1 执行任务
ls smartdine-word/SmartDine_V1.1_P0_Codex开发执行任务清单.md   # P0 执行任务

# 按触发条件补读（不默认执行）
# ls GIT_RULES.md                                              # 需要查通用 Git 规范时
# ls README.md                                                 # 涉及启动、联调、端口、数据隔离时
# ls smartdine-word/SmartDine_V1.1_任务清单.md                 # 全局任务归属不清时
# ls smartdine-word/SmartDine_V1.1_规划文档.md                 # 产品目标/方向讨论时
```

### 7.2 开发环境检查

```bash
# 1. 环境文件
ls smartdine-api/.env && ls smartdine-h5/.env.local && ls smartdine-admin/.env.local

# 2. 服务存活
curl http://127.0.0.1:3000/health

# 3. 接口连通
curl -X POST http://127.0.0.1:3000/chat   -H "Content-Type: application/json"   -H "x-api-key: $API_SECRET"   -d '{"question":"测试"}'

# 4. CORS（H5 联调时）
curl -X OPTIONS http://127.0.0.1:3000/chat   -H "Origin: http://127.0.0.1:5173"   -H "Access-Control-Request-Method: POST" -v
```

### 7.3 AI 测试环境检查

```bash
# 1. 环境文件
ls smartdine-api/.env.ai && ls smartdine-h5/.env.ai && ls smartdine-admin/.env.ai

# 2. 服务存活
curl http://127.0.0.1:3300/health

# 3. 接口连通
curl -X POST http://127.0.0.1:3300/chat   -H "Content-Type: application/json"   -H "x-api-key: $API_SECRET"   -d '{"question":"测试"}'

# 4. CORS（H5 联调时）
curl -X OPTIONS http://127.0.0.1:3300/chat   -H "Origin: http://127.0.0.1:5273"   -H "Access-Control-Request-Method: POST" -v
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
阻塞分类：H5前端 / API后端 / Admin前端 / 环境变量 / CORS / 工具链 / 任务边界 / Git规范
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
| `matched` 永远 null | 知识条目关键词未覆盖，先查 knowledge 数据与检索逻辑 |
| `import.meta.env.VITE_*` 是 undefined | 对应环境文件不存在 或 dev server 未重启 |
| 新路由 401 但 key 正确 | 忘记挂 `authMiddleware` |
| 明明已启动但健康检查失败 | 先核对当前是开发环境还是 AI 测试环境，再核对端口 |
| 命令行中文请求体异常 | 先排查终端编码，不要直接判断接口或 AI 返回异常 |

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
| `tsconfig.json` / `vite.config.ts` / `vite.config.js` | 需明确授权 |
| 规范文件以外的历史归档文档 | 未经确认不做批量整理 |

---

## 10. 代码修改规则

- 只改本次任务相关文件，不做“顺手优化”
- H5 `import.meta.env.VITE_*` 必须写回退默认值
- API 新增路由必须检查是否挂 `authMiddleware`
- 不留 `console.log` 调试残留（`console.error` 保留）
- 新增依赖前告知用户，等待确认
- 新增环境变量前先说明影响，再同步 `.env.example` 与读取逻辑
- 文档任务不得顺手修改业务代码；业务任务不得顺手重写规范文档
- 非当前执行包范围的代码问题，先记录，不顺带修

### 10.1 任务颗粒度规则

默认目标：每一步尽量有效、低耦合、少错、便于复盘。

可合并执行：
- 同层、低耦合、无联调风险的纯新建 / 纯实现任务
- 同一文件内的连续小逻辑
- 同一闭环内的最小验证动作（如编译检查 + 手动函数验证 + 回归检查）

必须拆开执行：
- 涉及 route / service / data / ai 分层边界的任务
- 涉及鉴权、参数校验、路由注册的任务
- 涉及环境切换、联调、CORS、回归验证的任务
- 涉及用户可见行为变化或接口契约风险的任务
- 涉及执行包 A / B / C 边界的任务

若不确定：
- 优先拆开，不要为了省步骤而扩大风险

---

## 11. Claude / Codex / Cursor 协作规则

### Claude Code
- 用于：项目规范、任务清单、文档梳理、方案收敛、Git 规则约束
- 不默认承担：全仓扫描 + 启动三端 + 改代码 + 回归 + Git 提交全流程一体化任务
- 新 session 优先读 `CLAUDE.md`，不要重复要求读完整仓库

### Codex
- 用于：按执行包改代码、联调、构造最小验证链路、收口执行
- 默认输入是执行级任务清单，不是抽象规划文档
- 一个执行包可拆多个 thread，但最终按包收口

### Cursor
- 用于：人工协同审查、局部改写、补充验证
- 不作为规范源头，以根目录文档为准

---

## 12. 提交自查

- [ ] 引入新依赖？→ 已告知用户
- [ ] 修改接口契约？→ 已告知用户
- [ ] 新增环境变量？→ 已同步 `.env.example`
- [ ] H5 `import.meta.env` 有默认值？
- [ ] API 新路由挂了 `authMiddleware`？
- [ ] 修改了禁止修改的文件？
- [ ] 本轮使用的环境口径（开发 / AI 测试）是否与验证命令一致？
- [ ] 提交前已执行 `git status --short`？
- [ ] 运行时文件、`dist`、测试产物未进入 commit？
- [ ] 当前 commit 是否只做一类事？

---

## 13. 任务收口格式

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

## 14. 执行优先级

1. 用户当前明确指令（最高；与文档冲突时执行，但必须指出冲突）
2. 当前任务明确指定的运行环境 / 端口 / 启动命令
3. `README.md`（启动、端口、双环境、数据隔离）
4. `CLAUDE.md`
5. `GIT_RULES.md`
6. `GIT_RULES_CLAUDE.md`
7. 本文件（AGENTS.md）
8. `SmartDine_V1.1_P1_Codex开发执行任务清单.md`
9. `SmartDine_V1.1_P0_Codex开发执行任务清单.md`
10. `SmartDine_V1.1_任务清单.md`（仅按需读取时有效）
11. `SmartDine_V1.1_规划文档.md`（仅按需读取时有效）
12. AI 默认行为

---

## 15. Windows 本地约定

- 启动后用 `netstat -ano | findstr :端口` 确认监听
- 推荐前台启动，日志直接可见
- 清理进程：`taskkill /PID <pid> /F`
- 浏览器临时 profile 目录不得放在项目目录内
- 验收默认使用 Chrome，找不到时停止报告
- PowerShell / bash 中文请求体验证如有编码噪音，允许使用 UTF-8 文件、`curl --data-binary` 或等价的 Unicode 转义 JSON 做接口验证
- Windows 终端显示乱码 ≠ 接口一定有问题，必须结合实际响应文件内容和浏览器链路判断

---

## 16. SmartDine 指令包执行与验收补充规则

### 16.1 执行包与提交粒度

- 用户明确要求“执行包 / 功能包”时，默认按整包闭环推进，不按单文件细步默认拆开
- 整包闭环指：读文档与环境检查 → 连续修改相关文件 → build / 联调 / 回归 → 清理运行期副产物 → 输出变更总结 → 最后一次性提交
- 执行粒度和提交粒度必须分离：中间允许多次 build、联调、修正，但默认只在整包验收通过后 commit
- 临时兼容、调试探针、联调补丁不单独形成 commit，除非用户明确要求拆包

### 16.2 验收前置确认

- 验收前先确认真实页面路由、接口路由、前缀、端口、鉴权方式，不默认假设 `/api/` 或其他前缀
- 错误态、空态、未命中态、无数据态这类“非自然发生”的验收项，如果任务说明未给出构造方式，应先补足最小构造方案再执行
- 跨任务回归或总体验收时，要明确区分：本轮直接验证、通过链路侧面确认、以及本轮未覆盖项

### 16.3 联调阻塞判定

- 浏览器失败但命令行成功时，优先判定为 CORS / Origin / 预检 / 前端鉴权 / 路由前缀问题，不要直接认定业务失败
- 命令行失败但服务曾启动成功时，先复查端口监听、进程存活、当前环境口径、请求 Header，再判断代码问题
- 前端联调类任务默认同时考虑浏览器验收和命令行验收，不能只用其中一种结果下结论
- Windows 中文请求体验证优先使用 UTF-8 文件、`curl --data-binary` 或等价的 Unicode 转义 JSON，避免把编码噪音误判为接口问题

### 16.4 请求层与临时兼容收口

- 新旧链路切换期间允许最小临时兼容，但必须在后续最近一个收口包中移除，不能长期保留
- 前端 store 或页面不得长期绕过统一 API 封装直连后端；契约字段归一化应收敛在 API 层或服务层
- 如果本轮为了联调引入桥接逻辑，输出中必须明确标注其是否已收口；未收口时不得直接表述为“完全闭环”

### 16.5 运行期文件与提交清理

- build、联调、真实接口样本生成完成后，提交前默认执行 `git status --short`
- 运行期日志、`dist`、临时样本文件默认不进 commit；提交前先恢复到 `HEAD`
- 如果需要制造样本数据，只能通过真实接口调用产生，不能手工修改运行期 JSON 数据文件
- `questionLogs.json` / `missedQuestions.json` 在 P1 执行包 A 收口前，按过渡期规则恢复；收口时移出 git tracking 并更新 `.gitignore`

### 16.6 遗留问题收口顺序

- 一个执行包验收后如果发现已知遗留，优先先做收口包，再进入下一大包
- 收口包只做去临时兼容、补联调闭环、补验收口径和清理规则，不顺手叠加无关新功能

### 16.7 文档与执行分层

- 文档级任务清单用于审查与对齐，不直接投喂执行工具
- Codex 执行必须以执行级任务清单为准
- 文档级与执行级不一致时，先修正文档，再执行代码任务

---

## 最终提醒

> **按文档 · 按阶段 · 按当前步骤 · 按最小闭环推进。**
