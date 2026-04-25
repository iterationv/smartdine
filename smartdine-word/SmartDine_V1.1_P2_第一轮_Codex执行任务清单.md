# SmartDine V1.1 P2 第一轮 Codex 执行任务清单

- 版本：V1.1 P2 第一轮
- 文档类型：Codex 直接执行清单
- 当前状态：待执行
- 上游依据：
  - `SmartDine_V1.1_P2_文档级任务清单.md`
  - `SmartDine_V1.1_P2_详细任务清单.md`
  - `AGENTS.md`
  - `README.md`
- 适用范围：仅 P2 第一轮，第二轮及之后另行生成

---

## 1. 执行目标

P2 第一轮目标聚焦四件事，不扩张：

1. **工程先清理**：消除构建产物与测试产物对 git diff 的污染，让后续每个任务的 review 不被噪音干扰。
2. **推荐与检索先变可信**：推荐接口不再返回全部 active knowledge；检索在低置信度场景不再过度自信地返回局部命中答案。
3. **问答日志最小可观测**：让运营方能回答"昨天用户问了什么、答得怎么样、有多少次走了兜底"，为后续 AI 配置调整提供数据基础。
4. **AI 配置先做方案**：明确哪些 AI 运行参数应进 Admin、哪些留环境变量、哪些不开放，但本轮不开发完整 Prompt 平台、不落地 AI 配置后台。

第一轮的核心价值不是"做更多功能"，而是让 V1.1 的 FAQ 闭环更像一个可演示、可运营、可继续迭代的产品骨架。

---

## 2. 执行前统一约束

本清单中所有 TASK 必须遵守以下约束。任何 TASK 的具体步骤都不得违反这些约束：

1. 不修改 `.env` / `.env.ai` / `.env.cc` 中的真实密钥。
2. 不引入 RAG、向量库、embedding 实装。
3. 不引入多轮对话上下文记忆。
4. 不引入多账号、多角色、多租户权限体系。
5. 不做 Admin + H5 整体视觉重构。
6. 不做完整 Prompt 平台、不做 Prompt 版本管理、不做 A/B 测试。
7. 不重开 P1 已验收范围。
8. **不执行 `git commit`、不创建分支、不推送，除非用户明确要求。**
9. 所有任务必须可单独验收。
10. 每个任务完成后必须输出验收结果或执行报告。
11. 发现回归问题走回归修复流程，不混入 P2 功能任务。
12. **第一轮范围严格冻结**，本清单未列出的 TASK（P2-05 / P2-07 / P2-08 / P2-09 / P2-10）不得在本轮触碰。

### 2.1 建议执行节奏

**本清单是第一轮总纲,不是单轮交付物。** Codex 执行时按任务包逐个推进,**不要一口气把整份清单作为单次 prompt 输入**。建议节奏:

```text
第一步:执行 TASK-P2-00,输出基线确认,人工 review
第二步:执行 TASK-P2-01,输出工程清理报告,人工 review
第三步:执行 TASK-P2-04,输出样例集,人工 review
第四步:再考虑 TASK-P2-02 / TASK-P2-03(可并行)
第五步:执行 TASK-P2-11A,完成后 review
第六步:执行 TASK-P2-11B(可与 P2-06 并行)
第七步:执行 TASK-P2-06,输出方案文档
```

每个任务包完成后,先验收 → 交叉校验 → 归档问题,再决定是否进入下一包。中间任一阶段发现阻塞,走 `skill-blocker-handling.md` 流程,不强推。

---

## 3. 推荐执行顺序

```text
TASK-P2-00  P2 启动基线确认
   ↓
TASK-P2-01  工程清理
   ↓
TASK-P2-04  推荐与检索回归样例集整理（前置）
   ↓
TASK-P2-02  推荐问题策略升级           ┐
                                       ├ 可并行
TASK-P2-03  检索低置信度与复合问题兜底  ┘
   ↓
TASK-P2-11A 问答日志 + 查询能力(API)
   ↓
TASK-P2-11B Admin 问答日志页面          ← 依赖 11A 的 API 端点
   ↓
TASK-P2-06  AI 模型与 Prompt 配置后台化方案设计
```

关键依赖：

- **TASK-P2-04 必须在 TASK-P2-02 / TASK-P2-03 前完成**：样例集是这两个任务的验收依据，不能让开发者依据自己的实现回头编造样例。
- **TASK-P2-11(A + B) 依赖 TASK-P2-03 的 `confidence` / `fallbackReason` 字段**：日志字段命名必须与 P2-03 完全一致，需在 P2-03 实现时同步对齐。
- **TASK-P2-11B 必须晚于 11A**:Admin 页面依赖 11A 的 `GET /api/admin/qa-events` 端点;11A 完成后可以由不同 thread 并行进入 11B 与 P2-06。
- **TASK-P2-06 只输出方案文档**：本轮不开发 AI 配置后台。是否进入开发由 P2-06 方案明确给出建议，决策延至第二轮。

---

## 4. 每个任务的执行模板

每个 TASK 按以下九段结构组织：

```text
1. 任务目标
2. 读取文件
3. 允许修改文件
4. 禁止修改文件
5. 具体执行步骤
6. 验收标准
7. 风险点
8. 输出报告要求
9. 建议提交信息
```

"允许修改文件"是上限不是必填，"禁止修改文件"是硬约束。

---

## 5. TASK-P2-00：P2 启动基线确认

### 1. 任务目标

确认 P1 收口状态、当前分支状态、运行环境和文档状态，避免 P2 在不稳定基线上启动。

**本任务为只读检查，不修代码、不改配置、不创建分支。**

### 2. 读取文件

- `AGENTS.md`
- `README.md`
- `SmartDine_V1.1_P2_文档级任务清单.md`
- `SmartDine_V1.1_P2_详细任务清单.md`
- `SmartDine V1.1 P1 最终总体验收报告.md`（若存在）
- P1 交叉校验报告（若存在）
- `package.json`（根目录与 `smartdine-api` / `smartdine-admin` / `smartdine-h5` 各自的）

