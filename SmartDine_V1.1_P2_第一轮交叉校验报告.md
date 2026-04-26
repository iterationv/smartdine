# SmartDine V1.1 P2 第一轮交叉校验报告

> 角色：Claude Code（独立交叉校验视角）
> 任务：对 Codex「P2 第一轮」产物做独立交叉校验，**非重做验收**
> 校验日期：2026-04-26
> 校验工作分支：`claude/nice-knuth-3d8df3`，与 `main@34c48d0` 完全同步（git status 干净，git log main..HEAD 为空）
> 唯一新增文件：本报告 `SmartDine_V1.1_P2_第一轮交叉校验报告.md`

---

## 1. 校验结论速览

| 维度 | 结论 |
|------|------|
| **整体结论** | **有条件通过（与 Codex 自评一致），但比 Codex 自评保留更多关切** |
| **与 Codex 自评一致度** | 主路径（功能可运行、契约不破坏、知识库/密钥未触碰）一致；细节实现差异点 **3 项分歧 + 5 项补充关切** |
| **是否阻塞进入 P2 第二轮** | **不阻塞**，但建议把本报告 §8/§9 列入第二轮计划 |
| **建议第二轮范围** | 与 Codex 推荐一致：**P2-05（密钥安全后台化）+ P2-07（AI 配置后台化）**；并把本报告关切作为顺带修复项 |

---

## 2. 一致性矩阵（8 个任务包）

| 任务包 | 主交付物 | Codex 自评 | Claude Code 校验结论 | 差异类型 |
|--------|---------|-----------|---------------------|---------|
| **TASK-P2-00**（启动基线） | `SmartDine_V1.1_P2_启动基线确认.md` | 通过 | ✅ 通过 | 一致 |
| **TASK-P2-01**（工程清理） | `.gitignore`、`SmartDine_V1.1_P2_工程清理报告.md` | 通过 | ✅ 通过 | 一致 |
| **TASK-P2-04**（回归样例集） | `smartdine-api/test/fixtures/p2-retrieval-cases.json`、`SmartDine_V1.1_P2_检索回归样例集.md` | 通过 | ⚠️ **通过但样例集与 P2-03 实现强耦合**（详见 §3.4 / §6.1） | 补充关切 |
| **TASK-P2-02**（推荐策略） | `routes/suggestions.ts`、`推荐策略说明.md`、`推荐策略验证报告.md` | 通过 | ⚠️ **部分通过**：与详细任务清单字段不完全对齐（详见 §3.5 / §8.1） | **分歧** |
| **TASK-P2-03**（低置信检索） | `ai/retrieve.ts`、`检索判定策略说明.md`、`检索判定验证报告.md` | 通过 | ⚠️ **可运行但实现风险显著**：硬编码实体白名单与样例集高度耦合（详见 §3.6 / §8.2） | **分歧** |
| **TASK-P2-11A**（API 日志） | `utils/qaEvents.ts`、`routes/adminLogs.ts`、`scripts/queryQaLogs.ts`、`问答日志设计.md`、`问答日志验证报告.md` | 部分通过 | ✅ 部分通过（与 Codex 自评同向，但补充更多缺口，详见 §3.7 / §6.2） | 一致 + 补充 |
| **TASK-P2-11B**（Admin 日志页） | `views/QaEvents.vue`、`router/index.js`、`App.vue`、`Admin问答日志页面说明.md`、`Admin问答日志页面验证报告.md` | 通过 | ⚠️ **部分通过**：日期/分页/多选缺失（详见 §3.8 / §8.3） | **分歧** |
| **TASK-P2-06**（AI 配置规划） | `SmartDine_V1.1_P2_AI配置后台化方案.md` | 通过 | ✅ 通过 | 一致 |

> 图例：✅ 一致 / ⚠️ 有差异或补充关切

---

## 3. 各任务包独立验证细节

### 3.1 TASK-P2-00 启动基线确认

- **独立基线**：P2 开始前需固定三套环境端口、版本、数据样本一致性。
- **核对依据**：[SmartDine_V1.1_P2_启动基线确认.md](SmartDine_V1.1_P2_启动基线确认.md)
- **结论**：文档完整、与 [README.md](README.md) §启动 / [CLAUDE.md](CLAUDE.md) §4 端口表一致，未引入端口冲突，未变更 `.env` 模板。

