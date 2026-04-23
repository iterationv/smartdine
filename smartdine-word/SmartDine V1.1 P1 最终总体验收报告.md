# SmartDine V1.1 P1 最终总体验收报告

## 1. 验收范围与环境

- 本次验收覆盖执行包 A、执行包 B、执行包 C 全部范围。
- 使用运行环境为 dev:ai：
  - API：http://127.0.0.1:3300
  - Admin：http://127.0.0.1:5274
  - H5：http://127.0.0.1:5273
- 实际验证方式：
  - 代码审查
  - 三端构建验证
  - 真实接口调用
  - Playwright headless 页面联调
  - questionLogs.json / missedQuestions.json retrieval trace 与状态证据
  - git log / .gitignore / git check-ignore 复核
- 环境自检结果：
  - API 3300、Admin 5274、H5 5273 在验收开始时均已在线
  - 未新增自动拉起服务
- 验收过程中通过真实 /chat 和 Admin 页面生成了运行期样本数据；临时新增知识样本已通过真实接口删除，最终 git status --short 仅剩既有未跟踪项 .claude/worktrees/youthful-mclean-8368e5/。

## 2. 总体结论

通过

P1 三个执行包的功能闭环、端到端链路和三端 build 已全部完成验证，达到可收口、可归档、可进入下一阶段的标准。执行包 A 的 rewrite / BM25 / rerank 已真实工作并写入 retrieval trace；执行包 B 的 Dashboard、未命中处理与回流链路已跑通；执行包 C 的推荐问题、分类 Tab、相关推荐和 CTA 预留均已落地。/chat 主契约未被破坏，只做了可选字段扩展。questionLogs.json 与 missedQuestions.json 已移出 Git tracking，运行期写入和读取均正常。当前仅存在少量低风险遗留，均不构成 P1 收口阻塞。

## 3. 端到端链路验收

### 3.1 命中链路

- 测试问题：今天有什么菜
- 关键返回：
  - source: "knowledge"
  - matched: { "id": "k_001", "title": "今日菜品" }
  - related: ["今天的套餐是什么", "今天有推荐菜吗", "有没有面食"]
- 链路证据：
  - 真实 /chat 返回命中知识条目，契约仍为 answer/source/matched，仅追加可选 related
  - questionLogs.json中对应记录显示：
    - selectedStage: "original"		
    - candidateCount: 6
    - Top1 k_001 / 今日菜品
    - rawScore: 30.49
    - rerankScore: 31.49
    - reasons: [{ code: "question_phrase_match", delta: 1 }]
  - 代码链路可见于 retrieve.ts、matchKnowledge.ts、scoreKnowledgeCandidates.ts、rerankKnowledgeCandidates.ts
- 结论：
  - 命中链路通过，Query -> BM25 -> Rerank -> knowledge 命中成立，/chat 契约兼容。

### 3.2 未命中链路

- 测试问题：
  - 干净未命中样本：食堂有没有量子传送服务
  - rewrite 补充 trace 样本：请问你们这里有没有退款规则
- Query Rewrite 是否触发：
  - 对 食堂有没有量子传送服务 未触发，直接原问题未命中
  - 对 请问你们这里有没有退款规则 已触发，rewrittenQuestion: "退款规则"
- 关键返回：
  - 食堂有没有量子传送服务 返回 source: "ai_fallback"、matched: null、related: []
  - 请问你们这里有没有退款规则 返回 source: "ai_fallback"、matched: null
- 链路证据：
  - questionLogs.json 中 食堂有没有量子传送服务 记录显示原问题 candidateCount: 0，直接 fallback
  - 同文件中 请问你们这里有没有退款规则 记录显示：
    - original -> candidateCount: 0
    - rewrittenQuestion: "退款规则"
    - rewritten -> candidateCount: 0
    - 最终 selectedStage: null
  - 代码链路可见于 queryRewrite.ts 和 retrieve.ts
- 结论：
  - 未命中主链路通过。rewrite 触发与 fallback 行为均可被真实 trace 证明；本轮未强求“rewrite 后命中”的自然样例。

### 3.3 H5 展示层

- 推荐问题接口化：
  - 页面真实请求 GET /api/suggestions
  - API 成功态分类为 菜品查询 / 营业信息 / 价格相关 / 饮食需求 / 其他高频
  - 对应代码在 suggestions.ts、chat.js、suggestStore.js
- 分类 Tab：
  - Playwright 点击 价格相关 后，卡片实际收敛为 套餐多少钱 / 怎么付款 / 支持什么支付方式
  - 代码在 Chat.vue 与 CategoryTab.vue