### 3. 允许修改文件

仅允许新建：

- `SmartDine_V1.1_P2_启动基线确认.md`

除该报告外，不允许修改任何已有文件。

### 4. 禁止修改文件

全部源码、配置、环境变量文件均不得修改。

### 5. 具体执行步骤

1. 执行 `git status`，记录当前分支、未提交变更、未跟踪文件。
2. 确认当前分支是 P2 目标分支或 main 最新分支；若不是，记录但不切换。
3. 检查 P1 收口相关 commit 是否已合入（按 P1 验收报告中列出的 commit hash 对照）。
4. 尝试启动三端（不实际占用端口长期运行，仅验证可启动）：
   - `smartdine-api`：`pnpm dev:ai` 或同等命令，检查 `/health` 端点。
   - `smartdine-admin`：启动开发服务器，确认页面可加载。
   - `smartdine-h5`：启动开发服务器，确认页面可加载。
5. 任一端启动失败，记录错误信息但不修复，不中断本任务。
6. 检查 P1 / P2 文档是否齐全。
7. 输出 `SmartDine_V1.1_P2_启动基线确认.md`。

### 6. 验收标准

- `git status` 结果记录完整。
- P1 收口 commit 状态明确（已合入 / 未合入 / 无法确认）。
- API `/health` 检查结果明确。
- Admin / H5 启动状态明确，失败有错误日志。
- P1 / P2 文档清单状态明确。
- 输出文件存在且内容完整。
- **没有任何代码或配置被修改**。

### 7. 风险点

- 三端启动检查可能因端口占用失败，需先确认端口空闲。
- 若仓库存在大量未提交本地改动，需在报告中明示，避免被误认为基线状态。

### 8. 输出报告要求

输出 `SmartDine_V1.1_P2_启动基线确认.md`，结构如下：

```text
# P2 启动基线确认

## 分支与 git 状态
- 当前分支：
- git status 摘要：
- 未跟踪文件清单：

## P1 收口状态
- P1 验收报告：存在 / 不存在
- P1 交叉校验报告：存在 / 不存在
- P1 收口关键 commit：

## 三端可启动状态
- API /health：
- Admin 启动：
- H5 启动：

## 文档状态
- P2 文档级任务清单：
- P2 详细任务清单：
- AGENTS.md / README.md：

## 是否建议启动 P2
- 结论：
- 阻塞项（若有）：
```

### 9. 建议提交信息

本任务不产生 commit。仅生成报告文档。如用户要求提交，使用：

```text
docs(p2): add P2 baseline confirmation report
```

---

## 6. TASK-P2-01：工程清理

### 1. 任务目标

把仍被 git tracking 的构建产物和测试产物移出版本管理，降低后续每次构建、测试造成的脏 diff。

### 2. 读取文件

- `.gitignore`（根目录及各子项目）
- `smartdine-api/dist/`（如存在）
- `smartdine-admin/test-results/`（如存在）
- `smartdine-admin/dist/`、`smartdine-h5/dist/`（如存在）
- `coverage/`、`playwright-report/`（如存在）
- Git 规范相关文档（如 `AGENTS.md` 中的工程规范段落）

### 3. 允许修改文件

- `.gitignore`（根目录及子项目）
- Git 规范文档中的工程清理段落
- 通过 `git rm --cached` 移出 tracking 的产物文件（不删除本地副本）

### 4. 禁止修改文件

- 任何 `src/` 下的源代码
- 任何 `.env` 文件
- 任何配置文件（`tsconfig.json`、`vite.config.ts`、`package.json` 等）
- 任何业务逻辑代码
- 任何测试用例代码（仅可移除测试产物，不可修改测试本身）

### 5. 具体执行步骤

1. 只读检查当前 git tracking 状态。本项目主要在 Windows / PowerShell 环境运行，**优先使用以下命令**：

   ```powershell
   # PowerShell + ripgrep（推荐）
   git ls-files | rg "(dist/|test-results/|coverage/|playwright-report|\.last-run\.json)"
   ```

   若环境无 ripgrep，使用 PowerShell 内置 `Select-String`：

   ```powershell
   git ls-files | Select-String "dist/|test-results/|coverage/|playwright-report|\.last-run\.json"
   ```

   仅在 Linux / macOS 或 Git Bash 环境下使用：

   ```bash
   git ls-files | grep -E "(dist/|test-results/|coverage/|playwright-report/|\.last-run\.json)"
   ```

   **不要混用**:Codex 应根据当前 shell 类型选择对应命令,避免直接调用 `grep` 在 PowerShell 下报错。

2. 列出所有命中的产物文件，确认确实是构建/测试产物，不是源码。
3. 对确认的产物执行 `git rm --cached <path>`，**不带 `-r` 时逐个处理，带 `-r` 时仅对明确的产物目录使用**。
4. 更新 `.gitignore`，确保以下条目存在：

   ```text
   # build outputs
   smartdine-api/dist/
   smartdine-admin/dist/
   smartdine-h5/dist/

   # test outputs
   smartdine-admin/test-results/
   smartdine-admin/playwright-report/
   coverage/
   **/.last-run.json
   ```

5. 同步更新 `AGENTS.md` 或独立 Git 规范文档中过期的工程清理描述。
6. 验证：在 `smartdine-api` 中跑一次 `pnpm build`，确认 `dist/` 不再出现在 `git status` 中。
7. 验证：在 `smartdine-admin` 中跑一次 Playwright（若可用），确认 `.last-run.json` 不再污染 git status。
8. 输出清理报告。

### 6. 验收标准

- `git ls-files` 不再列出 `dist/`、`test-results/`、`coverage/`、`playwright-report/`、`.last-run.json` 相关条目。
- 构建后 `smartdine-api/dist/` 不出现在 git diff 中。
- Playwright 运行后 `.last-run.json` 不污染 git status。
- `.gitignore` 与实际产物一致，无错误规则。
- 没有误删源码文件。
- 没有把真实日志、真实密钥、测试缓存提交。
- Git 规范文档中的工程清理说明与当前 `.gitignore` 一致。

