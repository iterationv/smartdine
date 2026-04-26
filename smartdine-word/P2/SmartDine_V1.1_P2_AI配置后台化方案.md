# SmartDine V1.1 P2 AI 配置后台化方案

## 1. 方案结论

- 是否建议进入 P2-07：建议进入 P2 第二轮开发。
- 建议结论：采用“最小 AI 配置后台化”方案，先开放模型展示、系统提示词、回答风格、兜底话术、最大输出长度、temperature 等有限字段；API Key、Base URL、API_SECRET、CORS 等部署和安全字段继续由环境变量控制。
- 理由摘要：P2-03 已产生 `confidence` / `fallbackReason` 判定字段，P2-11A / 11B 已具备问答日志与 Admin 运营入口。AI 配置如果继续完全写死，每次调整回答口径和兜底话术都需要发版。P2-07 可以用 JSON 文件和默认常量完成最小落地，不需要数据库、新依赖、多模型路由或 Prompt 平台。

## 2. 当前 AI 调用链路

文字流程：

```text
POST /chat
  -> smartdine-api/src/index.ts 解析 question、生成 requestId、记录 start
  -> retrieve(question)
     -> matchKnowledge(original question)
        -> readActiveKnowledgeList()
        -> scoreKnowledgeCandidates()
        -> rerankKnowledgeCandidates()
        -> shouldAcceptCandidate()
     -> original 未接受时 rewriteQuery()
     -> matchKnowledge(rewritten question)
     -> assessRetrievalDecision()
        -> confidence: high | low | ambiguous | unknown_entity
        -> fallbackReason: low_absolute_score | small_gap_between_top1_top2 | unknown_entity_in_query | null
     -> confidence === high
        -> generateAnswer(question, matched)
           -> buildContext(question, matched)
           -> askLLM()
              -> config.ts 读取 aiConfig
              -> llm.ts 创建 OpenAI client
              -> chat.completions.create()
        -> saveQuestionLog()
     -> confidence !== high
        -> buildFallbackAnswer(decision)
        -> saveQuestionLog()
  -> index.ts logQaEvent()
  -> 返回 answer / source / matched / related / confidence / fallbackReason / candidates
```

职责分布：

| 责任 | 当前文件 | 说明 |
|---|---|---|
| 环境变量读取 | `smartdine-api/src/config.ts` | 读取 `PORT`、`FAQ_FILE_PATH`、`CORS_ORIGINS`、`AI_PROVIDER`、`AI_API_KEY`、`AI_MODEL`、`AI_BASE_URL`、`API_SECRET` |
| 模型调用 | `smartdine-api/src/llm.ts` | 创建 OpenAI SDK client，调用 `chat.completions.create()` |
| Prompt / message 构造 | `smartdine-api/src/llm.ts`、`smartdine-api/src/ai/buildContext.ts` | system prompt、FAQ polish prompt、fallback prompt 和知识上下文均在代码中硬编码 |
| 回答生成 | `smartdine-api/src/ai/generateAnswer.ts` | 命中知识时调用 LLM 润色；未命中时调用 LLM fallback；目前 P2-03 后低置信度路径不会进入该 fallback |
| 检索判定 | `smartdine-api/src/ai/retrieve.ts` | 基于 score、gap、未知实体、复合意图输出 `confidence` / `fallbackReason` |
| 兜底话术 | `smartdine-api/src/ai/retrieve.ts`、`smartdine-api/src/ai/generateAnswer.ts` | P2-03 判定层兜底在 `retrieve.ts`；生成失败和未命中前缀在 `generateAnswer.ts` |
| 问答日志 | `smartdine-api/src/utils/qaEvents.ts` | 记录 `confidence`、`fallbackReason`、`topMatchId`、`topScore`、`duration` |

## 3. 当前配置来源梳理

