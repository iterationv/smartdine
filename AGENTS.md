# SmartDine — AGENTS.md

> Codex 入口文件。协作动态规则 + Skill 索引。每次执行任务前必读。

## 1. 本文件定位

协作规则入口:上下文管理、模型分工、硬规则、阶段边界、Skill 触发条件。不写项目事实,项目事实见 [CLAUDE.md](CLAUDE.md)。


## 2. 项目事实来源

技术栈、目录结构、核心接口、启动端口、受保护文件清单 → 见 [CLAUDE.md](CLAUDE.md)。本文件按需引用,不复述。


## 3. 上下文管理

上下文管理有三个核心机制:

1. **分层读取**(§3.1):按 L0 / L1 / L2 控制读取深度
2. **读取硬规则**(§3.2):防止默认全量加载
3. **执行摘要**(§3.3):任务结束强制压缩,为下一轮提供上下文入口

### 3.1 三层读取模型

L0 / L1 / L2 的具体内容因工具不同而不同。

**Codex 视角**(本文件是 Codex 原生入口):

| 层级 | 触发 | 内容 |
|------|------|------|
| **L0** | 每次 session 启动自动读 | 本文件(AGENTS.md) |
| **L1** | 任务显式需要 | 当前任务清单、[CLAUDE.md](CLAUDE.md)、Skill 文件 |
| **L2** | 触发条件满足才读 | 规划文档、全局任务地图、README、GIT_RULES.md |

**Claude Code 视角**([CLAUDE.md](CLAUDE.md) 是 Claude Code 原生入口):

| 层级 | 触发 | 内容 |
|------|------|------|
| **L0** | 每次 session 启动自动读 | [CLAUDE.md](CLAUDE.md) |
| **L1** | 涉及执行 / 审查 / 验收 | 本文件(AGENTS.md)、当前任务清单、Skill 文件 |
| **L2** | 触发条件满足才读 | 规划文档、全局任务地图、README、GIT_RULES.md |

### 3.2 读取硬规则

- 禁止默认读 L2,必须有明确触发条件
- 读 L1 前必须先声明"为什么读"
- 单次读取超 500 行必须说明必要性
- 文件不存在时停止并告知用户,不得脑补继续

### 3.3 执行摘要强制产出

每轮任务完成必须输出执行摘要(模板见 §8)。不输出摘要视为任务未收口。


## 4. 模型分工

| 模型 | 默认职责 | 典型场景 |
|------|---------|---------|
| **ChatGPT 5.5** | 规划、拆解、Spec 起草、复盘、方法论沉淀 | 项目规划、任务包拆分、阶段复盘 |
| **Codex 5.4** | 默认执行器,日常开发、修复 | P1 执行包开发、bug 修复、单端联调 |
| **Codex 5.5** | 兜底执行器,多端联调、复杂重构、5.4 失败后接手 | 跨端联调、复杂重构、5.4 阻塞升级 |
| **Claude Code** | 交叉验证、审查、找遗漏,不做主执行 | Spec 审查、代码评审、文档一致性检查 |

> Cursor — 人工协同审查、局部改写,不作为规范源头,不在当前 AI 协作主链路。


## 5. 硬规则

### 5.1 禁止事项

- 禁止修改受保护文件,包括:所有 `.env*` 文件(密钥)、`smartdine-api/src/data/faq.json`(生产数据)、`package.json` dependencies(依赖)、`tsconfig.json` / `vite.config.*`(构建配置)、`smartdine-word/archive/*`(历史归档)。完整清单见 [CLAUDE.md](CLAUDE.md) §6。授权后必须在本轮输出中显式记录
- 禁止在业务代码中硬编码密钥,API env 全部走 `config.ts`
- 禁止 H5 出现 `<script setup lang="ts">` 或 `.ts` 文件
- 禁止 H5 引入 axios 或任何 UI 框架
- 禁止 API 新增路由未挂 `authMiddleware`(`/health` 除外)
- 禁止未经确认新增依赖、修改 `package.json`、修改 `tsconfig.json` / `vite.config.*`
- 禁止跨阶段实现当前 Phase 未覆盖的能力(当前边界见 §6)
- 禁止顺手优化:只改本次任务相关文件,非范围内问题先记录,不顺带修
- 禁止文档任务修改业务代码,也禁止业务任务重写规范文档