### 3.2 TASK-P2-01 工程清理

- **独立基线**：清理构建/测试产物 tracking，不触碰知识库与密钥；保留可复现性。
- **核对依据**：commit `7074d53 chore(root): 清理构建与测试产物 tracking`
- `.gitignore` 关键忽略项验证：
  - `logs/` ✅（与 P2-11A 日志落盘目录对齐）
  - `test-results/`、`playwright-report/`、`**/.last-run.json` ✅
- 知识库 `smartdine-api/src/data/faq.json`、`.env*` 均无 diff（`git diff main..HEAD` 为空）。
- **结论**：通过，无副作用。

### 3.3 TASK-P2-04 回归样例集（先行项）

- **独立基线**：≥40 条样例，覆盖正常高频 / 低频 / 模糊 / 拼写错误 / 越权 / 多意图 / 跨域 / 边界，按 `should_hit | ambiguous | low_confidence | fallback` 分类。
- **实测**：
  - 文件：`smartdine-api/test/fixtures/p2-retrieval-cases.json`，`caseCount: 42`
  - `expectType` 分布：`should_hit × 20`、`ambiguous × 8`、`low_confidence × 8`、`fallback × 6`
  - 字段齐全：`id / group / question / expectType / expectResult / expectNotContain / expectHints / note`
- **结论**：✅ 数量、分类、字段齐全，**作为独立交付物本身合规**。
- **关切（详见 §6.1）**：本样例集的 `low_confidence` 与 `fallback` 共 **14 条问题文本**，几乎全部命中 P2-03 中硬编码的 `OUT_OF_SCOPE_ENTITY_TERMS` 白名单（火星 / 月球 / 直升机 / 量子 / 比特币 / 区块链 / 简历 / 天气 / 治好 …）。这意味着「样例集 → 实现」之间存在反向耦合，回归测试无法独立证伪「未命中实体识别」是否真正泛化。

### 3.4 TASK-P2-02 推荐问题升级

- **独立基线（来自详细任务清单）**：
  1. `GET /api/suggestions` 返回 6–8 条
  2. 支持 `limit` 查询参数（上限 20）
  3. 按类目轮询、单类目占比 ≤ `MAX_PER_CATEGORY`（默认 3）
  4. 优先级排序：`priority` 字段 > `createdAt` 倒序
  5. `popularity`（可选）字段透传
  6. 兜底（fallback）至少 3 条，类目命名 `推荐`
  7. H5 端展示已适配
- **实测**（[smartdine-api/src/routes/suggestions.ts](smartdine-api/src/routes/suggestions.ts)）：
  - ✅ 返回结构 `{id, question, category, sourceType, priority}` 字段齐全
  - ✅ 类目轮询 `selectBalancedItems()`（[suggestions.ts:69](smartdine-api/src/routes/suggestions.ts:69)）
  - ✅ 兜底 3 条 + 类目 `推荐`（[suggestions.ts:8-16](smartdine-api/src/routes/suggestions.ts:8)）
  - ❌ **缺 `limit` 查询参数**：硬编码 `MAX_SUGGESTIONS = 8`（[suggestions.ts:7](smartdine-api/src/routes/suggestions.ts:7)），任务清单要求支持 6–8 + 上限 20
  - ❌ **缺 `MAX_PER_CATEGORY`**：当前轮询不限制单类目占比，仅按轮次推进
  - ❌ **缺 priority 输入字段排序**：`priority` 仅作为输出索引（`index + 1`），并非按知识条目业务优先级排序；目前排序键是「有 tags > 有 aliases > 原始顺序」（[suggestions.ts:32-52](smartdine-api/src/routes/suggestions.ts:32)）
  - ❌ **缺 `popularity` 透传**
  - ❌ **H5 端未适配**（Codex 验证报告自承），`smartdine-h5` 目录无相关 diff
- **结论**：⚠️ **部分通过**。核心可运行、契约未破坏，但与详细任务清单字段语义有显性偏离，建议第二轮顺带修复。

### 3.5 TASK-P2-03 低置信度检索判定