### 7. 风险点

- `git rm --cached` 路径写错可能误移出源码，**每条命令执行前必须先用 `git ls-files <path>` 确认范围**。
- `.gitignore` 规则过宽可能误忽略应提交文件，新增规则后必须 `git status` 复查。
- 本地已有产物与仓库历史不一致时，`git rm --cached` 会显示删除，这是正常的（移出 tracking 但保留本地文件）。

### 8. 输出报告要求

输出 `SmartDine_V1.1_P2_工程清理报告.md`，包含：

```text
# 工程清理报告

## 清理前 git tracking 状态
（git ls-files 命中产物清单）

## 移出 tracking 的文件
（git rm --cached 操作明细）

## .gitignore 变更
（diff 摘要）

## Git 规范文档变更
（变更点）

## 验证结果
- pnpm build 后 git status：
- Playwright 后 git status：
- 误删源码检查：无 / 有（详情）
```

### 9. 建议提交信息

```text
chore(git): remove build and test artifacts from tracking
```

---

## 7. TASK-P2-04：推荐与检索回归样例集整理（前置）

### 1. 任务目标

为 TASK-P2-02 和 TASK-P2-03 建立最小回归样例集，作为这两个任务的验收依据。**本任务必须在 P2-02 / P2-03 启动前完成**。

### 2. 读取文件

- `SmartDine_V1.1_P2_详细任务清单.md`（重点：P2-02、P2-03 的样例段落）
- 现有 KB 数据文件（`smartdine-api` 中的知识库种子数据）
- 现有 `/chat` 与 `/api/suggestions` 的实现代码（仅为理解输入输出，不修改）

### 3. 允许修改文件

- 新建 `smartdine-api/test/fixtures/p2-retrieval-cases.json`（或同等位置）
- 新建 `SmartDine_V1.1_P2_检索回归样例集.md`（人类可读版本）

### 4. 禁止修改文件

- 任何业务代码
- 任何现有测试用例
- KB 种子数据

### 5. 具体执行步骤

1. 阅读详细任务清单中 P2-02、P2-03 的样例段落，理解验收口径。
2. 阅读 KB 种子数据，确认知识库当前覆盖的业务范围。
3. 整理样例集，**至少 30 条**，覆盖：
   - **正常高频问题**（应命中，约 12 条）：推荐菜、支付方式、营业时间、菜品价格、充值/退款、外卖/打包等高频问题。
   - **模糊口语问题**（可能 ambiguous，约 8 条）：多意图混合、表达不清的问题。
   - **极端复合 / 未知条件问题**（应低置信度或 fallback，约 10 条）：含未知实体、含明显不存在的业务、含纯乱码。
4. 每条样例必须包含以下字段：

   ```json
   {
     "id": "case-001",
     "question": "问题原文",
     "expectType": "should_hit | low_confidence | fallback | ambiguous",
     "expectResult": "应命中的知识条目 id（仅 should_hit 类必填）",
     "expectNotContain": ["不应出现的字符串列表"],
     "note": "样例说明"
   }
   ```

5. 同时输出人类可读的 markdown 版本，便于评审。
6. 不实际跑这些样例（实现还没做），仅整理样例本身。

### 6. 验收标准

- 样例总数 ≥ 30 条。
- 三类样例都有覆盖，且 `expectType` 取值在四类内（`should_hit` / `low_confidence` / `fallback` / `ambiguous`）。
- 每条样例字段齐全。
- `should_hit` 类样例的 `expectResult` 在当前 KB 中真实存在。
- `low_confidence` / `fallback` / `ambiguous` 类样例有合理的 `expectNotContain`，避免后续实现绕过校验。
- markdown 版本与 JSON 版本内容一致。
- 样例文件不依赖任何尚未实现的字段。

### 7. 风险点

- 样例若全部由开发者自己编造，容易和后续实现"对答案"。建议至少一半来自 P1 真实日志或 KB 内容衍生。
- 样例不应过度向某一类倾斜，否则会让 P2-02 / P2-03 的验收失真。
- `expectNotContain` 写得过宽会让正常实现也通不过，过窄会让错误实现蒙混过关，需逐条审视。

### 8. 输出报告要求

输出两个文件：

- `smartdine-api/test/fixtures/p2-retrieval-cases.json`
- `SmartDine_V1.1_P2_检索回归样例集.md`

markdown 版本结构：

```text
# P2 检索回归样例集

## 样例分布
- should_hit：N 条
- ambiguous：N 条
- low_confidence：N 条
- fallback：N 条

## 样例清单
（按类型分组列出）

## 使用说明
（如何在 P2-02 / P2-03 验收中使用本样例集）
```

### 9. 建议提交信息

```text
test(api): add retrieval regression cases for P2
docs(p2): add retrieval acceptance cases
```

---

## 8. TASK-P2-02：推荐问题策略升级

### 1. 任务目标

将 `GET /api/suggestions` 从"返回全部 active knowledge"升级为"可控、有限、有排序策略的推荐问题接口"。

### 2. 读取文件

- `smartdine-api` 中 `/api/suggestions` 接口实现及相关 service / repository
- `smartdine-h5` 中 `suggestStore` 与首页推荐展示组件
- `smartdine-api/test/fixtures/p2-retrieval-cases.json`（来自 P2-04）
- 现有 KB 数据结构定义

### 3. 允许修改文件

- `smartdine-api/src/` 下与 suggestions 相关的接口、service、类型定义
- `smartdine-h5/src/` 下 `suggestStore`、首页推荐组件、相关类型定义
- 相关单元测试 / 集成测试文件
- 新增的常量配置文件（如 `smartdine-api/src/config/suggestions.ts`）

### 4. 禁止修改文件