### 5.2 代码铁律

- H5 `import.meta.env.VITE_*` 必须写回退默认值
- API 新增路由必须显式挂 `authMiddleware`,并核对是否需要 CORS 配置
- 新增环境变量必须同步 `.env.example` 并说明影响
- 不留 `console.log` 调试残留(`console.error` 保留)
- 修改接口契约必须先告知用户,破坏性变更须明确标注
- 临时兼容 / 桥接逻辑必须在最近一个收口包中移除;未收口不得表述为"完全闭环"

### 5.3 执行优先级

冲突时从上到下选择:

1. 用户当前明确指令
2. 当前任务清单(P0 / P1 执行任务清单)
3. [CLAUDE.md](CLAUDE.md)(项目事实)
4. 本文件(AGENTS.md)(协作规则)
5. Skill 文件(专项流程)
6. AI 默认行为


## 6. 当前阶段边界

> 本节随阶段推进更新,进入下一阶段时必须检查本节内容是否过期。

### 6.1 当前阶段定位

**V1.1 P1 产品骨架完善 — 进行中(待阶段总验收)**

三个执行包(A / B / C)均已收口,等待阶段总验收。详细任务清单见 [`smartdine-word/SmartDine_V1.1_P1_Codex开发执行任务清单.md`](smartdine-word/SmartDine_V1.1_P1_Codex开发执行任务清单.md)。

### 6.2 允许范围(P1)

- **执行包 A**:后端检索增强(Query Rewrite / BM25 / Rerank / 向量预留 / 工程清理)
- **执行包 B**:Admin 运营闭环(Dashboard 趋势图 / 未命中转知识 / handled 字段)
- **执行包 C**:H5 场景优化(推荐问题接口化 / 分类 Tab / 相关推荐 / 结果页预留)

### 6.3 允许的非破坏性接口扩展

- 检索链路内部新增 `rewrite / bm25 / rerank` 等中间能力
- `POST /chat` 返回体允许追加可选字段,但不得破坏现有字段含义
- 新增 Admin / 日志 / 推荐问题类接口时,必须保持现有链路兼容

### 6.4 禁止越界(V1.1 不做)

- RAG 真正落地 / 向量库接入 / embedding 实装
- 多轮对话上下文记忆
- 用户注册 / 多账号 / 多租户
- 个性化推荐 / 营养分析
- 主后端语言迁移(Java)/ 技术栈重构
- 未经确认的大范围目录重组

跨阶段需求 → 说明后等用户确认,不擅自实现。


## 7. Skill 索引

| 场景 | 触发条件 | Skill 文件 |
|------|---------|-----------|
| 任务开始前的环境自检与上下文加载 | 每次新任务开始 | [skill-task-intake.md](docs/ai-skills/skill-task-intake.md) |
| Codex 执行任务时的代码修改与提交规则 | Codex 开始执行 | [skill-codex-execution.md](docs/ai-skills/skill-codex-execution.md) |
| 任务收口时的验收流程与执行摘要 | 执行完毕准备收口 | [skill-acceptance-review.md](docs/ai-skills/skill-acceptance-review.md) |
| 执行超 2 轮未闭环的阻塞判定 | 同路径失败 ≥2 次 | [skill-blocker-handling.md](docs/ai-skills/skill-blocker-handling.md) |

Skill 按需加载,每个自包含,不互相依赖。与 [docs/ai-architecture.md](docs/ai-architecture.md) §6 保持一致。


## 8. 输出格式要求

每轮任务结束必须输出执行摘要(规则见 §3.3)。模板如下:

```text
### 本轮改动
- 修改文件:
- 改动原因:
- 受影响但未改动:

### 系统状态
- API:端口 / 是否需重启 / 有无破坏性改动
- H5:是否需重建 / env 有无新增
- Admin:(如涉及)

### 关键决策
- (有争议或需注意的地方)

### 验证结果
- 验证命令:
- 验证结论:

### 遗留问题
- 已知未修复:
- 下一步建议:
- 下一轮上下文建议:(哪些文件需要 / 不需要再读)
```

补充说明:

- 模板是最低要求,不可简化
- 详细的验收前置确认、收口顺序、跨任务回归判定见 [skill-acceptance-review.md](docs/ai-skills/skill-acceptance-review.md)
- 复杂任务可在模板基础上扩展,但主字段必须全填
