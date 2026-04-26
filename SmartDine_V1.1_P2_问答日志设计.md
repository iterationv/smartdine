# SmartDine V1.1 P2 问答日志设计

## 1. 目标

为 `/chat` 增加 API 层最小可观测性，记录每次有效问答的检索判定结果，供 TASK-P2-11B Admin 页面读取。

## 1.1 字段变更历史

- 变更日期：2026-04-26
- 变更原因：对齐 P2 详细任务清单中的 P2-11A 原始日志契约，避免第二轮继续引用临时字段。
- 旧字段命名：`timestamp` 为毫秒时间戳，用户问题字段为 `query`，未记录 `queryLength`，`topScore` 在无候选时会被写为 `0`。
- 当前字段命名：`timestamp` 为 ISO 8601 字符串，用户问题摘要字段为 `queryDigest`，新增 `queryLength`，`topScore` 允许为 `null`。
- 历史日志处理：旧 `logs/qa-events-*.jsonl` 不再兼容当前查询代码。本次收尾补丁会清理或归档旧 jsonl 文件；如需查询旧日志，需使用变更前版本代码。

## 2. 日志结构

每条日志为一行 JSON：

```json
{
  "requestId": "uuid",
  "timestamp": "2026-04-26T10:23:45.123Z",
  "queryDigest": "用户问题摘要",
  "queryLength": 12,
  "confidence": "high",
  "fallbackReason": null,
  "topMatchId": "k_001",
  "topScore": 12.3,
  "duration": 35
}
```

字段说明：

| 字段 | 说明 |
|---|---|
| requestId | 单次 `/chat` 请求 id |
| timestamp | 请求开始时间，ISO 8601 字符串 |
| queryDigest | 用户问题摘要，最多 100 字符；超出时追加 `...` |
| queryLength | 原始用户问题长度，摘要截断前计算 |
| confidence | P2-03 判定结果：`high / low / ambiguous / unknown_entity` |
| fallbackReason | P2-03 兜底原因 |
| topMatchId | 当前检索 top1 知识条目 id，无则为 null |
| topScore | 当前检索 top1 分数，无则为 null |
| duration | `/chat` 处理耗时，单位毫秒 |

## 3. 文件规则

- 目录：`logs/`
- 文件名：`qa-events-YYYY-MM-DD.jsonl`
- 写入方式：append
- 格式：一行一个 JSON
- 写入失败：只记录错误，不影响 `/chat` 返回

示例：

```text
logs/qa-events-2026-04-25.jsonl
```

## 4. 写入机制

`smartdine-api/src/utils/qaEvents.ts` 提供：

```ts
logQaEvent(event): void
```

`/chat` 在返回前 fire-and-forget 写入日志，不等待文件写入完成。

## 5. 查询脚本

脚本：

```text
smartdine-api/scripts/queryQaLogs.ts
```

运行：

```bash
node scripts/queryQaLogs.ts
```

输出：

- 总条数
- confidence 分布
- 最近 10 条日志

## 6. 查询 API

端点：

```text
GET /api/admin/qa-events
```

鉴权：

- 复用现有 `x-api-key` 鉴权。

参数：

| 参数 | 说明 |
|---|---|
| limit | 返回条数，默认 20，上限 100 |
| confidence | 可选：`high / low / ambiguous / unknown_entity` |

返回：

```json
{
  "list": [],
  "total": 0
}
```

## 7. 安全边界

- 不记录 API key、请求头、环境变量。
- 仅记录用户问题摘要，最长 100 字符，超出时追加 `...`。
- 不做数据库持久化。
- 日志目录为运行期产物，不应提交到 git。
