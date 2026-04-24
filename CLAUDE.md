# SmartDine — CLAUDE.md

> Claude Code 入口文件。项目静态事实 + Claude 角色边界。
> 协作动态规则(执行 / 阻塞 / 验收 / 阶段边界)见 [AGENTS.md](AGENTS.md)。


## 1. 项目定位

SmartDine 是一个餐厅 AI 问答系统:用户通过 H5 提问 → API 匹配知识库并结合 AI 回答 → Admin 管理知识与审核未命中问题。三端组成:

- **smartdine-api** — 后端(知识匹配 + AI 编排)
- **smartdine-h5** — 用户端问答页
- **smartdine-admin** — 知识管理与未命中审核后台


## 2. 技术栈

| 端 | 技术 | 技术栈约束 |
|----|------|-----------|
| **smartdine-api** | Node.js · Hono · TypeScript | 四层:Route → Service → AI → Data |
| **smartdine-admin** | Vue 3 · Ant Design Vue · Pinia · JavaScript | — |
| **smartdine-h5** | Vue 3 · Vite · **JavaScript** · Pinia | **禁 TypeScript · 禁 axios · 禁 UI 框架** |

> 代码行为层面的规则(如 `import.meta.env.VITE_*` 默认值、新路由鉴权)见 [AGENTS.md](AGENTS.md) §5 硬规则。


## 3. 目录简表

```text
smartdine/
├── CLAUDE.md / AGENTS.md / README.md / GIT_RULES*.md
├── docs/
│   ├── ai-architecture.md        架构决策
│   └── ai-skills/                专项流程
├── smartdine-word/               规划文档与任务清单
├── smartdine-api/src/
│   ├── index.ts · config.ts      入口 / 配置
│   ├── routes/ services/         路由层 / 服务层
│   ├── ai/ data/                 AI 编排 / 数据访问
│   └── middleware/ types/        中间件 / 类型
├── smartdine-admin/src/
│   ├── views/ stores/ api/       视图 / 状态 / 接口
│   └── router/ utils/            路由 / 工具
└── smartdine-h5/src/
    ├── views/ components/        页面 / 组件
    └── stores/ api/              状态 / 接口
```

> 根目录无 `package.json`,三端必须分别进入各自目录启动。


## 4. 启动与端口

| 环境 | 命令 | API | H5 | Admin |
|------|------|-----|-----|-------|
| 开发(人工调试) | `npm run dev` | 3000 | 5173 | 5174 |
| AI 测试(Codex / 验收) | `npm run dev:ai` | 3300 | 5273 | 5274 |
| Claude Code 专用 | `npm run dev:cc` | 3301 | 5276 | 5275 |

三套环境分别读 `.env` / `.env.ai` / `.env.cc`,端口互不冲突可并行。Claude Code 默认使用 dev:cc。


## 5. 核心接口

**POST /chat**

```text
Header: x-api-key: <API_SECRET>
Body:   { "question": "..." }
命中:   { "answer": "...", "source": "knowledge|faq", "matched": { "id": "...", "title": "..." } }
未命中: { "answer": "...", "source": "ai_fallback", "matched": null }
```

**GET /health** — 健康检查,无鉴权。

**知识条目结构**

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

**未命中回退** — 命中失败返回 AI 兜底回答并入库未命中记录,回答前缀统一为:
`这个问题暂时没有找到准确答案,以下仅供参考:`

> 破坏性契约变更必须先告知用户。P1 允许的非破坏性扩展见 [AGENTS.md](AGENTS.md) §6。


## 6. 受保护文件

| 文件 | 标签 |
|------|------|
| `smartdine-api/.env` · `.env.ai` · `.env.cc` | 密钥 |
| `smartdine-h5/.env.local` · `.env.ai` · `.env.cc` | 密钥 |
| `smartdine-admin/.env.local` · `.env.ai` · `.env.cc` | 密钥 |
| `smartdine-api/src/data/faq.json` | 生产数据(只通过接口修改) |
| 任意 `package.json` dependencies | 依赖(需明确授权) |
| `tsconfig.json` · `vite.config.ts` · `vite.config.js` | 构建配置(需明确授权) |
| `smartdine-word/archive/*` | 历史归档(不做批量整理) |

> "禁止修改"的规则条款与授权流程见 [AGENTS.md](AGENTS.md) §5 硬规则。


## 7. Claude Code 角色

**默认承担**(审查视角为主):
- 交叉验证:审查 Codex 执行结果,找遗漏、边界问题、文档不一致
- Spec 审查补全:对 GPT5.5 产出的规划做工程视角补全
- 代码评审:多视角收敛,暴露单一视角盲点

**不默认承担**:
- 全仓扫描 + 启动三端 + 改代码 + 回归 + Git 提交的一体化主执行任务(由 Codex 承担)
- 规划 / 需求拆分 / Spec 起草(由 ChatGPT 5.5 承担)

详细模型分工见 [AGENTS.md](AGENTS.md) §4。


## 8. 执行规则入口

以下场景必须读 [AGENTS.md](AGENTS.md):执行任务 / 修改代码 / 联调回归 / 任务收口 / 验收 / 阻塞判定 / 环境自检 / 提交自查 / 阶段边界判断(P0 / P1 / P2)。

其他规范:
- Git 提交:[GIT_RULES.md](GIT_RULES.md) + [GIT_RULES_CLAUDE.md](GIT_RULES_CLAUDE.md)
- 启动 / 双环境 / FAQ 数据隔离:[README.md](README.md)
- 架构分层原则:[docs/ai-architecture.md](docs/ai-architecture.md)

> 规则冲突时的优先级见 [AGENTS.md](AGENTS.md) §5 硬规则。
