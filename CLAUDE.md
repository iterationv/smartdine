# SmartDine — CLAUDE.md

## 1. 项目简介

SmartDine 是一个餐厅 AI 问答系统，面向用户提供餐厅常见问题的智能解答。用户通过 H5 页面提问，后端匹配知识库并结合 AI 生成回答；Admin 端提供知识管理与未命中问题审核能力。

**目标：** V1 完成基础闭环 → V1.1 完成产品骨架建设（知识结构、日志、Admin 页面、H5 产品化）。

---

## 2. 规范文件

- 开发规范：[AGENTS.md](AGENTS.md)
- Git 规范：[GIT_RULES.md](GIT_RULES.md) + [GIT_RULES_CLAUDE.md](GIT_RULES_CLAUDE.md)（Claude Code 专项）

---

## 3. 技术栈

| 端 | 技术 | 说明 |
|----|------|------|
| **smartdine-api** | Node.js · Hono · TypeScript | 四层架构：Route → Service → AI Orchestration → Data Access |
| **smartdine-admin** | Vue 3 · Ant Design Vue · Pinia · JavaScript | 后台管理端，知识管理 / 未命中页 / 日志 |
| **smartdine-h5** | Vue 3 · Vite · **JavaScript（禁止 TypeScript）** · Pinia | 用户端 H5，禁止 axios 和 UI 框架 |

---

## 4. 目录结构

```text
smartdine/
├── AGENTS.md                  ← AI 协作规范（每次任务开始必读）
├── CLAUDE.md                  ← 本文件
├── GIT_RULES.md               ← Git 提交规范
├── GIT_RULES_CLAUDE.md        ← Claude Code Git 专项规范
├── README.md                  ← 启动说明 / 双环境 / FAQ 数据隔离
├── smartdine-word/            ← 规划文档、任务清单（不含业务代码）
│   ├── SmartDine项目规划文档.md
│   ├── SmartDine_V1.1_规划文档.md
│   ├── SmartDine_V1.1_任务清单.md
│   ├── SmartDine_V1.1_P0_Codex开发执行任务清单.md
│   ├── SmartDine_V1.1_P1_Codex开发执行任务清单.md
│   ├── SmartDine_V1.1_P1_文档级任务清单.md
│   ├── SmartDine_V1_Codex开发执行任务清单.md
│   ├── SmartDine_指令包复盘与阻塞处理规范.md
│   └── archive/               ← 已归档旧文档
│       ├── SmartDine_V1.1_P1_Codex开发执行任务清单(初稿）.md
│       ├── V1.1_AGENTS.md
│       ├── V1.2_AGENTS.md
│       ├── V1_AGENTS.md
│       ├── V1_Phase3_Admin_完成归档.md
│       └── V1_Phase4_生产化准备清单.md
├── smartdine-api/
│   └── src/
│       ├── index.ts           ← 入口 / 路由注册
│       ├── config.ts          ← 所有环境变量读取（唯一入口）
│       ├── routes/            ← 路由层（knowledge.ts / logs.ts）
│       ├── services/          ← 服务层（knowledgeService.ts / logService.ts）
│       ├── ai/                ← AI 编排层（matchKnowledge / generateAnswer / ...）
│       ├── data/              ← 数据访问层（knowledgeStore / logStore / *.json）
│       ├── middleware/        ← auth.ts / cors.ts
│       └── types/             ← knowledge.ts / log.ts
├── smartdine-admin/
│   └── src/
│       ├── views/             ← KnowledgeList / MissedList / Dashboard / Login / Faq/
│       ├── stores/            ← knowledgeStore.js / logStore.js（Pinia）
│       ├── api/               ← knowledge.js / logs.js / faq.js
│       ├── router/            ← index.js
│       └── utils/             ← auth.js
└── smartdine-h5/
    └── src/
        ├── views/             ← Chat.vue
        ├── components/        ← MessageList.vue / InputBar.vue
        ├── stores/            ← chatStore.js / suggestStore.js（Pinia）
        └── api/               ← chat.js
```

> 根目录无 `package.json`，**不能在根目录执行 npm 命令**，三端必须分别进入各自目录启动。

---

## 5. 本地启动命令

### 开发环境（日常调试）

```bash
# API — 端口 3000
cd smartdine-api && npm run dev

# H5 — 端口 5173
cd smartdine-h5 && npm run dev

# Admin — 端口 5174
cd smartdine-admin && npm run dev
```

### AI 测试环境（自动测试 / 验收 / Codex 分步验证）

```bash
# API — 端口 3300
cd smartdine-api && npm run dev:ai

# H5 — 端口 5273
cd smartdine-h5 && npm run dev:ai

# Admin — 端口 5274
cd smartdine-admin && npm run dev:ai
```