- 相关推荐：
  - 命中 今天有什么菜 后，页面展示 3 条相关推荐：今天的套餐是什么 / 今天有推荐菜吗 / 有没有面食
  - 未命中 食堂有没有量子传送服务 时，相关推荐不展示
- CTA：
  - 命中态展示 1 个 CTA，点击后真实反馈 即将上线
  - 未命中 / fallback 态不展示 CTA
  - 代码在 MessageList.vue 与 index.ts
- 结论：
  - H5 展示层通过，接口驱动、分类联动、相关推荐与 CTA 预留均闭环；fallback 场景也符合预期。

### 3.4 Admin 功能层

- 趋势图：
  - Dashboard 页面真实调用 /api/logs/stats
  - 默认 7d 响应为 totalQuestions: 66、granularity: "day"、trend.length: 7
  - 图表容器 .dashboard-chart 均已被 ECharts 注入子节点，容器尺寸约 507 x 320
  - 代码在 Dashboard.vue、logs.js、logService.ts
- 时间范围切换：
  - 页面从默认 最近7天 切到 今天 后，真实请求变为 /api/logs/stats?range=today
  - 响应变为 totalQuestions: 31、granularity: "hour"、trend.length: 10
  - 页面文案同步从 按天查看 切到 按小时查看
- 未命中转知识条目：
  - 真实样本 P1_ACCEPT_TRANSFER_1776909506324 先由 /chat 生成 missed 记录
  - 在 未命中问题 页点击“转为知识条目”后跳到知识创建态
  - 知识表单中的 question 字段已自动预填该 missed question
  - 保存后返回知识管理页，再回到 missed 页，该行状态为 已处理 / 已转知识
  - 代码在 MissedList.vue 与 KnowledgeList.vue
- handled 联动：
  - 真实样本 P1_ACCEPT_HANDLED_1776909459210 初始为 待处理 / 未转化
  - 点击“标记已处理”后行状态变为 已处理 / 未转化
  - 同页筛选结果为：全部=1 / 已处理=1 / 待处理=0
  - API 再查 /api/logs/missed?keyword=...&handled=true 仍返回该记录，说明已持久化
- 结论：
  - Admin 功能层通过。趋势图、时间范围联动、未命中转知识条目、handled 状态联动与筛选均已闭环。

## 4. 逐包逐项验收

### 4.1 执行包 A

| 任务             | 是否通过 | 证据                                                         | 问题                                                |
| :--------------- | :------- | :----------------------------------------------------------- | :-------------------------------------------------- |
| A1 Query Rewrite | 通过     | queryRewrite.ts、retrieve.ts；真实 log 样本 请问你们这里有没有退款规则 -> 退款规则，两次 attempt 均被 trace 记录 | 未拿到“rewrite 后命中”的自然样例，本轮以 trace 补证 |
| A2 BM25 混合检索 | 通过     | scoreKnowledgeCandidates.ts；今天有什么菜 trace 中 Top3 候选具备 rawScore，Top1 为 k_001 | 无                                                  |
| A3 Rerank        | 通过     | rerankKnowledgeCandidates.ts；同一 trace 中 rerankScore 与 reasons 生效，k_001 从 30.49 -> 31.49 | 无                                                  |
| A4 向量签名预留  | 通过     | vectorSearch.ts 明确标注 P2 再实现 且仅返回空数组；rg "vectorSearch(" smartdine-api/src 仅命中声明本身 | 无                                                  |
| A5 工程清理      | 通过     | .gitignore 已忽略 questionLogs.json / missedQuestions.json；git check-ignore -v 命中；同时 /chat、/api/logs、/api/logs/missed 仍正常读写这些运行期文件 | 无                                                  |

### 4.2 执行包 B

| 任务            | 是否通过 | 证据                                                         | 问题 |
| :-------------- | :------- | :----------------------------------------------------------- | :--- |
| B1 趋势图       | 通过     | Dashboard.vue + 真实 /api/logs/stats；默认 7d 为 66 条，切 today 为 31 条，页面文案同步变更 | 无   |
| B2 未命中转条目 | 通过     | 真实样本 P1_ACCEPT_TRANSFER_1776909506324 从 missed 页进入知识创建，question 预填，提交后 missed 行变为 已处理 / 已转知识 | 无   |
| B3 handled 字段 | 通过     | types/log.ts、MissedList.vue；真实样本 P1_ACCEPT_HANDLED_1776909459210 可切换 handled，且 API handled=true/false 过滤结果正确 | 无   |