| 配置项 | 当前来源 | 是否敏感 | 当前是否硬编码 | 是否建议后台化 | 说明 |
|---|---|---:|---:|---:|---|
| `AI_PROVIDER` | `.env.example` / `.env.ai.example` / `.env.production.example`，由 `config.ts` 读取 | 否 | 否 | 部分建议 | 可在 Admin 只读展示或配置显示名；真实 provider 仍建议 env 控制 |
| `AI_MODEL` | env 示例文件，`config.ts` 读取，`llm.ts` 调用 | 否 | 否 | 建议 | P2-07 可允许编辑模型名，但需要长度和字符限制，并提供恢复默认 |
| `AI_API_KEY` | env 示例文件，`config.ts` 读取 | 是 | 否 | 否 | 密钥必须留在环境变量，不进入 Admin、不返回前端、不写日志 |
| `AI_BASE_URL` | env 示例文件，`config.ts` 读取，`llm.ts` 传入 `baseURL` | 半敏感 / 部署级 | 否 | 否 | 属于部署级网络配置，建议只展示“已配置/未配置”或不展示 |
| `API_SECRET` | env 示例文件，`config.ts` 读取，auth middleware 使用 | 是 | 否 | 否 | Admin/API 鉴权密钥，不应后台化 |
| `CORS_ORIGINS` | env 示例文件，`config.ts` 读取 | 否 | 否 | 否 | 部署级跨域配置，不适合运营后台修改 |
| `PORT` | env 示例文件，`config.ts` 读取 | 否 | 否 | 否 | 运行端口是部署配置 |
| `FAQ_FILE_PATH` | env 示例文件，`config.ts` 读取 | 否 | 否 | 否 | 数据源路径不应由 Admin 在线改动 |
| FAQ polish system prompt | `smartdine-api/src/llm.ts` | 否 | 是 | 建议 | 控制命中知识后的润色口径，适合有限后台化 |
| fallback system prompt | `smartdine-api/src/llm.ts` | 否 | 是 | 建议 | 仅作为未命中 LLM fallback 的保守边界，适合后台化但需长度限制 |
| 知识上下文模板 | `smartdine-api/src/ai/buildContext.ts` | 否 | 是 | 暂不建议 P2 最小落地 | 与回答事实边界强相关，P2-07 不应过度开放 |
| `temperature` | `smartdine-api/src/llm.ts` 固定 `0.2` | 否 | 是 | 建议 | 可后台化，范围建议 `0` 到 `1`，默认 `0.2` |
| 最大输出长度 | 当前未显式配置 | 否 | 不适用 | 建议 | P2-07 可新增配置并映射到模型参数或 prompt 约束 |
| `UNMATCHED_PREFIX` | `smartdine-api/src/ai/generateAnswer.ts` | 否 | 是 | 可长期后台化，P2 可暂缓 | P2-03 后低置信度路径主要由 `retrieve.ts` 接管 |
| `EMPTY_ANSWER_FALLBACK` | `smartdine-api/src/ai/generateAnswer.ts` | 否 | 是 | 可长期后台化，P2 可暂缓 | 属于异常兜底，低频 |
| `AVAILABLE_TOPIC_HINT` | `smartdine-api/src/ai/retrieve.ts` | 否 | 是 | 建议 | 直接影响 unknown_entity 提示，可纳入 P2-07 |
| low 兜底话术 | `smartdine-api/src/ai/retrieve.ts` | 否 | 是 | 建议 | 对应 `confidence=low` |
| ambiguous 候选提示话术 | `smartdine-api/src/ai/retrieve.ts` | 否 | 是 | 建议 | 对应 `confidence=ambiguous` |
| unknown_entity 兜底话术 | `smartdine-api/src/ai/retrieve.ts` | 否 | 是 | 建议 | 对应 `confidence=unknown_entity` |
| 检索阈值常量 | `smartdine-api/src/ai/retrieve.ts` | 否 | 是 | P2 暂不开放 | 如 `LOW_CONFIDENCE_ABS_THRESHOLD`、`LOW_CONFIDENCE_GAP_RATIO`，容易破坏回归稳定性 |
| 是否优先知识库回答 | 当前由 `retrieve.ts` 高置信度路径隐式保证 | 否 | 是 | 建议展示，谨慎编辑 | P2-07 可先作为只读策略说明；不建议允许关闭 |

## 4. 字段分层

### 4.1 继续由环境变量控制