- KB 种子数据（不为了让推荐看起来好看而改数据）
- `/chat` 接口实现（与本任务无关）
- 任何 Admin 端代码
- `.env` 文件
- 数据库 schema（不引入新表）

### 5. 具体执行步骤

#### 后端

1. 在 `smartdine-api/src/config/suggestions.ts` 中定义命名常量：
   - `DEFAULT_SUGGESTION_LIMIT = 8`
   - `MAX_PER_CATEGORY = 3`
   - `FALLBACK_CATEGORY = "通用"`（与 P2-08 后续对齐预留）
2. 改造 `/api/suggestions` 接口：
   - 仅返回 `active = true` 的条目。
   - 默认返回前 N 条（N = `DEFAULT_SUGGESTION_LIMIT`），可通过 query 参数 `limit` 覆盖（设上限 20）。
   - 实现分类均衡：每个分类不超过 `MAX_PER_CATEGORY` 条。
   - `tags` 为空的条目归入 `FALLBACK_CATEGORY`。
   - 排序优先级：显式 `priority` 字段（若存在）→ `createdAt` 倒序 → `id`。
   - 响应每条目附带 `sourceType` 字段，取值 `"active" | "fallback"`，便于前端区分。
3. **不引入热度统计**（第三层策略 P2 不做，但接口字段可预留 `popularity` 位，值为 null）。

#### 前端

1. H5 `suggestStore` 改造：
   - 适配返回数量动态变化。
   - 接口异常时仍使用本地 `FALLBACK_SUGGESTIONS`。
   - 推荐为空时展示空态文案（如"暂无推荐问题，试试直接提问吧"），不显示空白。
2. 分类切换时保持展示稳定（不要每次切换都重发请求）。
3. 不修改首页整体布局与视觉。

#### 测试

1. 添加单元测试覆盖：分类均衡、limit 边界、tags 为空、active 过滤、`sourceType` 正确性。
2. 用 P2-04 样例集中"推荐相关"样例验证。

### 6. 验收标准

- API 不再无脑返回全部 active knowledge。
- 默认返回 8 条，`limit` query 参数可覆盖，上限 20。
- 单分类返回不超过 `MAX_PER_CATEGORY` 条。
- `tags` 为空时归入 `FALLBACK_CATEGORY`，不导致前端异常。
- 响应每条包含 `sourceType` 字段。
- 老接口调用方不被破坏（无 `limit` 参数时行为可预期）。
- H5 接口异常时 fallback 生效，不空屏。
- H5 推荐为空时有合理空态。
- P2-04 样例集中推荐相关样例全部通过。
- 所有阈值以命名常量存在，无魔法数字。

### 7. 风险点

- 分类均衡算法若实现不稳定，可能在数据边界上抖动，需要稳定排序兜底。
- `MAX_PER_CATEGORY` 太小可能导致返回数不足 `DEFAULT_SUGGESTION_LIMIT`，需补充"先按均衡填充，不足再放宽"的回退策略。
- H5 端 `FALLBACK_SUGGESTIONS` 与 API `FALLBACK_CATEGORY` 命名不一致是后续 P2-08 的范围，本任务不强求统一，但需在代码注释中标记 TODO。

### 8. 输出报告要求

输出 `SmartDine_V1.1_P2_TASK-02_执行报告.md`，包含：

```text
# TASK-P2-02 执行报告

## 接口变更
- 路径：
- 入参变更：
- 出参变更：
- 新增字段：

## 常量定义
（列出新增常量及取值）

## H5 适配
- suggestStore 变更点：
- 空态处理：
- fallback 行为：

## P2-04 样例验证
- 推荐类样例通过率：
- 失败样例（若有）：

## 已知遗留
- 与 P2-08 待对齐项：
```

### 9. 建议提交信息

```text
feat(api): improve suggestion ranking and limit strategy
feat(h5): adapt suggestion display to ranked suggestions
test(api): cover suggestion ranking edge cases
```

---

## 9. TASK-P2-03：检索低置信度与复合问题兜底

### 1. 任务目标

减少极端复合问题、未知条件混入问题导致的误答，让系统在不确定时能提示、澄清或降级，而不是过度自信地返回局部命中答案。

### 2. 读取文件

- `smartdine-api` 中 `/chat` 接口实现及检索链路（BM25 / 关键词匹配相关代码）
- `smartdine-h5` 中聊天回答展示组件
- `smartdine-api/test/fixtures/p2-retrieval-cases.json`（来自 P2-04）

### 3. 允许修改文件

- `smartdine-api/src/` 下检索、`/chat` 处理、响应类型定义
- 新建 `smartdine-api/src/retrieval/confidence.ts`（信号判定与阈值集中处理）
- `smartdine-h5/src/` 下聊天展示组件、低置信度提示组件
- 相关测试文件

### 4. 禁止修改文件

- KB 种子数据
- 任何 Admin 端代码
- `.env` 文件
- `/api/suggestions` 接口（属于 P2-02）
- 现有 `/chat` 接口的基础响应结构（仅可扩展字段，不可改原字段命名）

### 5. 具体执行步骤

#### 信号定义

在 `smartdine-api/src/retrieval/confidence.ts` 中定义：

```ts
// ⚠️ 以下三个常量是【初始候选值,不是最终值】
// 必须基于 TASK-P2-04 样例集回归结果调整,并在执行报告中说明:
//   - 调整后的最终值
//   - 调整依据(哪些样例触发了什么调整)
//   - 调整轮次(每轮回归的样例通过率变化)
export const LOW_CONFIDENCE_ABS_THRESHOLD = 0.3;       // 初始候选值
export const LOW_CONFIDENCE_GAP_RATIO = 0.15;          // 初始候选值
export const UNKNOWN_ENTITY_TOKEN_THRESHOLD = 2;       // 初始候选值

export type ConfidenceLevel = "high" | "low" | "ambiguous" | "unknown_entity";
export type FallbackReason =
  | "low_absolute_score"
  | "small_gap_between_top1_top2"
  | "unknown_entity_in_query"
  | null;
```