> 禁止混用两套环境的端口。AI 测试环境读取各端的 `.env.ai` 文件，避免污染生产数据。

### Claude Code 开发环境（dev:cc）

```bash
# API — 端口 3301
cd smartdine-api && npm run dev:cc

# H5 — 端口 5276
cd smartdine-h5 && npm run dev:cc

# Admin — 端口 5275
cd smartdine-admin && npm run dev:cc
```

> Claude Code 专用环境，读取各端 `.env.cc` 文件。端口独立于 dev（3000/5173/5174）和 dev:ai（3300/5273/5274），三套环境可同时运行不冲突。Codex / 其他 AI 使用 dev:ai；Claude Code 使用 dev:cc。

---

## 6. 当前开发进度

```text
V1   Phase 1 后端核心能力    ✅ 完成
V1   Phase 2 H5 基础页面    ✅ 完成
V1   Phase 3 Admin 基础     ✅ 完成
V1   Phase 4 联调验收部署    ✅ 完成
─────────────────────────────────────────────
V1.1 P0 产品骨架建设        ✅ 完成（已验收）
     ├─ 知识条目结构升级      ✅
     ├─ 基础命中（关键词+同义词）✅
     ├─ 问题日志 + 未命中记录  ✅
     ├─ Admin 知识管理页 + 未命中页 ✅
     ├─ H5 产品化（推荐问题/回答卡片）✅
     ├─ Pinia 基础状态收敛    ✅
     └─ 验收（≥80% 命中率，≤5min 未命中可见）✅
─────────────────────────────────────────────
V1.1 P1 产品骨架完善        ⏳ 进行中（当前阶段）
     ├─ 执行包 A：后端检索增强（Query Rewrite / BM25 / Rerank / 向量预留 / 工程清理）⏳
     ├─ 执行包 B：Admin 运营闭环（Dashboard 趋势图 / 未命中转知识 / handled 字段）📋
     └─ 执行包 C：H5 场景优化（推荐问题接口化 / 分类 Tab / 相关推荐 / 结果页预留）📋
─────────────────────────────────────────────
V1.1 P2 深化方向            📋 预留，不进入当前交付
```

---

## 7. 重要规范：AGENTS.md

**所有开发（人工 + AI）在每次任务开始前必须阅读 [AGENTS.md](AGENTS.md)。**

AGENTS.md 包含：
- 文档读取策略（按需读取）
- 当前阶段与禁止范围边界
- 技术约束（H5 禁止 TS、API env 必须走 config.ts 等）
- 双环境端口规范与检查流程
- 阻塞处理格式
- 禁止修改文件清单
- 代码修改规则与提交自查清单
- 执行包闭环、临时兼容收口等补充规则

> 与本文件冲突时，以**用户当前明确指令**为最高优先级，其次以 README.md，再次以 AGENTS.md。

---

## 8. 关键约定

### 接口契约（破坏性变更须告知用户）

```text
POST /chat
  Header: x-api-key: <API_SECRET>
  Body:   { "question": "..." }
  响应（命中）：  { "answer": "...", "source": "knowledge|faq", "matched": { "id": "...", "title": "..." } }
  响应（未命中）：{ "answer": "...", "source": "ai_fallback", "matched": null }
```

### Git 规范（详见 [GIT_RULES.md](GIT_RULES.md) + [GIT_RULES_CLAUDE.md](GIT_RULES_CLAUDE.md)）

- Commit 格式：`<type>(<scope>): <summary>`，例：`feat(api): 新增未命中日志落库`
- scope 固定值：`root` / `api` / `admin` / `h5` / `word` / `workspace` / `multi`
- 一次 commit 只做一类事；AI 提交前必须先输出变更总结，经用户确认后再执行
- 禁止模糊信息：`fix bug` / `修改` / `优化一下` 等

### 临时兼容处理

- 新旧链路切换期间允许最小临时兼容，但必须在**最近一个收口包**中移除
- 执行粒度与提交粒度分离：中间允许多次 build / 联调 / 修正，整包验收通过后一次性提交
- 输出中必须标注临时桥接逻辑是否已收口；未收口时不得表述为"完全闭环"

### 禁止修改的文件

- `smartdine-api/.env` / `.env.ai`
- `smartdine-h5/.env.local` / `.env.ai`
- `smartdine-admin/.env.local` / `.env.ai`
- `smartdine-api/src/data/faq.json`（生产数据，只通过接口修改）
- 任意 `package.json` dependencies（需明确授权）
- `tsconfig.json` / `vite.config.ts`（需明确授权）

### H5 专项约束

- **禁止 TypeScript**：不得出现 `lang="ts"`，不得使用 `.ts` 文件
- `import.meta.env.VITE_*` 必须写回退默认值
- 禁止引入 axios 和任何 UI 框架