| 字段 | 原则 | 说明 |
|---|---|---|
| `AI_API_KEY` | 密钥不进 Admin | 不展示、不编辑、不写入日志 |
| `AI_BASE_URL` | 部署级网络配置 | 可在 Admin 展示“已配置/未配置”，不展示完整值 |
| `API_SECRET` | 鉴权密钥 | 继续走 env，后续 P2-05 真实认证也不应明文暴露 |
| `CORS_ORIGINS` | 部署边界 | 错配会影响跨域和安全，继续由部署控制 |
| `PORT` | 运行环境 | 不进入 Admin |
| `FAQ_FILE_PATH` | 数据源路径 | 不允许运营后台在线切换 |
| 生产环境安全密钥 | 安全边界 | 包含未来 `ADMIN_JWT_SECRET`、密码哈希等 |

### 4.2 建议后续由 Admin 配置

| 字段 | P2-07 建议状态 | 说明 |
|---|---|---|
| 模型供应商显示名 | 可编辑 | 仅展示用，例如“Kimi / Moonshot”，不直接决定 SDK provider |
| 模型名 | 可编辑 | 默认来自 env；保存前校验长度和字符集 |
| 系统提示词 | 可编辑 | 分 FAQ polish prompt 与 fallback prompt，长度建议上限 2000 字符 |
| 回答风格 | 可编辑 | 枚举值，例如 `concise`、`friendly`、`formal`，不要自由输入过宽 |
| low confidence 兜底话术 | 可编辑 | 对应 `confidence=low` |
| ambiguous 候选提示话术 | 可编辑 | 对应 `confidence=ambiguous` |
| unknown_entity 兜底话术 | 可编辑 | 对应 `confidence=unknown_entity` |
| 可询问主题提示 | 可编辑 | 对应当前 `AVAILABLE_TOPIC_HINT` |
| 是否优先知识库回答 | 只读或只允许 true | P2 阶段不建议允许关闭，避免绕过 KB |
| 最大输出长度 | 可编辑 | 建议范围 100 到 800 中文字符，或映射到模型 `max_tokens` |
| `temperature` | 可编辑 | 建议范围 `0` 到 `1`，默认 `0.2` |

### 4.3 暂不开放

| 字段 / 能力 | 暂不开放原因 |
|---|---|
| `AI_API_KEY` 明文编辑 | 密钥不能进入前端和日志 |
| 多模型路由 | 超出 V1.1 P2，涉及路由策略、成本、降级 |
| A/B 测试 | 需要实验分流、指标归因和样本量，不属于最小落地 |
| Prompt 版本管理 | 会扩张为完整 Prompt 平台，P2 不做 |
| 自动评测平台 | 依赖样例执行器、评分口径和报表，不在 P2-07 范围 |
| 用户画像 | 涉及隐私、个性化和多轮上下文，P2 禁止提前引入 |
| 多租户配置 | 依赖账号、权限和租户模型，P2 不做 |
| 权限审批流 | P2-05 只做真实认证最小化，不做审批 |
| 在线调试工作台 | 容易暴露 prompt、日志和模型结果，范围过大 |
| 检索阈值在线调整 | 会影响 P2-04 回归样例稳定性，建议先保留代码常量 |

## 5. Admin 配置页信息架构

### 5.1 页面入口建议

- 页面名称：AI 配置
- 建议路由：`/ai-config`
- 菜单位置：建议放在“问答日志”之后，归入运营/系统设置类入口。
- 访问控制：P2-07 若开发，编辑保存能力建议依赖 TASK-P2-05 Admin 真实认证；若 P2-05 尚未完成，只允许在现有临时鉴权下做受限内测，不建议面向正式演示环境开放编辑。

### 5.2 字段分组

```text
AI 配置
├─ 基础模型信息
│  ├─ provider 显示名
│  ├─ model name
│  └─ 当前环境来源提示
├─ 回答策略
│  ├─ 是否优先知识库
│  ├─ 回答风格
│  ├─ 最大输出长度
│  └─ temperature
├─ Prompt 设置
│  ├─ FAQ 命中润色系统提示词
│  ├─ 未命中 fallback 系统提示词
│  └─ 业务边界提示
├─ 兜底话术
│  ├─ low_confidence
│  ├─ ambiguous
│  ├─ unknown_entity
│  └─ 可询问主题提示
└─ 操作
   ├─ 保存
   ├─ 恢复默认
   └─ 查看配置变更记录
```