**禁止在判定函数中写魔法数字**，所有阈值必须引用上述常量。

**严禁直接硬套初始候选值就声明任务完成**:三个阈值必须经过 P2-04 样例集至少一轮回归校准,否则极易把正常问题误判为低置信度。校准过程与最终取值必须写入执行报告(详见第 8 节"输出报告要求")。

#### 信号优先级（在判定函数中按此顺序判断）

1. **信号 3：未知实体占比过高**
   - 对 query 做最简分词（按现有分词逻辑，不引入新分词器）。
   - 若有 ≥ `UNKNOWN_ENTITY_TOKEN_THRESHOLD` 个 token 在所有候选文档的 tags / 问题 / 答案中均无任何匹配，判定为 `unknown_entity`。
2. **信号 1：top1 绝对分过低**
   - `top1.score < LOW_CONFIDENCE_ABS_THRESHOLD` → `low`。
3. **信号 2：top1 与 top2 分差过小**
   - `(top1.score - top2.score) / top1.score < LOW_CONFIDENCE_GAP_RATIO` → `ambiguous`。
4. 都不触发 → `high`。

#### 响应字段扩展

`/chat` 响应在原有结构基础上扩展：

```ts
{
  // 原有字段保持不变
  confidence: "high" | "low" | "ambiguous" | "unknown_entity",
  fallbackReason: FallbackReason,
  candidates?: Array<{ question: string; id: string }>, // 仅 ambiguous 时返回
}
```

#### 兜底话术（默认常量，后续可被 P2-07 接管）

- `low` → `"我不太确定你问的是不是「{topMatchTopic}」。你可以换一种问法，或者点击下面的推荐问题。"`
- `ambiguous` → 返回 `candidates`，前端展示候选列表。
- `unknown_entity` → `"目前知识库中没有找到「{unknownTokens}」的相关说明。{availableTopicHint}"`

#### H5 适配

1. 根据 `confidence` 字段展示不同样式：
   - `high`：正常展示。
   - `low`：在回答前加"我不太确定"前缀（视觉上可加一个提示图标）。
   - `ambiguous`：展示候选列表，用户点击后重发请求。
   - `unknown_entity`：以提示样式展示，不伪装成确定答案。
2. 不修改聊天主布局。

#### 测试

1. 单元测试覆盖三类信号判定函数。
2. 用 P2-04 样例集回归：
   - `should_hit` 类通过率 ≥ 95%。
   - `low_confidence` 类触发预期信号比例 ≥ 80%。
   - `fallback` 类不输出业务确定性答案。
   - `ambiguous` 类返回 `candidates`。

### 6. 验收标准

- 三类判定信号在 `confidence.ts` 中以命名常量存在，无魔法数字。
- **三个阈值常量必须经过 P2-04 样例集至少一轮回归校准**，执行报告中包含校准过程与最终取值;直接使用初始候选值(0.3 / 0.15 / 2)而未做任何回归视为未通过验收。
- 信号优先级与文档定义一致（unknown_entity > low > ambiguous）。
- 极端复合问题不再返回确定性误答。
- 常规问题命中不受明显影响（P2-04 should_hit 类通过率 ≥ 95%）。
- 低置信度场景响应包含 `confidence` 与 `fallbackReason` 字段。
- ambiguous 时返回 `candidates`。
- H5 能根据 confidence 展示对应策略。
- P1 已验证的高频问题不大面积回退（回归通过率 ≥ 90%）。
- `/chat` 原有字段未改名，老调用方不受影响。

### 7. 风险点

- 阈值初始值（0.3 / 0.15）是经验估计，最终值需通过 P2-04 样例集回归调整。**调整后的最终值必须写入执行报告**。
- 分词逻辑若复用 BM25 内部实现，需注意停用词处理，避免"的""了"等被当作未知 token。
- `unknownTokens` 直接回显到提示文案有风险（用户输入的脏话也会被回显），需做基础过滤或仅显示前 N 个。
- `candidates` 的展示数量需限制（建议 ≤ 3），避免列表过长。

### 8. 输出报告要求

输出 `SmartDine_V1.1_P2_TASK-03_执行报告.md`，包含：

```text
# TASK-P2-03 执行报告

## 信号常量最终值与校准过程
- LOW_CONFIDENCE_ABS_THRESHOLD：
  - 初始候选值：0.3
  - 最终值：
  - 调整依据：（哪些样例触发了调整）
- LOW_CONFIDENCE_GAP_RATIO：
  - 初始候选值：0.15
  - 最终值：
  - 调整依据：
- UNKNOWN_ENTITY_TOKEN_THRESHOLD：
  - 初始候选值：2
  - 最终值：
  - 调整依据：

## 阈值校准轮次记录
| 轮次 | 阈值组合 | should_hit 通过率 | low_confidence 触发率 | 调整原因 |
|---|---|---|---|---|
| 1 | (0.3 / 0.15 / 2) | | | 初始 |
| 2 | | | | |
| ... | | | | |

## 响应字段变更
- 新增 confidence：
- 新增 fallbackReason：
- 新增 candidates（仅 ambiguous）：

## 兜底话术
（三类策略最终文案）

## P2-04 样例最终验证
- should_hit 通过率：
- low_confidence 触发率：
- fallback 不误答率：
- ambiguous candidates 返回率：

## P1 高频问题回归
- 回归样例数：
- 通过率：

## 与 P2-11 的字段对齐
- confidence 字段命名：（用于日志）
- fallbackReason 字段命名：（用于日志）
```

### 9. 建议提交信息

```text
feat(api): add low-confidence fallback for retrieval
feat(h5): display low-confidence answer hints
test(api): cover confidence signal detection
```

---

## 10. TASK-P2-11：问答可观测性最小化