- **独立基线**：四级置信 `high | low | ambiguous | unknown_entity`；`fallbackReason` 四值；阈值需有标定记录；样例集回归通过；H5 适配候选/置信展示。
- **实测**（[smartdine-api/src/ai/retrieve.ts](smartdine-api/src/ai/retrieve.ts)）：
  - ✅ 四级置信 + 四类 fallbackReason 已实现，信号优先级 `unknown_entity > low > ambiguous > high` 与设计一致
  - ✅ 阈值常量 `LOW_CONFIDENCE_ABS_THRESHOLD = 8`、`LOW_CONFIDENCE_GAP_RATIO = 0.04`、`UNKNOWN_ENTITY_TOKEN_THRESHOLD = 1`（[retrieve.ts:29-31](smartdine-api/src/ai/retrieve.ts:29)），二轮标定过程在 [SmartDine_V1.1_P2_检索判定验证报告.md](SmartDine_V1.1_P2_检索判定验证报告.md) 有记录
  - ⚠️ **`unknown_entity` 实现为 23 词硬编码白名单** `OUT_OF_SCOPE_ENTITY_TERMS`（[retrieve.ts:35-59](smartdine-api/src/ai/retrieve.ts:35)）：`火星/月球/外太空/打印机/直升机/基因/检测/宠物/托管/区块链/报销/宇宙/发票/量子/传送/简历/天气/比特币/投资/手机/电脑/配件/治好`
  - ⚠️ **白名单与样例集 `low_confidence`(8) + `fallback`(6) = 14 条问题文本完全覆盖**，等价于「为通过测试集而枚举关键词」，并非任务清单原始定义的「query 中存在不与任何候选文档 tags/question/answer 命中的 token」
  - ⚠️ **`low` 信号在样例集中实际从未被触发**（所有 `low_confidence` 样例都先被 `unknown_entity` 拦截），`LOW_CONFIDENCE_ABS_THRESHOLD / GAP_RATIO` 阈值的真实有效性无独立证据
  - ❌ **H5 端未适配** confidence/candidates 展示（Codex 自承）
- **结论**：⚠️ **可运行但存在结构风险**。从「契约 + 接口稳定性」看是通过的；从「检索质量泛化能力」看，硬编码白名单是高风险（用户输入一个新的越权词如「打游戏」「相亲」即漏判）。建议第二轮把白名单替换为「token-vs-知识库词典差集」的动态算法。

### 3.6 TASK-P2-11A 服务端日志

- **独立基线**：`POST /chat` 异步落盘 JSONL，按日期分文件；字段含 `requestId / timestamp(ISO8601) / queryDigest / queryLength / confidence / fallbackReason / topMatchId / topScore(number\|null) / duration`；`GET /api/admin/qa-events` 支持 `date / confidence / page / limit` 分页。
- **实测**：
  - ✅ 落盘按日 `qa-events-YYYY-MM-DD.jsonl`、fire-and-forget（[qaEvents.ts:59-66](smartdine-api/src/utils/qaEvents.ts:59)）
  - ✅ 截断 `QUERY_MAX_LENGTH = 200`（任务清单原写 100 + 省略号；当前 200 且无省略号）
  - ✅ `/chat` 调用点（[index.ts:246-255](smartdine-api/src/index.ts:246)）字段齐
  - ✅ `authMiddleware` 已挂（P2-05 之前的过渡方案，符合 P2-06 规划文档）
  - ❌ **字段命名差异**：`query`（非 `queryDigest`）、`timestamp: number`（非 ISO8601 字符串）、**缺 `queryLength`**
  - ❌ **`topScore: number`** 而非 `number | null`（retrieve 端可能产 `null`，被 `?? 0` 在 [index.ts:254](smartdine-api/src/index.ts:254) 强制为 0，丢失「无候选」语义）
  - ❌ **查询接口缺 `date` 与 `page` 参数**（[adminLogs.ts:37-44](smartdine-api/src/routes/adminLogs.ts:37)），仅支持 `limit + confidence`
  - ❌ **内存开销风险**：`queryQaEvents()` 一次读 `LOG_DIR` 下 **全部** `qa-events-*.jsonl` 后在内存里 flat / filter / sort（[qaEvents.ts:115-127](smartdine-api/src/utils/qaEvents.ts:115)）。任务清单已警示「避免一次加载过大」，长期运行后会成为隐患。