### 5.3 只读字段

- 当前 `AI_PROVIDER` 实际值或 provider 状态。
- `AI_BASE_URL` 配置状态，仅展示“已配置 / 未配置”，不展示完整 URL。
- `AI_API_KEY` 配置状态，仅展示“已配置 / 未配置”。
- `API_SECRET`、`CORS_ORIGINS` 不展示或仅在部署说明中提示由环境变量控制。
- 是否优先知识库回答：P2-07 建议只读展示为“已启用”。

### 5.4 可编辑字段

- provider 显示名。
- model name。
- FAQ 命中润色系统提示词。
- 未命中 fallback 系统提示词。
- 回答风格。
- 最大输出长度。
- `temperature`。
- low / ambiguous / unknown_entity 三类兜底话术。
- 可询问主题提示。

### 5.5 禁止展示字段

- `AI_API_KEY` 明文。
- `API_SECRET` 明文。
- 未来 `ADMIN_JWT_SECRET` 明文。
- 请求头、用户 token、cookie。
- 完整密钥、完整生产 URL、真实日志敏感上下文。

## 6. API 配置读取策略

### 6.1 推荐存储位置

推荐 P2-07 使用运行期路径：

```text
smartdine-api/data/ai-config.json
```

理由：

- `src/data` 更接近种子数据和源码，不适合存放运行时可变配置。
- `smartdine-api/data` 可作为运行期持久化目录，和源码构建产物隔离。
- 后续可通过 `.gitignore` 忽略运行期配置文件，避免运营配置进入 git。
- 不需要引入数据库，符合 V1.1 P2 最小落地边界。

### 6.2 默认配置来源

建议在 P2-07 新增代码默认常量，例如：

```text
smartdine-api/src/ai/aiConfigDefaults.ts
```

默认值应包含：

- provider 显示名默认值。
- model name 默认值，优先读取 env `AI_MODEL`。
- FAQ 命中润色系统提示词默认值。
- 未命中 fallback 系统提示词默认值。
- low / ambiguous / unknown_entity 默认话术。
- 默认 `temperature=0.2`。
- 默认最大输出长度。

### 6.3 加载流程

```text
服务启动
  -> 加载代码默认配置
  -> 读取 env 中的部署级配置和密钥
  -> 尝试读取 smartdine-api/data/ai-config.json
  -> JSON 不存在：使用默认配置
  -> JSON 可解析：校验字段和范围，合并到默认配置
  -> JSON 损坏或字段非法：使用默认配置，并记录错误
  -> 缓存在内存，供 /chat 调用链路读取
```

### 6.4 保存流程

```text
Admin 提交配置
  -> authMiddleware / 后续 P2-05 真实认证校验
  -> 校验字段白名单
  -> 校验 prompt 长度、temperature、最大输出长度
  -> 剔除任何密钥字段
  -> 写入临时文件
  -> 原子替换 smartdine-api/data/ai-config.json
  -> 更新内存缓存
  -> 写入 admin-events 日志
  -> 返回保存后的安全配置视图
```

### 6.5 生效策略

推荐 P2-07 采用：保存后立即热更新。

原因：

- 配置量小，JSON 文件和内存缓存足够支撑。
- 运营调整兜底话术后应能立即通过 `/chat` 验证。
- 不需要重启服务，演示和回归成本低。

边界：

- env 字段变更仍需重启服务。
- 如果保存失败，继续使用上一份有效内存配置。
- 如果热更新校验失败，不写文件、不替换内存配置。

## 7. 默认值与回滚策略

- 默认配置常量：放在 API 源码中，作为不可变基线。
- 配置文件不存在：使用默认配置，不报错中断。
- 配置文件损坏：使用默认配置或上一份有效内存配置，并记录 `console.error`。
- 字段缺失：按字段粒度回退默认值。
- 字段非法：拒绝保存；启动读取时忽略非法字段并回退默认值。
- Admin “恢复默认”：只恢复可后台化字段，不触碰 env 密钥、Base URL、CORS、端口。
- 配置保存失败：接口返回错误，当前有效配置不变。
- 上一份有效配置：服务运行中保留内存缓存，避免坏配置影响 `/chat` 主链路。