> **执行粒度说明**:本任务范围属于第一轮,但实现量较大(API 写入 + 切分 + 查询脚本 + 查询 API + Admin 页面 + 筛选 + 测试),为提升执行稳定性与验收清晰度,**拆分为两个 Codex 执行 thread**:
>
> - **TASK-P2-11A**:API 问答日志 + 查询能力(后端)
> - **TASK-P2-11B**:Admin 问答日志页面(前端)
>
> 这是执行粒度拆分,**不是 P2 范围调整**。两个子任务都属于第一轮,必须在第一轮完成。
>
> **执行顺序**:11A 先于 11B,11B 依赖 11A 提供的查询端点。

---

### 10.A TASK-P2-11A:API 问答日志 + 查询能力

#### 1. 任务目标

在 P2-03 引入 `confidence` 字段的基础上,建立结构化日志写入与查询基础设施,让运营方能够通过命令行或 API 查询问答事件。

#### 2. 读取文件

- `smartdine-api` 中 `/chat` 与 `/api/suggestions` 的实现
- TASK-P2-03 中定义的 `confidence` / `fallbackReason` 字段
- `AGENTS.md` 中关于日志规范的现有约定(若有)

#### 3. 允许修改文件

- `smartdine-api/src/` 下日志中间件、`/chat` 处理逻辑、查询端点
- 新建 `smartdine-api/src/logging/qa-events.ts`
- 新建日志查询脚本 `smartdine-api/scripts/query-qa-events.ts`
- API 相关测试文件
- `.gitignore`(确保 `logs/` 目录不进 git)

#### 4. 禁止修改文件

- TASK-P2-03 已实现的 `/chat` 核心逻辑(仅可在外层包裹日志中间件,不改业务代码)
- KB 数据
- `.env` 文件中的真实密钥
- **任何 Admin 前端代码**(归属 11B)

#### 5. 具体执行步骤

1. 在 `smartdine-api/src/logging/qa-events.ts` 中实现:
   - 日志条目类型定义(字段见下)。
   - 异步追加写入 `logs/qa-events-YYYY-MM-DD.jsonl`(按日期切分)。
   - 写入失败 try-catch 包住,**绝不影响主链路返回**。
   - query 脱敏函数:超过 100 字符的截断为前 100 字符 + 省略号;不做 PII 检测(V1.1 范围外)。

2. 日志条目字段(与 P2-03 字段名严格一致):

   ```ts
   {
     requestId: string;
     timestamp: string; // ISO 8601
     queryDigest: string; // 脱敏后的 query
     queryLength: number;
     confidence: "high" | "low" | "ambiguous" | "unknown_entity";
     fallbackReason: string | null;
     topMatchId: string | null;
     topScore: number | null;
     duration: number; // 毫秒
   }
   ```

3. 在 `/chat` 响应返回前异步写入日志(不阻塞响应)。
4. 实现日志查询端点 `GET /api/admin/qa-events`:
   - 受现有 Admin 拦截器保护(P2-05 完成前可临时复用 P1 登录拦截)。
   - 支持 query 参数:`date`(默认当天)、`confidence`(可选筛选)、`page`、`pageSize`(上限 100)。
   - 返回分页数据。
5. 实现命令行查询脚本(兜底,便于运维直接查文件):

   ```bash
   pnpm tsx scripts/query-qa-events.ts --date 2026-04-25 --confidence low
   ```

6. `.gitignore` 加入 `logs/` 目录。
7. 文档说明日志保留策略:本地保留 30 天,超期由运维手动清理(V1.1 不做自动清理)。

#### 6. 验收标准

- `/chat` 调用后,`logs/qa-events-YYYY-MM-DD.jsonl` 中能找到对应的结构化记录。
- 日志条目字段名与 P2-03 完全一致(`confidence` / `fallbackReason`)。
- 日志按日期切分。
- 日志写入失败不影响 `/chat` 主链路返回(可通过 mock 写入失败验证)。
- 命令行查询脚本可用,支持 `--date` 与 `--confidence` 参数。
- `GET /api/admin/qa-events` 端点可用,支持筛选与分页,pageSize 上限 100。
- `logs/` 目录在 `.gitignore` 中。
- query 脱敏生效(≥ 100 字符截断)。
- 文档说明日志位置、字段结构、查询方式。

#### 7. 风险点

- 同步写入会拖慢响应。**必须使用异步写入或 fire-and-forget 模式**。
- 日志体积控制:30 天保留约束需在文档中明确,避免磁盘溢出。
- `queryDigest` 字段命名若与 P2-03 内部命名冲突,以 P2-03 为准,本任务跟随。
- 日志查询端点若返回大量数据会内存膨胀,必须强制分页(pageSize 上限 100)。

#### 8. 输出报告要求

输出 `SmartDine_V1.1_P2_TASK-11A_执行报告.md`,包含:

```text
# TASK-P2-11A 执行报告

## 日志规格
- 日志位置:
- 切分方式:
- 字段清单:
- 脱敏策略:

## 写入机制
- 同步 / 异步:
- 失败处理:
- 性能影响测试:

## 查询能力
- 命令行脚本:
- API 端点:
- 分页上限:

## 与 P2-03 字段对齐验证
- confidence 命名一致性:
- fallbackReason 命名一致性:

## 11B 接入说明
- 提供给 11B 的 API 契约:
- 已知约束(分页、筛选):
```

#### 9. 建议提交信息

```text
feat(api): add minimal qa event logging
feat(api): add qa events query endpoint and cli
chore(git): exclude logs directory from tracking
```

---

### 10.B TASK-P2-11B:Admin 问答日志页面

#### 1. 任务目标

基于 11A 提供的查询端点,在 Admin 中新增只读"问答日志"页面,支持基础筛选与分页。

#### 2. 前置依赖

- **11A 必须先完成**:本任务依赖 `GET /api/admin/qa-events` 端点。
- 11A 的执行报告中"11B 接入说明"段落必须就绪,确认 API 契约。

#### 3. 读取文件

