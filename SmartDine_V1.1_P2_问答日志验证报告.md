# SmartDine V1.1 P2 问答日志验证报告

## 1. 验证结论

- `/chat` 写入日志：通过。
- jsonl 文件存在且可解析：通过。
- 按日期分文件：通过。
- 查询脚本可用：通过。
- API 查询可用：通过。
- 是否修改 KB 数据：否。
- 是否修改推荐接口：否。
- 是否修改 P2-03 判定逻辑：否。
- 是否新增依赖：否。
- 是否建议进入 TASK-P2-11B：建议进入。

## 2. 写入验证

验证端口：

```text
http://127.0.0.1:3300
```

触发问题：

```text
食堂有没有量子传送服务？
能先订餐然后外带，付款怎么弄？
今天上海天气怎么样？
```

日志文件：

```text
logs/qa-events-2026-04-25.jsonl
```

结果：

```text
lineCount: 4
parsedCount: 4
```

## 3. 示例日志

```json
{
  "requestId": "871e8892-1af3-4dae-8a4c-75bb4c152ad8",
  "timestamp": 1777114625745,
  "query": "食堂有没有量子传送服务？",
  "confidence": "unknown_entity",
  "fallbackReason": "unknown_entity_in_query",
  "topMatchId": "k_007",
  "topScore": 5.391731141861817,
  "duration": 31
}
```

## 4. 查询脚本验证

命令：

```bash
node scripts/queryQaLogs.ts
```

输出摘要：

```text
total: 4
high: 0
low: 0
ambiguous: 1
unknown_entity: 3
```

## 5. API 查询验证

请求：

```text
GET /api/admin/qa-events?limit=10
```

返回摘要：

```json
{
  "total": 4,
  "list": [
    {
      "confidence": "unknown_entity",
      "fallbackReason": "unknown_entity_in_query",
      "topMatchId": "k_008"
    }
  ]
}
```

筛选请求：

```text
GET /api/admin/qa-events?limit=10&confidence=ambiguous
```

返回摘要：

```json
{
  "total": 1,
  "list": [
    {
      "confidence": "ambiguous",
      "fallbackReason": "small_gap_between_top1_top2",
      "topMatchId": "k_010"
    }
  ]
}
```

## 6. 禁止范围检查

已检查：

```text
smartdine-api/src/data
smartdine-api/src/ai
smartdine-api/src/routes/suggestions.ts
smartdine-admin
smartdine-h5
.env*
package.json
```

本轮未修改上述禁止文件。

## 7. 后续接入说明

TASK-P2-11B 可直接读取：

```text
GET /api/admin/qa-events?limit=20
GET /api/admin/qa-events?limit=20&confidence=low
```

Admin 页面字段建议：

- timestamp
- query
- confidence
- fallbackReason
- topMatchId
- topScore
- duration