### 4.3 执行包 C

| 任务              | 是否通过 | 证据                                                         | 问题                                                         |
| :---------------- | :------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| C1 推荐问题接口化 | 通过     | suggestions.ts、suggestStore.js；页面真实请求 /api/suggestions；路由拦截失败时 fallback 推荐和分类仍展示 | /api/suggestions 当前返回全部 active knowledge，已在文档中标为 P2 优化项 |
| C2 分类 Tab       | 通过     | Chat.vue、CategoryTab.vue；点击 价格相关 后列表收敛为 3 条支付/价格问题 | 无                                                           |
| C3 相关推荐 + CTA | 通过     | MessageList.vue、index.ts；命中态展示 3 条相关推荐与 1 个 CTA，点击 CTA 出现 即将上线；fallback 态两者都不展示 | 无                                                           |

## 5. 规范合规检查

- H5 技术约束：
  - smartdine-h5/src 下无 .ts 文件
  - rg 'lang="ts"' smartdine-h5/src 无命中
  - rg 'axios' smartdine-h5/src ... 无命中
  - 未引入 UI 框架，仍为 Vue 3 + Vite + JavaScript + Pinia
- /chat 契约兼容性：
  - 代码在 index.ts
  - 真实命中与未命中响应均保留 answer / source / matched
  - related 仅为可选新增字段，未破坏原有语义
- A4 预留边界：
  - vectorSearch.ts 仅保留签名与空实现
  - 代码搜索未发现主链路调用
- 临时兼容逻辑：
  - 未发现未标注的临时 bridge 逻辑
  - 已存在的临时方案均显式可见：H5 suggestions fallback、AI fallback、Admin 临时登录方案 Login.vue
- Git 提交边界：
  - P1 里程碑 commit 边界清晰：
    - d96c9f4 执行包 A
    - a91d70d 执行包 B
    - ddd7a53 执行包 C
    - 6d2b38c / e5df99c 为 C 收口与文档状态更新
  - 未发现 A/B/C 明显混提到同一个里程碑 commit 的情况

## 6. 数据一致性检查

- handled 字段联动：
  - UI 样本 P1_ACCEPT_HANDLED_1776909459210 已验证 待处理 -> 已处理
  - API /api/logs/missed?keyword=...&handled=true 返回该记录
  - API /api/logs/missed?keyword=...&handled=false 返回空列表
- category 口径一致性：
  - API 成功态分类：菜品查询 / 营业信息 / 价格相关 / 饮食需求 / 其他高频
  - 前端 fallback 分类：菜品查询 / 饮食需求 / 营业信息
  - 口径名称一致；fallback 只是子集，因为本地兜底问题只有 5 条
- related 字段行为：
  - 命中 今天有什么菜：related 返回 3 条，H5 正常展示
  - 未命中 食堂有没有量子传送服务：related: []，H5 不展示相关推荐和 CTA
- 运行时日志 tracking 状态：
  - questionLogs.json 与 missedQuestions.json 已移出 Git tracking 并被 .gitignore 忽略
  - 运行期仍正常写入 retrieval trace、missed 记录与 handled/converted 状态
  - 最终 git status --short 未出现这两类文件脏改动

## 7. 风险与遗留问题

- 高：无高风险阻塞项。
- 中：无中风险阻塞项。
- 低：GET /api/suggestions 当前仍返回全部 active knowledge，知识量继续增长后首页“推荐问题”会越来越像“全部问题”，这已在 P1 文档中标注为 P2 优化项。
- 低：smartdine-admin 生产构建存在大包 warning，dist/assets/index-DuPo1-qj.js 约 2.65 MB，当前不阻塞 P1 验收，但后续需要关注加载性能与拆包。
- 低：极端复合 query 你们食堂支不支持火星币支付和月球外卖 会命中 支持支付方式，说明 A 包对“部分已知意图 + 未知附加条件”的阈值仍偏宽；当前不影响主链路通过，但适合放入后续检索调优观察项。

## 8. 最终建议

- P1 是否可以整体收口：
  - 可以整体收口。
- 收口前必须修复的问题：
  - 无。
- 建议推迟到 P2 的问题：
  - 将 suggestions 从“全部 active knowledge”升级为“精选 / 排序 / 限量”策略。
  - 继续观察并收敛“部分已知关键词导致复合 query 被过度命中”的检索阈值。
  - 对 Admin 做按路由或图表维度的拆包，消化当前 build 大包 warning。