- `smartdine-admin` 中现有页面结构、路由配置、主导航组件
- 11A 输出的 `GET /api/admin/qa-events` 端点契约
- 11A 执行报告

#### 4. 允许修改文件

- `smartdine-admin/src/` 下新增"问答日志"页面、路由配置、主导航
- Admin 端测试文件

#### 5. 禁止修改文件

- 任何 API 代码(归属 11A,本任务不动)
- 任何与日志无关的 Admin 页面
- `.env` 文件

#### 6. 具体执行步骤

1. 新增"问答日志"页面:
   - 路由:`/qa-events` 或同等路径,放在主导航"知识管理"之后。
   - 列表展示:时间、query 摘要、confidence(带颜色标签)、fallbackReason、topMatchId、耗时。
   - 筛选器:confidence 多选(4 类)、日期范围选择器(默认今天)。
   - 分页:每页 20 条。
   - 不做导出、不做图表、不做实时刷新。
2. 页面入口受现有 Admin 拦截器保护,P2-05 完成后无需额外改动即可切换到 JWT 认证。
3. 加端到端验证:调用 `/chat` 后能在 Admin 页面看到对应记录。

#### 7. 验收标准

- Admin "问答日志"页面存在,路由可访问。
- 列表字段齐全(时间、query 摘要、confidence、fallbackReason、topMatchId、耗时)。
- confidence 多选筛选生效。
- 日期范围筛选生效,默认当天。
- 分页生效,每页 20 条。
- 不做导出、图表、实时刷新(按约定不超范围)。
- 与 11A 查询端点共用同一份数据,不存在不一致。
- 端到端验证通过:调用 `/chat` 后页面可见对应记录。
- 页面入口受认证保护。

#### 8. 风险点

- Admin 页面在 P2-05 完成前临时复用 P1 拦截,需在 P2-05 完成时验证无缝切换,不能遗留旧拦截逻辑。
- 列表字段命名应与 11A 日志字段保持一致,避免出现两套命名(如前端用 `time` 后端用 `timestamp`)。
- 日期范围跨多天时,前端应分别请求各天数据或确认 API 支持范围查询(以 11A 实际契约为准)。

#### 9. 输出报告要求

输出 `SmartDine_V1.1_P2_TASK-11B_执行报告.md`,包含:

```text
# TASK-P2-11B 执行报告

## 页面规格
- 路由:
- 主导航位置:
- 列表字段:
- 筛选器:
- 分页规格:

## 与 11A 的对接
- 使用的 API 端点:
- 字段映射:
- 已知约束:

## 端到端验证
- 测试场景:
- 验证结果:

## 与 P2-05 的过渡策略
- 当前认证拦截:
- P2-05 后切换路径:
```

#### 10. 建议提交信息

```text
feat(admin): add read-only qa events page
```

---

## 11. TASK-P2-06：AI 模型与 Prompt 配置后台化方案设计

### 1. 任务目标

形成一份 AI 配置后台化方案文档，明确哪些 AI 运行参数应由 Admin 管理、哪些仍由环境变量控制、哪些暂不开放。**本任务只输出方案文档，不开发代码**。

### 2. 读取文件

- `smartdine-api` 中现有 AI 调用链路（`/chat` 中的 AI 部分）
- `.env.ai` / `.env.example` 中现有 AI 相关环境变量
- `AGENTS.md` 中关于 AI 配置的现有约定
- `SmartDine_V1.1_P2_详细任务清单.md` 中 P2-06 段落
- TASK-P2-11 的字段定义（用于设计配置变更日志）

### 3. 允许修改文件

仅允许新建：

- `SmartDine_V1.1_P2_AI配置后台化方案.md`

### 4. 禁止修改文件

- 任何业务代码
- 任何配置文件
- 任何 `.env` 文件
- 任何前端代码

**本任务仅产出方案文档，零代码改动。**

### 5. 具体执行步骤

1. 阅读现有 AI 调用链路代码，画出调用链路图（文字形式即可）。
2. 列出现有所有 AI 相关配置项及其来源（环境变量 / 代码常量 / 硬编码）。
3. 按字段分层归类：
   - **仍由环境变量控制**：API Key、Base URL、是否启用 AI、生产环境密钥。
   - **可由 Admin 配置**：模型供应商显示名、模型名、系统提示词、回答风格、兜底话术（与 P2-03 三类策略对应）、低置信度提示话术、是否优先知识库回答、最大输出长度、温度参数（若模型支持）。
   - **暂不开放**：API Key 明文编辑、多模型路由、A/B 测试、Prompt 版本管理、自动评测、用户画像。
4. 设计 Admin 配置页信息架构（仅设计，不实现）：
   - 页面布局草图（文字描述）。
   - 字段分组。
   - 敏感字段隐藏策略。
5. 设计 API 配置读取策略：
   - 配置存储位置（建议 `data/ai-config.json`，JSON 文件）。
   - 启动时加载到内存。
   - 更新时重新加载或热更新（明确选哪种）。
6. 设计默认值与回滚策略：
   - 配置文件不存在 / 损坏时使用代码内默认值。
   - "恢复默认"按钮的行为。
7. 设计配置变更与 P2-11 日志的联动：
   - 配置变更写入 qa-events 日志或独立 admin-events 日志（明确选哪种）。
   - 字段命名（与 P2-11 字段风格一致）。
8. 安全边界：
   - API Key 永不返回前端。
   - Prompt 长度上限。
   - 温度参数取值范围限制。
9. **明确给出 P2-07 是否进入开发的建议**，**不允许使用"待定"**。建议格式：
   - "建议进入 P2 第二轮开发，理由：……"
   - 或 "建议推迟到 P3，理由：……"
   - 或 "建议不开发，仅以环境变量管理，理由：……"
10. 输出方案文档。

### 6. 验收标准