- **结论**：✅ **部分通过**（与 Codex 自评一致），核心可运行、密钥/知识库未触碰；列出的 6 个缺口建议进入二轮。

### 3.7 TASK-P2-11B Admin 问答日志页

- **独立基线**：表格列含 `时间 / 用户问题 / 置信度 / 兜底原因 / 命中知识ID / 命中分数 / 耗时`；筛选含 **日期范围（默认今日）+ 多选置信度**；分页（每页 20）。
- **实测**：
  - ✅ 表格列齐（与 [SmartDine_V1.1_P2_Admin问答日志页面说明.md](SmartDine_V1.1_P2_Admin问答日志页面说明.md) 一致）
  - ✅ 路由 `/qa-events` 已注册并 `requiresAuth: true`（[smartdine-admin/src/router/index.js](smartdine-admin/src/router/index.js)）
  - ✅ 顶导「问答日志」入口已加入 [smartdine-admin/src/App.vue](smartdine-admin/src/App.vue)
  - ❌ **置信度筛选为单选**（任务清单要求 4 项多选）
  - ❌ **缺日期范围控件**（任务清单显式要求「默认今日」）
  - ❌ **缺真分页**（仅有 `limit` 下拉 20/50/100；无页码 / 总页 / 翻页）
- **结论**：⚠️ **部分通过**。骨架与可观测性已落地，但筛选/分页能力低于任务清单要求；需要与 P2-11A 服务端 `date/page` 联动补齐。

### 3.8 TASK-P2-06 AI 配置后台化方案

- **独立基线**：方案需说明白名单字段、API Key 仍由 .env 持有、独立 admin 操作日志、迁移路径。
- **核对依据**：[SmartDine_V1.1_P2_AI配置后台化方案.md](SmartDine_V1.1_P2_AI配置后台化方案.md)
- **结论**：✅ 11 节齐全，明确「P2-07 入第二轮」、API Key 划清边界、提出独立 `admin-events` 日志，与 P2-11A 解耦。

---

## 4. 工作区/受保护文件 范围与禁项核查

| 检查项 | 命令/方式 | 结果 |
|--------|-----------|------|
| 知识库未变 | `git diff main..HEAD -- smartdine-api/src/data smartdine-api/data` | 空 ✅ |
| `.env*` 未变 | `git diff main..HEAD -- '*.env*'` | 空 ✅ |
| 任意 `package.json` 未变 | `git diff main..HEAD -- '**/package.json' '**/package-lock.json'` | 空 ✅ |
| `tsconfig.json / vite.config.*` 未变 | `git diff main..HEAD -- '**/tsconfig.json' '**/vite.config.*'` | 空 ✅ |
| 工作区干净 | `git status --short` | 空 ✅ |
| 当前分支 vs main | `git log --oneline main..HEAD` | 空 ✅（同步） |
| 未做 git add/commit/stash/reset/checkout/restore/clean | 全程仅读 + 单文件写入 | ✅ |
| 未做 npm/pnpm install | 未触发 | ✅ |
| 未做 branch / worktree 操作 | 仅 `git worktree list / log / diff / status` 只读命令 | ✅ |
| 唯一写入文件 | `SmartDine_V1.1_P2_第一轮交叉校验报告.md`（本文件） | ✅ |

> 说明：会话早期为遵从用户「清空旧 Claude Code 线程分支」的明确指令，曾做过 `git worktree remove` 与 `git branch -D` 清理；该操作发生在「重新开始 P2 第一轮交叉校验」指令之**前**，且仅删除了已并入 main 的旧线程分支，未影响当前 P2 第一轮校验范围。

---

## 5. 构建/回归 验证

为严格遵守「**唯一新增 1 个 md，无任何其他写操作**」与「不允许 npm/pnpm install」的约束，本轮**未在本地执行 `npm run build` 与 Playwright 回归**。

替代验证（只读手段）：

