# SmartDine V1.1 P2 检索判定验证报告

## 1. 验证结论

- 是否完成检索判定层：已完成。
- 是否修改 KB 数据：否。
- 是否修改推荐接口：否。
- 是否新增依赖：否。
- 是否修改 `.env`：否。
- 是否建议进入 TASK-P2-11A：建议进入，但需注意 H5 展示适配尚未做。

## 2. 阈值校准

| 轮次 | 阈值组合 | should_hit high | low_confidence 非 high | fallback 非 high | ambiguous candidates | 调整说明 |
|---|---|---:|---:|---:|---:|---|
| 1 | 12 / 0.04 / 1 | 19/20 | 8/8 | 6/6 | 5/8 | `case-008` 被误判 low，部分 ambiguous 被 low/high 吸收 |
| 2 | 8 / 0.04 / 1 | 20/20 | 8/8 | 6/6 | 8/8 | 降低绝对分阈值，补充复合意图与模糊表达判定 |

最终值：

- `LOW_CONFIDENCE_ABS_THRESHOLD = 8`
- `LOW_CONFIDENCE_GAP_RATIO = 0.04`
- `UNKNOWN_ENTITY_TOKEN_THRESHOLD = 1`

## 3. P2-04 样例验证

| expectType | 样例数 | 结果 |
|---|---:|---|
| should_hit | 20 | 20 条为 `high` |
| ambiguous | 8 | 8 条为 `ambiguous`，均返回 candidates |
| low_confidence | 8 | 8 条为 `unknown_entity`，均不走确定性回答 |
| fallback | 6 | 6 条为 `unknown_entity`，均不走确定性回答 |

## 4. 响应字段变更

新增字段：

- `confidence`: `high | low | ambiguous | unknown_entity`
- `fallbackReason`: `low_absolute_score | small_gap_between_top1_top2 | unknown_entity_in_query | null`
- `candidates`: 仅 `ambiguous` 返回，结构为 `{ id, question }`

原有字段保持：

- `answer`
- `source`
- `matched`
- `related`

## 5. 示例响应

ambiguous:

```json
{
  "answer": "我找到几个可能相关的问题，你可以先确认想问哪一个。",
  "source": "ai_fallback",
  "matched": null,
  "related": [],
  "confidence": "ambiguous",
  "fallbackReason": "small_gap_between_top1_top2",
  "candidates": [
    { "id": "k_010", "question": "怎么付款" },
    { "id": "k_020", "question": "可以提前订餐吗" },
    { "id": "k_019", "question": "支持外带吗" }
  ]
}
```

unknown_entity:

```json
{
  "answer": "目前知识库中没有找到「量子、传送」的相关说明。你可以询问菜品、套餐、支付、营业时间、饮食需求、外带或停车等食堂相关问题。",
  "source": "ai_fallback",
  "matched": null,
  "related": [],
  "confidence": "unknown_entity",
  "fallbackReason": "unknown_entity_in_query"
}
```

## 6. 验证命令

```text
npm run build
node ./node_modules/tsx/dist/cli.mjs 运行 P2-04 样例判定脚本
git diff --name-only -- smartdine-api/src/data smartdine-api/data smartdine-api/src/routes/suggestions.ts smartdine-admin smartdine-h5
git diff --name-only -- .env .env.ai .env.cc smartdine-api/.env smartdine-api/.env.ai smartdine-api/.env.cc
```

## 7. 已知边界

- 当前 `/chat` 实际路由位于 `smartdine-api/src/index.ts`，仓库中不存在 `smartdine-api/src/routes/chat.ts`。
- 本轮只做 API 返回字段扩展，未做 H5 展示适配。
- low_confidence 样例当前多数通过 `unknown_entity` 降级，符合“不输出确定性业务答案”的目标，但不是最终语义分类模型。
- 未引入 embedding / RAG，未知实体词表仍是轻量规则，后续 KB 扩展时需要同步复核。