- 方案文档独立成文，文件名为 `SmartDine_V1.1_P2_AI配置后台化方案.md`。
- 包含所有十一个章节（调用链路、配置来源、可后台化字段、不应后台化字段、Admin 信息架构、读取策略、默认值与回滚、生效策略、安全边界、与 P2-11 联动、P2-07 建议）。
- 字段分层清晰，每类至少 3 个字段。
- API Key 明确不开放后台编辑。
- 默认值与回滚策略可执行。
- 与 P2-11 联动方式有具体字段命名。
- **P2-07 是否开发的建议明确，不能用"待定"或"视情况而定"敷衍**。
- 零代码改动（除新建方案文档外）。
- 方案不引入完整 Prompt 平台、不引入多模型路由、不引入 A/B 测试。

### 7. 风险点

- 字段分层过于宽松会导致 P2-07 范围爆炸。建议遵循"P2 内能落地的才放入'可由 Admin 配置'"。
- 配置热更新若设计为"保存即生效"，需要明确并发场景下的覆盖策略。
- 与 P2-11 联动若使用同一个 jsonl 文件会污染问答日志，建议独立文件（如 `logs/admin-events-YYYY-MM-DD.jsonl`）。
- "P2-07 是否开发"的建议必须基于本方案的复杂度自评，不能纯按用户偏好。

### 8. 输出报告要求

输出 `SmartDine_V1.1_P2_AI配置后台化方案.md`，建议结构：

```text
# SmartDine V1.1 P2 AI 配置后台化方案

## 1. 当前 AI 调用链路
（文字流程图）

## 2. 当前配置来源梳理
（表格：字段 / 来源 / 是否敏感）

## 3. 可后台化字段清单
## 4. 不应后台化字段清单
## 5. 暂不开放字段清单

## 6. Admin 配置页信息架构
（页面布局描述、字段分组、敏感字段隐藏策略）

## 7. API 配置读取策略
## 8. 默认值与回滚策略
## 9. 配置变更生效策略
## 10. 安全边界

## 11. 与 TASK-P2-11 日志的联动
（字段命名、写入位置、与 qa-events 的关系）

## 12. P2-07 是否进入开发的建议
- 结论（必填，不允许"待定"）：
- 理由：
- 若进入开发，最小落地范围：
- 若不开发，环境变量管理边界：

## 附录
- 引用文件清单
- 与 P2-03 / P2-11 的字段对齐表
```

### 9. 建议提交信息

```text
docs(p2): design AI configuration management
```

---

## 12. 第一轮不纳入的 TASK

以下 TASK 在本轮**严格冻结**，Codex 在执行第一轮过程中**不得**触碰：

| TASK | 名称 | 不纳入原因 |
|---|---|---|
| TASK-P2-05 | Admin 真实认证最小化改造 | 涉及前后端鉴权改造，需独立排期；P2-11 第一轮 Admin 页面临时复用 P1 拦截 |
| TASK-P2-07 | AI 配置后台化最小落地 | 是否开发由 P2-06 方案明确建议后再决定 |
| TASK-P2-08 | H5 推荐分类 fallback 口径同步 | 低优先级一致性问题，不抢主线 |
| TASK-P2-09 | Admin bundle 拆包优化 | 性能优化，不影响功能可用性 |
| TASK-P2-10 | Query Rewrite 自然样例收益验证 | 依赖 KB 扩展或向量检索条件未成熟 |

如执行第一轮过程中触发上述 TASK 相关需求，按 P2 详细任务清单第三节 3.3 "范围冻结与变更登记"流程登记，**不在第一轮内消化**。

---

## 13. 第一轮总体验收

第一轮执行完毕后，按以下清单整体验收：

### 13.1 工程治理

- [ ] 构建产物不再污染 git status
- [ ] 测试产物不再污染 git status
- [ ] `.gitignore` 与实际产物一致
- [ ] 没有误删源码

### 13.2 推荐体验

- [ ] `/api/suggestions` 不再返回全部 active knowledge
- [ ] 默认推荐数量受控
- [ ] 分类均衡生效
- [ ] H5 fallback 与空态可用

### 13.3 检索可信度

- [ ] 三类信号常量化，无魔法数字
- [ ] should_hit 类样例通过率 ≥ 95%
- [ ] low_confidence / fallback 类样例不输出确定性误答
- [ ] ambiguous 类返回 candidates
- [ ] P1 高频问题回归通过率 ≥ 90%

### 13.4 可观测性

11A(API):

- [ ] 问答事件结构化日志可用
- [ ] 日志按日期切分
- [ ] 写入失败不影响主链路
- [ ] 命令行查询脚本可用
- [ ] `GET /api/admin/qa-events` 端点可用,支持筛选与分页
- [ ] 字段与 P2-03 完全对齐

11B(Admin):

- [ ] Admin "问答日志"页面可用,路由可访问
- [ ] confidence 多选筛选生效
- [ ] 日期范围筛选生效
- [ ] 端到端验证通过(`/chat` 调用后页面可见对应记录)

### 13.5 AI 配置方案

- [ ] AI 配置后台化方案文档已输出
- [ ] 字段分层清晰
- [ ] P2-07 是否开发的建议明确（无"待定"）
- [ ] 零代码改动

### 13.6 范围控制

- [ ] 第一轮不纳入的 TASK 未被触碰
- [ ] 范围漂移项（若有）已登记到 `SmartDine_V1.1_P2_变更登记.md`

---

## 14. 后续动作

第一轮执行 + 验收 + 交叉校验完成后：

1. 输出 `SmartDine_V1.1_P2_第一轮验收报告.md`。
2. 根据 P2-06 方案中关于 P2-07 的建议，决定第二轮范围。
3. 生成 `SmartDine_V1.1_P2_第二轮_Codex执行任务清单.md`（候选范围：P2-05 + 视情况 P2-07）。
4. 第三轮再生成对应清单（候选范围：P2-08 + P2-09）。
5. P2-10 持续保持暂缓状态，触发条件满足后再启动。

不在第一轮完成前生成第二轮、第三轮清单，避免范围漂移。
