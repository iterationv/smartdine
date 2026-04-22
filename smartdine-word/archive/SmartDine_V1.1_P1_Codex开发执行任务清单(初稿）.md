# SmartDine V1.1 P1 任务清单（Codex 可直接执行版）

> 用途：本文件用于将 P1 任务直接拆分为可执行包，供 Codex / Claude Code 在单个 Thread 中按包执行。
> 
> 约束：
> - 仅作为 **P1 执行版任务清单**，不替代 AGENTS.md、CLAUDE.md、GIT_RULES.md、GIT_RULES_CLAUDE.md。
> - 执行前必须先读取：`AGENTS.md`、`CLAUDE.md`、`GIT_RULES.md`、`GIT_RULES_CLAUDE.md`。
> - 全程 **不修改任何 .env / .env.ai / 生产数据文件**。
> - 执行粒度与提交粒度分离：包内允许多次 build / 联调 / 修正，整包验收通过后一次性提交。
> - 除执行包 A 的工程清理任务外，不处理与 P1 无关的重构。

---

## 一、P1 总目标

在 P0 已完成基础问答闭环的前提下，进入 P1 产品骨架完善阶段，完成以下三类增强：

1. **后端检索增强**：提升自然语言问法下的命中准确率与排序质量。
2. **Admin 运营闭环**：将未命中问题转化为可运营、可沉淀、可追踪的知识建设入口。
3. **H5 场景优化**：让用户端从“能问能答”升级为“更易问、更易看、更易继续操作”。

---

## 二、执行包总览

| 执行包 | 范围 | 性质 | 依赖 | 推荐 scope |
|---|---|---|---|---|
| 执行包 A | 纯后端：Query Rewrite / BM25 / Rerank / 向量检索预留 / 工程清理 | 必做 | 无 | `api` |
| 执行包 B | Admin：Dashboard 增强 / 未命中转知识条目 / handled 字段 | 必做 | 依赖 A 完成 | `admin` 或 `multi` |
| 执行包 C | H5：推荐问题接口化 / 分类 Tab / 相关推荐 / 结果页跳转预留 | 必做 | 可与 B 并行 | `h5` 或 `multi` |

> 推荐执行顺序：**A →（B 与 C 并行）**

---

## 三、执行前统一要求（所有执行包通用）

### 1. 启动与环境

- API 使用 `smartdine-api` 下 `npm run dev:ai`，目标端口 `3300`
- Admin 使用 `smartdine-admin` 下 `npm run dev:ai`，目标端口 `5274`
- H5 使用 `smartdine-h5` 下 `npm run dev:ai`，目标端口 `5273`
- 根目录无 `package.json`，禁止在根目录执行 npm 命令

### 2. 验证要求

每个执行包至少完成：

- 类型 / 构建验证（按所在端执行）
- 关键接口自测
- 至少 1 轮链路验证
- 提交前 `git status --short` 清理

### 3. Git 要求

- 一个执行包一个 commit
- 先输出变更总结，再执行 `git add <specific-file>` 和 `git commit`
- `questionLogs.json`、`missedQuestions.json` 在执行包 A 收口前按过渡规则处理；A 收口时完成移出 tracking

---

# 执行包 A（纯后端）

> 目标：把 P0 的“bigram + alias 基础命中”升级为“rewrite + 检索评分 + rerank + 扩展接口预留”的 P1 后端能力基座。

---

## TASK-A1：Query Rewrite（未命中改写重试）

### 目标

在第一次知识匹配未命中时，对用户原始问题做一次轻量改写，再尝试第二次匹配；若仍未命中，再进入 AI fallback。

### 范围

- 改写仅限轻量规则，不引入外部模型
- 只处理高频口语冗词、礼貌词、主语包装词
- 不允许把原问题语义改写到偏离原意

### 建议涉及文件

- `smartdine-api/src/ai/retrieve.ts`
- `smartdine-api/src/ai/matchKnowledge.ts`
- `smartdine-api/src/ai/` 下新增改写模块（文件名由执行者按现有命名风格确定）
- `smartdine-api/src/types/` 下按需补充类型

### 具体要求

1. 保留原始 `question` 作为第一轮匹配输入。
2. 第一轮 `matchKnowledge(question)` 未命中时，再对 `question` 执行 rewrite。
3. 若 rewrite 结果与原问题等价或为空，则不做第二轮。
4. 第二轮使用 rewrite 后的问题再次匹配。
5. 若第二轮命中，返回结果中应能保留“原问题”和“改写后问题”的可追踪信息，供后续日志或调试使用。
6. 未命中时仍走原有 AI fallback，不改变 `/chat` 的基础响应契约。

### 建议 rewrite 处理方向

- 去礼貌词：如“请问”“你好”“麻烦问下”
- 去包装词：如“你们”“这里”“食堂里”“有没有”“有什么”
- 保留核心关键词：如“推荐菜”“退款规则”“营业时间”
- 只做规则型 rewrite，不做 LLM 改写

### 验收标准

- “你们有什么推荐菜？”这类问法，在不改知识数据的前提下，命中准确率提升
- rewrite 不影响原本可直接命中的问题
- `/chat` 基础响应结构不被破坏
- 关键日志或调试信息中可区分 original query 与 rewritten query

### 依赖关系

- 无前置依赖
- 为 TASK-A2 / TASK-A3 提供更稳定的输入基础

---

## TASK-A2：BM25 混合检索并入现有 retrieve 链路

### 目标

将现有偏简单的 bigram 交集命中逻辑，升级为更适合问答检索的小规模 BM25 评分能力，并并入当前 retrieve / match 链路。

### 范围

- 以现有知识条目为语料库
- 允许继续复用现有 normalize/tokenize 思路
- 不引入数据库，不引入外部搜索服务

### 建议涉及文件

- `smartdine-api/src/ai/matchKnowledge.ts`
- `smartdine-api/src/ai/` 下新增 BM25 评分模块
- `smartdine-api/src/data/knowledgeStore.ts`
- 按需补充 `types`

### 具体要求

1. 保留现有知识加载方式，不改数据源位置。
2. 以知识标题、question、aliases、tags 等可检索文本为语料基础。
3. 将“候选召回 + 分数计算”与“最终返回最佳候选”分开组织，避免后续 rerank 难以插入。
4. BM25 结果至少输出：
   - 候选条目 id
   - 原始检索分数
   - 命中的文本证据或命中来源（如主问题/别名/标签）
5. 不要求一次性删除所有旧逻辑，但最终主流程必须以 BM25 结果为核心输入。
6. 兼容小规模语料场景，不追求搜索系统级别复杂度。

### 验收标准

- 推荐类问法、近义问法、口语问法的基础召回更稳定
- 相比原有简单交集计数，候选排序更符合语义直觉
- 代码结构上已为 rerank 留出明确插入点

### 依赖关系

- 建议在 TASK-A1 之后进行
- 为 TASK-A3 提供候选集与基础分数

---

## TASK-A3：Rerank（对检索结果重排序）

### 目标

针对 BM25 候选集进行二次排序，解决“高频虚词与业务关键词同权”“同分时靠顺序取胜”等问题。

### 范围

- 仅针对检索候选集重排，不引入外部 rerank 模型
- 允许使用规则加权：alias 命中加权、tag 命中加权、question 精确度加权

### 建议涉及文件

- `smartdine-api/src/ai/matchKnowledge.ts`
- `smartdine-api/src/ai/` 下新增 rerank 模块
- 按需补充类型

### 具体要求

1. 将 BM25 召回出的前 N 个候选输入 rerank。
2. rerank 至少考虑：
   - alias 是否直接命中
   - question 是否更接近用户核心表达
   - tags 是否命中业务关键词
   - rewrite 前后输入的一致性参考
3. 明确主排序分数与 rerank 修正分数的结构，避免魔法数字分散在多个文件中。
4. 最终最佳条目应基于 rerank 后结果返回。
5. 对关键误判样例（如“你们有什么推荐菜？”）做定向验证。

### 验收标准

- “推荐菜”相关问题优先命中推荐类知识条目，而不是因为“有什么”这类高频词误命中普通菜品条目
- 同分时不再简单按知识文件出现顺序决定结果
- rerank 逻辑可解释，可通过日志或调试信息查看重排依据

### 依赖关系

- 依赖 TASK-A2 提供候选集
- 可利用 TASK-A1 的 rewrite 信息提升排序质量

---

## TASK-A4：向量检索函数签名预留（只定义接口，不实现）

### 目标

为 P2 可能接入 embedding / 向量检索做最小预留，但本次不接第三方服务，不实现向量检索逻辑。

### 范围

- 只定义函数签名、输入输出类型、占位实现
- 不接 SDK，不加依赖，不改主链路行为

### 建议涉及文件

- `smartdine-api/src/ai/` 下新增向量检索占位文件
- `smartdine-api/src/types/` 下按需补充类型

### 具体要求

1. 设计清晰的函数签名，至少表达：输入 query、候选数量、返回候选列表。
2. 当前实现可直接抛出 `Not implemented`，或返回空候选，但必须明确说明未启用。
3. 不允许在当前 `/chat` 主链路中默认调用该占位逻辑。
4. 代码结构上能让 P2 接入时直接落位，不需要重新拆文件。

### 验收标准

- 新增向量检索预留不影响现有功能
- 类型定义和文件位置清晰，后续可直接接入 embedding 检索

### 依赖关系

- 无强依赖
- 建议在 A 收口前一并完成

---

## TASK-A5：工程清理（questionLogs.json / missedQuestions.json 移出 git tracking）

### 目标

将运行时数据文件从 git tracking 中移出，并纳入 `.gitignore`，结束当前过渡期 restore 规则。

### 范围

- 仅处理运行时日志文件 tracking 问题
- 同步更新对应规范文档中的状态描述

### 建议涉及文件

- `.gitignore`
- `GIT_RULES_CLAUDE.md`
- git index（通过 `git rm --cached`）

### 具体要求

1. 将以下文件移出 tracking：
   - `smartdine-api/src/data/questionLogs.json`
   - `smartdine-api/src/data/missedQuestions.json`
2. 将上述路径加入 `.gitignore`
3. 更新 `GIT_RULES_CLAUDE.md` 第 4 节，将“过渡期规则”改为“已通过 .gitignore 忽略”
4. 不手工伪造日志内容，不将测试产物带入提交

### 验收标准

- 提交后 `git status --short` 不再因这两个文件产生运行时脏改动
- 规范文档与实际工程状态一致

### 依赖关系

- 无强依赖
- 作为执行包 A 收口任务完成

---

## 执行包 A 包级验收

### 功能验收

- 后端检索链路形成：**原问题 → rewrite（可选）→ BM25 候选 → rerank → 最终命中 / fallback**
- “推荐菜”等典型口语问题命中质量较 P0 提升
- `/chat` 基础响应契约不被破坏

### 工程验收

- 运行时日志文件已移出 tracking
- 构建通过
- 关键样例验证通过

### 提交建议

- 推荐 commit type：`feat(api)`
- 若含 `.gitignore` / 规范文档同步更新，可按实际范围使用 `feat(multi)`，但优先保持 A 为单包提交

---

# 执行包 B（Admin）

> 目标：把未命中问题从“仅可查看”升级为“可分析、可转知识、可跟踪处理状态”的运营闭环。

---

## TASK-B1：Dashboard ECharts 趋势图增强

### 目标

增强 Admin Dashboard 的数据可视化能力，不再只展示静态数字或简单摘要，而是增加趋势图用于观察提问量、命中率等趋势变化。

### 范围

- 允许引入图表依赖（若当前项目未安装，则按规范说明并一次性处理）
- 只做趋势图增强，不做复杂 BI 系统

### 建议涉及文件

- `smartdine-admin/src/views/.../Dashboard*.vue`
- `smartdine-admin/src/api/logs.js` 或对应数据接口文件
- `smartdine-api` 日志统计接口（若当前数据接口不足）

### 具体要求

1. Dashboard 至少展示 1~2 个趋势图：
   - 提问量趋势
   - 命中 / 未命中趋势 或 命中率趋势
2. 图表数据应来自真实接口，不写死 mock 数据。
3. 如后端当前未提供趋势数据结构，则由 B 包补齐最小接口返回，不扩展到复杂聚合分析。
4. 前端图表展示需符合当前 Admin 风格，不做视觉大改。

### 验收标准

- Dashboard 不再仅有静态汇总，能展示真实趋势变化
- 刷新页面后可正常拉取并渲染趋势数据

### 依赖关系

- 依赖执行包 A 完成后的稳定日志与检索链路

---

## TASK-B2：未命中转知识条目真实实现

### 目标

让 Admin 未命中列表中的问题可直接转为知识条目创建入口，形成真正的运营闭环，而不是停留在“查看列表”阶段。

### 范围

- 从 MissedList 进入知识创建页 / 表单页
- 支持预填原问题
- 支持标记该未命中问题已被转化

### 建议涉及文件

- `smartdine-admin/src/views/.../MissedList*.vue`
- `smartdine-admin/src/views/.../Knowledge*` 或 FAQ/知识编辑页
- `smartdine-admin/src/router/index.js`
- `smartdine-admin/src/api/logs.js`
- `smartdine-api/src/routes/logs.ts`
- `smartdine-api/src/services/logService.ts`
- `smartdine-api/src/data/logStore.ts`

### 具体要求

1. 未命中列表提供“转知识条目”操作。
2. 点击后跳转至知识创建页，并自动带入原问题内容作为 question 初始值。
3. 完成创建后，能够回写或标记该未命中问题已处理 / 已转化。
4. 整个链路基于真实接口实现，不允许停留在前端假跳转。

### 验收标准

- Admin 可从未命中列表一键进入知识创建
- 创建完成后，未命中问题状态可被追踪
- 运营侧能从“问题 → 知识”完成闭环

### 依赖关系

- 依赖执行包 A 完成
- 与 TASK-B3 强相关，建议一并设计

---

## TASK-B3：missedQuestions 增加 handled 字段

### 目标

为未命中问题增加“是否已处理”状态，支持 Admin 侧区分待处理与已处理问题。

### 范围

- 数据层新增字段
- 接口返回补齐字段
- Admin 列表支持展示与更新

### 建议涉及文件

- `smartdine-api/src/types/log.ts`
- `smartdine-api/src/data/logStore.ts`
- `smartdine-api/src/routes/logs.ts`
- `smartdine-api/src/services/logService.ts`
- `smartdine-admin/src/api/logs.js`
- `smartdine-admin/src/views/.../MissedList*.vue`

### 具体要求

1. 为 missed question 数据结构增加 `handled` 字段。
2. 历史数据需兼容未带该字段的情况。
3. Admin 列表支持展示 handled 状态。
4. Admin 提供最小可用的处理动作：标记已处理 / 未处理。
5. 与“转知识条目”动作配合时，可自动更新 handled 状态。

### 验收标准

- 未命中问题可区分待处理与已处理
- 转知识条目后状态能自动或明确变化
- 历史数据不因字段新增报错

### 依赖关系

- 依赖执行包 A 完成
- 建议与 TASK-B2 同包收口

---

## 执行包 B 包级验收

### 功能验收

- Dashboard 可展示真实趋势图
- 未命中问题可转知识条目并形成闭环
- 未命中问题具备 handled 状态

### 工程验收

- Admin 与 API 构建通过
- 核心操作链路跑通：查看未命中 → 转知识 → 状态变化

### 提交建议

- 推荐 commit type：`feat(multi)`
- 若严格拆分后端与前端提交，也可采用 2 个 commit，但以“一个执行包一个里程碑”为优先

---

# 执行包 C（H5）

> 目标：增强用户端问答入口与结果页承接能力，让 H5 从“输入框问答页”升级为更接近产品化的问答体验。

---

## TASK-C1：推荐问题接口化

### 目标

将当前 H5 推荐问题从本地写死或静态配置，升级为后端接口下发，便于后续运营调整与动态优化。

### 范围

- 新增推荐问题接口
- H5 通过接口获取推荐问题
- 保留最小回退方案，避免接口失败时页面空白

### 建议涉及文件

- `smartdine-h5/src/api/chat.js` 或建议问题接口文件
- `smartdine-h5/src/stores/` 下建议问题相关 store
- `smartdine-h5/src/views/Chat.vue`
- `smartdine-api` 下新增 suggestions 接口（按现有 routes 风格组织）

### 具体要求

1. 提供获取推荐问题的接口。
2. H5 页面加载时拉取推荐问题。
3. 接口失败时允许使用前端默认兜底列表，但默认走接口。
4. 推荐问题数据结构保持简单稳定，便于后续扩展分类与排序。

### 验收标准

- H5 推荐问题由接口驱动
- 接口失败时页面仍可正常展示兜底推荐
- 不影响原有提问主流程

### 依赖关系

- 可与执行包 B 并行
- 对执行包 A 无强依赖

---

## TASK-C2：快捷分类 Tab

### 目标

为 H5 增加快捷分类入口，让用户不必完全依赖自由输入，可通过分类快速发现高频问题。

### 范围

- 分类入口展示
- 分类与推荐问题联动
- 不做复杂二级分类系统

### 建议涉及文件

- `smartdine-h5/src/views/Chat.vue`
- `smartdine-h5/src/components/` 下按需新增分类组件
- `smartdine-h5/src/stores/` 下建议问题 store

### 具体要求

1. 至少提供一组一级分类 Tab，例如：推荐、菜品、营业时间、规则等。
2. 切换分类后，推荐问题列表随之变化。
3. UI 保持 H5 轻量风格，不引入 UI 框架。
4. 保持 JavaScript 实现，不新增 TypeScript。

### 验收标准

- 用户可通过 Tab 直接浏览不同类别推荐问题
- Tab 切换与推荐问题联动正常
- 移动端样式正常

### 依赖关系

- 建议在 TASK-C1 之后进行

---

## TASK-C3：相关推荐

### 目标

在问答结果页中增加相关推荐问题，提升连续提问与探索效率。

### 范围

- `/chat` 响应可选扩展 `related` 字段
- H5 在回答结果区域展示相关推荐
- 不破坏现有 `/chat` 响应兼容性

### 建议涉及文件

- `smartdine-api/src/routes/` 与 `retrieve / match` 相关链路
- `smartdine-h5/src/views/Chat.vue`
- `smartdine-h5/src/components/MessageList.vue`

### 具体要求

1. 根据当前命中条目的 tags、分类或相近知识条目，返回相关推荐列表。
2. `related` 作为可选字段增加，旧逻辑不依赖该字段也能正常工作。
3. H5 在回答区域展示相关推荐，并支持点击二次提问。
4. 若当前为 fallback，也可按策略返回默认推荐或不返回。

### 验收标准

- 命中知识条目后可看到相关推荐
- 点击相关推荐可触发新一轮提问
- 不破坏原有消息渲染逻辑

### 依赖关系

- 建议在 TASK-C1 / TASK-C2 之后进行
- 可部分复用执行包 A 的 tags / 检索信息

---

## TASK-C4：结果页跳转预留

### 目标

为后续业务页面跳转预留结果页 CTA（Call To Action），当前只做入口占位与交互预留，不接真实业务页。

### 范围

- 只做“预留态”
- 不接真实路由业务页
- 文案与交互清晰表达“即将上线”

### 建议涉及文件

- `smartdine-h5/src/views/Chat.vue`
- `smartdine-h5/src/components/MessageList.vue`

### 具体要求

1. 根据回答结果或标签，展示“查看详情”“去看看”“进入功能页”等 CTA 预留按钮。
2. 当前点击后仅做提示或占位逻辑，例如 Toast “即将上线”。
3. 组件结构需为 P2 真正接入业务页保留位置。

### 验收标准

- H5 结果页可展示 CTA 预留入口
- 点击后有明确反馈，不出现死按钮
- 后续接入真实页面时无需大改结果页结构

### 依赖关系

- 可独立完成
- 建议在 TASK-C3 之后统一收口

---

## 执行包 C 包级验收

### 功能验收

- H5 推荐问题由接口驱动
- 分类 Tab 正常可用
- 回答结果区可展示相关推荐
- 结果页 CTA 预留完成

### 工程验收

- H5 构建通过
- 移动端样式正常
- 不引入 TypeScript / axios / UI 框架

### 提交建议

- 推荐 commit type：`feat(h5)`
- 若含后端 suggestions / related 接口，可根据实际改动使用 `feat(multi)`

---

## 四、P1 总体验收标准

P1 完成后，至少满足以下目标：

### 1. 检索与命中能力

- 用户常见自然语言问法比 P0 更容易命中正确知识
- 推荐类、近义类问题排序更稳定
- 未命中后具备可解释的 rewrite / rerank 基础

### 2. 运营闭环能力

- Admin 可看到趋势
- 未命中问题可转知识条目
- 未命中问题有 handled 状态管理

### 3. H5 产品体验

- 推荐问题不再完全静态
- 用户可通过分类快速提问
- 问答结果支持相关推荐与后续动作预留

### 4. 工程一致性

- 运行时日志文件已移出 tracking
- 文档与工程状态一致
- 执行包边界清晰，Git 历史可追踪

---

## 五、推荐提交与里程碑建议

### 提交建议

- 执行包 A：1 个里程碑 commit
- 执行包 B：1 个里程碑 commit
- 执行包 C：1 个里程碑 commit

### PR 建议

若在 `claude/*` worktree 分支上完成开发，则：

- A 完成后建议 PR
- B 完成后建议 PR
- C 完成后建议 PR

PR 用途：
- 留存完整 diff
- 作为执行包完成的里程碑节点

---

## 六、给 Codex / Claude Code 的执行提示

### 执行方式

- 一个执行包一个 Thread
- 先完成包内全部任务，再统一收口提交
- 中途发现与当前包无关的问题，不顺手扩改，先记录后反馈

### 输出要求

每个执行包完成后输出：

1. 新增/修改文件清单
2. 关键实现说明
3. 验证结果
4. 遗留问题
5. 建议 commit message

---

## 七、当前推荐启动顺序

### 第一优先级

- 执行包 A

### 第二优先级

- 执行包 B
- 执行包 C

> 原因：A 决定 P1 后端能力基座，B 与 C 在 A 之后推进更稳；其中 C 可与 B 并行，便于缩短整体周期。