## 8. 配置变更日志设计

配置变更不写入 `qa-events`。`qa-events` 只记录用户问答事件，混入配置变更会污染 P2-11B 问答日志页面。

建议新增独立日志：

```text
logs/admin-events-YYYY-MM-DD.jsonl
```

建议字段：

```json
{
  "eventId": "uuid",
  "timestamp": 1714000000000,
  "eventType": "ai_config_updated",
  "operator": "admin",
  "changedFields": ["modelName", "systemPrompt"],
  "source": "admin"
}
```

记录规则：

- 不记录 `AI_API_KEY`。
- 不记录 `API_SECRET`。
- 不记录完整长 Prompt；只记录字段名、长度变化、摘要 hash 或“已变更”。
- 不记录旧值和新值中的敏感内容。
- 写入失败不影响配置保存结果，但需要 `console.error`。
- 查询能力可在后续单独设计，不复用 `/api/admin/qa-events`。

## 9. 安全边界

- API Key 不进入前端。
- API Key 不在 Admin 展示。
- API Key 不写入配置文件。
- API Key 不写入日志。
- Base URL 不建议完整展示，最多展示 provider 和配置状态。
- Prompt 长度需要限制，建议单项不超过 2000 字符。
- fallback 话术长度需要限制，建议单项不超过 300 字符。
- `temperature` 范围建议 `0` 到 `1`。
- 最大输出长度建议 100 到 800 中文字符或对应 token 上限。
- 保存配置必须经过 Admin 鉴权。
- P2 阶段不做多账号、多角色、多租户。
- P2-05 Admin 真实认证尚未完成前，P2-07 的编辑能力不建议正式开放；若为了第二轮联调先实现，应明确标注为临时复用现有鉴权。
- 不允许通过后台配置关闭 P2-03 的低置信度保护。

## 10. 与现有 P2 能力的关系

### 10.1 与 P2-03 confidence / fallbackReason 的关系

P2-07 只允许配置 `confidence` 对应的话术，不允许重命名或删除字段：

| P2-03 字段 | 可配置内容 | 不允许修改 |
|---|---|---|
| `confidence=high` | 命中知识后的回答风格、系统提示词、最大输出长度 | 不允许绕过知识库直接编造 |
| `confidence=low` | low confidence 兜底话术 | 不允许关闭低置信度判定 |
| `confidence=ambiguous` | 候选提示话术 | 不允许改变 candidates 结构 |
| `confidence=unknown_entity` | 未知实体兜底话术、可询问主题提示 | 不允许强答未知实体 |
| `fallbackReason` | 仅可用于展示和日志 | 不允许后台改枚举命名 |

### 10.2 与 P2-11A 问答日志的关系

P2-11A 的 `qa-events` 继续记录 `/chat` 问答事件。AI 配置变更不要写入该日志。问答日志可以用于观察配置调整后的效果，但不承担配置审计职责。

### 10.3 与 P2-11B Admin 日志页面的关系

当前 Admin “问答日志”页面只读展示 `/api/admin/qa-events`。P2-07 可以在 AI 配置页中放置“查看问答日志”跳转，但不应复用问答日志页面展示配置变更记录。

### 10.4 与 P2-05 Admin 真实认证的关系

P2-07 的保存能力建议依赖 P2-05。原因是 AI Prompt 和兜底话术会直接影响用户可见回答，不能只依赖临时登录拦截长期运行。

建议顺序：

```text
P2 第二轮
  -> TASK-P2-05 Admin 真实认证最小化
  -> TASK-P2-07 AI 配置后台化最小落地
```

如需并行开发，P2-07 后端接口必须先挂现有 `authMiddleware`，并在 P2-05 完成后切换到真实 Admin 鉴权。

## 11. P2-07 最小落地建议

