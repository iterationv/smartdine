# SmartDine V1.1 P2 第一轮收尾补丁 执行报告

## 1. 补丁 A:P2-03 unknown_entity 算法化

### 1.1 算法实现摘要
- 新算法核心逻辑:
  ```ts
  const queryTokens = extractKnowledgeContentTokens(query);
  const residualText = removeKnownTokenMatches(normalizeForSignal(query), knowledgeTokenSet);
  const unknownTokens = extractResidualUnknownTokens(residualText);
  if (unknownTokens.length >= UNKNOWN_ENTITY_TOKEN_THRESHOLD) return unknown_entity;
  if (queryTokens.some((token) => OUT_OF_SCOPE_HINT_TERMS.includes(token))) return unknown_entity;
  ```
- 知识库词集构建方式: 首次调用时从所有活跃知识条目的 `title`、`question`、`answer`、`aliases`、`tags` 按同一分词规则动态构建 `Set<string>`。
- 缓存与 invalidation 策略: `smartdine-api/src/ai/knowledgeTokenSet.ts` 模块级缓存一次构建结果；`createKnowledge`、`updateKnowledge`、`updateKnowledgeStatus`、`deleteKnowledge` 成功写入后调用 `invalidateKnowledgeTokenSet()`。
- 白名单使用方式: 原 `OUT_OF_SCOPE_ENTITY_TERMS` 已改为 `OUT_OF_SCOPE_HINT_TERMS`，仅在差集 token 未达到阈值时做 token-level 兜底提示，不作为主路径决策。

### 1.2 现有 42 条样例回归
- should_hit 通过率(补丁前 / 补丁后): 20/20 / 20/20。
- ambiguous 触发率(补丁前 / 补丁后): 8/8 / 8/8。
- low_confidence 非 high 触发率(补丁前 / 补丁后): 7/8 / 8/9。
- fallback 不误答率(补丁前 / 补丁后): 6/6 / 6/6。

补丁后样例集共 48 条: 原 42 条 + 5 条白名单外越权对照组 + 1 条 low 信号证明样例。

### 1.3 新增 5 条对照组样例验证
- case-control-001 -> unknown_entity, unknownTokens: `相亲`、`亲对`、`对象`。
- case-control-002 -> unknown_entity, unknownTokens: `算占`、`占卜`、`卜星`。
- case-control-003 -> unknown_entity, unknownTokens: `好玩`、`玩网`、`网络`。
- case-control-004 -> unknown_entity, unknownTokens: `股票`、`票大`、`大盘`。
- case-control-005 -> unknown_entity, unknownTokens: `写段`、`python`、`代码`。
- 全部通过: 是。
- 未通过项: 无。

### 1.4 low 信号触发证明
- 样例集中触发 low 信号的样例 ID: `case-low-001`。
- 触发次数: 1。
- 阈值 `LOW_CONFIDENCE_ABS_THRESHOLD = 8` 是否仍合理: 本轮新增样例证明该阈值可实际触发；后续是否调整阈值应放入第二轮或独立回归评估，不在本收尾补丁内扩大范围。

## 2. 补丁 B:P2-11A 字段对齐

### 2.1 字段变更对照
| 字段 | 改前 | 改后 | 文件位置 |
|---|---|---|---|
| `timestamp` | `number` 毫秒时间戳 | `string` ISO 8601 | `smartdine-api/src/utils/qaEvents.ts`, `smartdine-api/src/index.ts` |
| `query` | 脱敏查询摘要字段名为 `query` | `queryDigest` | `smartdine-api/src/utils/qaEvents.ts`, `smartdine-api/src/index.ts`, `smartdine-admin/src/views/QaEvents.vue` |
| `queryLength` | 缺失 | `number`，原始查询长度 | `smartdine-api/src/utils/qaEvents.ts`, `smartdine-api/src/index.ts`, `smartdine-admin/src/views/QaEvents.vue` |
| `topScore` | `number`，无候选被 `?? 0` 强转 | `number | null`，无候选保留 `null` | `smartdine-api/src/index.ts`, `smartdine-api/src/utils/qaEvents.ts`, `smartdine-admin/src/api/qaEvents.js` |
| 查询摘要截断 | 200 字符 | 100 字符 + `...` | `smartdine-api/src/utils/qaEvents.ts` |

### 2.2 历史日志处理
- 已清理的 jsonl 文件清单: `smartdine-api/logs/qa-events-2026-04-25.jsonl`。
- 文档变更历史段落已追加: 是，已在 `SmartDine_V1.1_P2_问答日志设计.md` 增加字段变更历史。
- 兼容策略: 不兼容旧字段。旧 jsonl 文件已清理，查询端只读取新 schema。

### 2.3 端到端验证
- `/chat` 调用后第一条新写入 jsonl:
  ```json
  {"requestId":"8b0e9cc4-4acd-4203-8250-b407952b53fd","timestamp":"2026-04-26T11:23:14.767Z","queryDigest":"帮我写一段Python代码读取CSV","queryLength":18,"confidence":"unknown_entity","fallbackReason":"unknown_entity_in_query","topMatchId":null,"topScore":null,"duration":10}
  ```
- Admin 查询接口: `GET /api/admin/qa-events?limit=1` 返回 `queryDigest`、`queryLength`、ISO `timestamp`、`topScore:null`。
- Admin 页面渲染: 字段引用已从 `query` 切换为 `queryDigest`；`topScore:null` 显示为 `-`；时间按 ISO 字符串解析。
- topScore=null 场景: 已通过 `帮我写一段Python代码读取CSV` 验证，无候选时落盘为 `null`，未再强转为 `0`。

## 3. 范围合规检查
- 是否仅修改约定文件: 是。修改集中在 P2-03、P2-11A、P2-11B 新字段消费、回归样例、问答日志设计文档和本报告。
- 是否引入新依赖: 否。
- 是否触碰二轮 TASK: 否。未实现 P2-05、P2-07、P2-08、P2-09、P2-10。
- 是否修改 KB / `.env*`: 否。
- 是否修改 package / lock / 构建配置: 否。

## 4. P2 第一轮最终收口确认
- 第一轮所有 TASK 是否真正闭环: 是，P2-03 的 unknown_entity 主路径已算法化，P2-11A 日志字段已与 P2 详细任务清单对齐。
- 是否可以进入 P2 第二轮: 建议可以进入。
- 第二轮建议范围: `TASK-P2-05 Admin 真实认证最小化改造`、`TASK-P2-07 AI 配置后台化最小落地`。
- 仍需保留的非阻塞项: Admin bundle chunk warning、H5 confidence/candidates 展示暂未适配、P2-02 limit/MAX_PER_CATEGORY/popularity 细化、Admin 问答日志日期范围/多选/真分页、queryQaEvents 全量读取内存优化、`.claude/worktrees` 脏状态。