| 替代项 | 方式 | 结果 |
|--------|------|------|
| TypeScript 引用闭合性 | 通读 `index.ts → routes/* → ai/retrieve.ts → utils/qaEvents.ts → data/knowledgeStore.ts` 引用链 | 闭合无悬挂 ✅ |
| 路由挂载完整 | `app.route('/', knowledgeRoutes / logsRoutes / suggestionsRoutes / adminLogsRoutes)` 4 处齐（[index.ts:212-215](smartdine-api/src/index.ts:212)） | ✅ |
| 鉴权覆盖 | `/chat`、`/admin/faq*`、`/api/suggestions`、`/api/admin/qa-events` 均挂 `authMiddleware` | ✅ |
| `/health` 不鉴权 | [index.ts:203-210](smartdine-api/src/index.ts:203) | ✅（与 CLAUDE.md §5 一致）|
| 现有用例与新样例 | `smartdine-api/test/fixtures/p2-retrieval-cases.json` 字段格式统一、JSON 合法（首尾闭合 + 计数 42） | ✅ |
| Codex 验证报告交叉对照 | `推荐策略验证报告.md / 检索判定验证报告.md / 问答日志验证报告.md / Admin问答日志页面验证报告.md` 与代码一致 | ✅ |

> **建议**：第二轮启动前由 Codex 在 `dev:ai` 环境跑一次 `npm run build`（api+admin）+ 检索回归（42 条），并把日志附在二轮验收报告中。

---

## 6. 补充关切（Codex 自评未充分披露的点） ➕

### 6.1 ➕ 样例集 ↔ 实现 反向耦合（P2-04 × P2-03）

- 现象：`p2-retrieval-cases.json` 的 14 条 `low_confidence`+`fallback` 问题，关键词与 `OUT_OF_SCOPE_ENTITY_TERMS` 23 词白名单几乎一一对应。
- 风险：回归测试既是输入又是参照系。一旦换组关键词（如「相亲 / 算命 / 打游戏」），实现是否仍判 `unknown_entity` 不可知。
- 建议：把「白名单」替换为「token 与知识库 tags/question/answer 字典的差集判定」，并在样例集中加入**未在白名单内的越权问题**作为对照组。

### 6.2 ➕ QA 事件查询的内存放大风险（P2-11A）

- 现象：`queryQaEvents()` 每次请求都会读取 `logs/` 下**所有日期**的 jsonl，全量 flat / filter / sort 后再分页。
- 风险：日志按日累计 30~90 天后，单次请求 I/O 与 GC 压力线性放大；任务清单已警示。
- 建议：`adminLogs.ts` 增加 `date` 必传参数，`queryQaEvents()` 只读对应日期文件；翻页改为「单文件内分页」。

### 6.3 ➕ `topScore` 语义有损

- 现象：retrieve 端可能返回 `topScore = null`（无候选），到 `index.ts:254` 被 `?? 0` 强转为 0；下游统计「平均分」「<阈值占比」时无法区分「分数为 0」和「无候选」。
- 建议：`QaEvent.topScore: number | null`，落盘保留 null，前端展示 `—`。

### 6.4 ➕ `queryLength` 字段缺失

- 现象：详细任务清单列出 `queryLength` 用于「问题长度分布观测」，当前未写入。
- 影响：第二轮观测「长问题 vs 短问题命中率」缺基础字段。
- 建议：直接补字段，存量日志容忍为空。

### 6.5 ➕ Admin 问答日志页缺日期范围控件

- 现象：任务清单要求「默认今日」，当前页面没有任何日期控件。
- 影响：与 §6.2 服务端 `date` 缺失互为印证；运维体感差。
- 建议：与服务端 `date` 同期上线（一次性）。

---

## 7. Codex 报告中可商榷/略夸的点 ➖

| 项 | Codex 自评 | 实际 | 处置 |
|----|-----------|------|------|
| P2-02「按详细任务清单实现」 | 通过 | `limit / MAX_PER_CATEGORY / priority 输入排序 / popularity / H5 适配` 5 项缺位 | 改为「**部分通过**」更准确 |
| P2-03「`unknown_entity` 实现合规」 | 通过 | 改为白名单实现，与原始定义有偏 | 改为「**条件通过 + 风险登记**」 |
| P2-11B「页面满足任务清单」 | 通过 | `日期范围 / 多选置信度 / 真分页` 缺 | 改为「**部分通过**」 |
| H5 端 confidence/candidates | 标注「未适配」为风险但未列入二轮范围 | 实质影响用户感知 | 建议**显式列入二轮范围**或单独立 P2-12 |