- 最小字段范围：
  - provider 显示名。
  - model name。
  - FAQ 命中润色系统提示词。
  - 未命中 fallback 系统提示词。
  - 回答风格枚举。
  - `temperature`。
  - 最大输出长度。
  - low confidence 兜底话术。
  - ambiguous 候选提示话术。
  - unknown_entity 兜底话术。
  - 可询问主题提示。

- 后端接口范围：
  - `GET /api/admin/ai-config`：返回安全配置视图，不返回任何密钥。
  - `PUT /api/admin/ai-config`：保存白名单字段。
  - `POST /api/admin/ai-config/reset`：恢复默认可配置字段。
  - 配置读取工具：加载默认配置、读取 JSON、校验、内存缓存、热更新。
  - 配置变更日志：写入 `logs/admin-events-YYYY-MM-DD.jsonl`。

- Admin 页面范围：
  - 新增“AI 配置”只读/编辑页面。
  - 展示基础模型信息和安全状态。
  - 支持编辑 Prompt、兜底话术、temperature、最大输出长度。
  - 支持保存、恢复默认、错误提示。
  - 不做图表、不做 Prompt 历史版本、不做在线调试。

- 不做范围：
  - API Key 明文管理。
  - Base URL 在线编辑。
  - 多模型路由。
  - A/B 测试。
  - Prompt 版本管理。
  - 自动评测平台。
  - 多账号、多角色、多租户。
  - 权限审批流。
  - 在线调试工作台。
  - 检索阈值后台化。

- 验收标准：
  - Admin 可查看 AI 配置，敏感字段隐藏。
  - Admin 可修改允许开放的配置字段。
  - 保存后 `/chat` 主链路读取新配置并立即生效。
  - 配置文件不存在、为空或损坏时使用默认配置，`/chat` 不崩溃。
  - 恢复默认只影响可后台化字段。
  - 配置变更写入 `admin-events`，不污染 `qa-events`。
  - 未修改 KB 数据。
  - 未暴露 API Key。
  - 未引入数据库和新依赖。

## 12. 风险与后续建议

- 风险 1：Prompt 编辑过宽会降低回答稳定性。建议 P2-07 只开放有限文本框，保留默认值和恢复默认。
- 风险 2：如果 P2-05 未完成就开放保存能力，配置接口的安全边界不足。建议第二轮先做 P2-05，或至少让 P2-07 的编辑接口继续挂现有 `authMiddleware` 并标注过渡方案。
- 风险 3：配置变更立即热更新需要保证并发写入安全。P2-07 可用单文件原子写入和内存缓存控制，不引入复杂锁服务。
- 风险 4：把检索阈值也纳入后台会破坏 P2-04 回归样例稳定性。建议 P2 不开放阈值。
- 建议：第一轮完成后先输出 `SmartDine_V1.1_P2_第一轮验收报告.md`；第二轮以 P2-05 + P2-07 为主线，不提前进入 P3 视觉重构和完整 Prompt 平台。

## 附录：引用文件清单

- `AGENTS.md`
- `docs/ai-skills/skill-task-intake.md`
- `docs/ai-skills/skill-codex-execution.md`
- `docs/ai-skills/skill-acceptance-review.md`
- `smartdine-word/P2/SmartDine_V1.1_P2_第一轮_Codex执行任务清单.md`
- `smartdine-word/P2/SmartDine_V1.1_P2_详细任务清单.md`
- `SmartDine_V1.1_P2_问答日志设计.md`
- `SmartDine_V1.1_P2_问答日志验证报告.md`
- `SmartDine_V1.1_P2_Admin问答日志页面说明.md`
- `smartdine-api/.env.example`
- `smartdine-api/.env.ai.example`
- `smartdine-api/.env.production.example`
- `smartdine-api/src/config.ts`
- `smartdine-api/src/llm.ts`
- `smartdine-api/src/index.ts`
- `smartdine-api/src/ai/generateAnswer.ts`
- `smartdine-api/src/ai/buildContext.ts`
- `smartdine-api/src/ai/retrieve.ts`
- `smartdine-api/src/ai/matchKnowledge.ts`
- `smartdine-api/src/types/retrieval.ts`
- `smartdine-api/src/routes/adminLogs.ts`
- `smartdine-api/src/utils/qaEvents.ts`