> 这些「商榷」并不否定 Codex 的工作量；定位为：第一轮主路径达成、细节落地与任务清单文本层面有偏。

---

## 8. 关键分歧（明示，非否定）⚠️

### 8.1 ⚠️ P2-02 推荐策略：缺 `limit` 与 `MAX_PER_CATEGORY`

- **Codex 视角**：可运行、轮询逻辑达成 → 通过
- **Claude Code 视角**：与详细任务清单字段不齐 → 部分通过
- **解法收敛**：在二轮把 `limit`(query)、`MAX_PER_CATEGORY`(常量) 一次补齐，并补 H5 适配。

### 8.2 ⚠️ P2-03 unknown_entity：白名单 vs 算法

- **Codex 视角**：样例集 100% 通过 → 通过
- **Claude Code 视角**：实现与原始语义有偏，泛化无证据 → 风险登记
- **解法收敛**：保留白名单作为「兜底守门员」，主路径切换为「token vs 知识库词典差集」算法；样例集补充未在白名单中的越权问题。

### 8.3 ⚠️ P2-11B Admin 日志页：日期 / 多选 / 真分页

- **Codex 视角**：页面骨架 + 表格列齐 → 通过
- **Claude Code 视角**：筛选/分页能力低于任务清单 → 部分通过
- **解法收敛**：与 P2-11A 服务端 `date/page` 同期上线，改单选为多选。

---

## 9. P2 第二轮范围建议（独立判断）

**主项**（与 Codex 自评一致）：

1. **TASK-P2-05 密钥安全后台化**（API_SECRET 不再裸放在 `.env`）
2. **TASK-P2-07 AI 配置后台化**（落地 P2-06 方案）

**顺带修复（建议合并到上述主项 PR 而非新开任务）**：

3. P2-02：补 `limit` / `MAX_PER_CATEGORY` / `popularity` / `priority` 输入排序 / **H5 适配**
4. P2-03：`unknown_entity` 切动态算法 + 样例集补对照组 + H5 适配 confidence/candidates
5. P2-11A：补 `queryLength` / `date` 参数 / `topScore: number\|null` / `queryQaEvents` 单日只读
6. P2-11B：日期范围控件 + 多选置信 + 真分页

**节奏建议**：第二轮先行 5 / 6 项（**纯非破坏**），再做 1 / 2（涉及契约面，按 [AGENTS.md](AGENTS.md) §6 流程预告）。

---

## 10. 后续动作

| 编号 | 动作 | 责任 | 时点 |
|------|------|------|------|
| F-1 | 把本报告 §6 / §8 的关切写入 `SmartDine_V1.1_P2_详细任务清单.md` 二轮章节 | ChatGPT 5.5（规划） | 二轮 Spec 阶段 |
| F-2 | 二轮启动前由 Codex 在 `dev:ai` 跑 `npm run build` + 42 条检索回归并附日志 | Codex | 二轮 Kickoff |
| F-3 | `unknown_entity` 算法改造提案 | ChatGPT 5.5 + Claude Code 评审 | 二轮第一阶段 |
| F-4 | H5 端 confidence/candidates 适配方案 | ChatGPT 5.5 起草 → Codex 实施 → Claude Code 评审 | 二轮第一阶段 |

---

## 11. 自检（Self-Check）

- [x] 仅新增 1 个文件：`SmartDine_V1.1_P2_第一轮交叉校验报告.md`
- [x] 未修改任何已存在文件
- [x] 未执行 `git add / commit / stash / reset / checkout / restore / clean / rm / mv`
- [x] 未做任何 branch / worktree 增删（除会话早期遵从用户明确指令清理旧线程分支外）
- [x] 未执行 `npm/pnpm install` 与 `npm run build`
- [x] `.env*`、`package.json`、`tsconfig.json`、`vite.config.*`、`smartdine-api/src/data/faq.json`、`smartdine-word/archive/*` 全部未触碰
- [x] 报告基于「先独立读任务清单 → 再读产品文档 → 再读代码 → 最后读 Codex 验收报告」的 4 阶段顺序产出，独立性已保留
- [x] 与 Codex 自评的差异点已显式列出，非默认覆盖
- [x] 给出明确的二轮范围建议与顺带修复清单

— END —
