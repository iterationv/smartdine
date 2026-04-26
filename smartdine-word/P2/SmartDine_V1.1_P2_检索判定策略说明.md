# SmartDine V1.1 P2 检索判定策略说明

## 1. 当前问题

- P1 检索链路已经具备 query rewrite、BM25 候选召回和 rerank。
- 旧流程只判断是否存在可接受候选，容易把局部命中问题当作确定答案。
- 极端复合问题、未知实体问题、多个意图混合问题缺少统一判定层。

## 2. 新判定层位置

```text
query -> matchKnowledge -> score/rerank candidates -> retrieval decision -> answer/fallback
```

判定层位于候选排序之后、答案生成之前。本轮不提升答案内容质量，只控制是否应该回答。

## 3. 响应字段

`/chat` 保留原有字段：

```json
{
  "answer": "...",
  "source": "knowledge",
  "matched": { "id": "k_001", "title": "..." },
  "related": []
}
```

新增字段：

```json
{
  "confidence": "high",
  "fallbackReason": null,
  "candidates": [{ "id": "k_001", "question": "今天有什么菜" }]
}
```

- `confidence`: `high | low | ambiguous | unknown_entity`
- `fallbackReason`: `low_absolute_score | small_gap_between_top1_top2 | unknown_entity_in_query | null`
- `candidates`: 仅 `ambiguous` 时返回，最多 3 个候选问题。

## 4. 判定优先级

1. `unknown_entity`: 命中未知实体或明显超出食堂 FAQ 范围的词。
2. `low`: top1 绝对分低于阈值。
3. `ambiguous`: top1/top2 分差过小，或问题包含多个意图且存在多个强候选。
4. `high`: 以上信号都不触发，允许按知识库答案链路回答。

## 5. 阈值常量

```ts
LOW_CONFIDENCE_ABS_THRESHOLD = 8
LOW_CONFIDENCE_GAP_RATIO = 0.04
UNKNOWN_ENTITY_TOKEN_THRESHOLD = 1
```

辅助常量：

- `AMBIGUOUS_CANDIDATE_SCORE_RATIO = 0.35`
- `AMBIGUOUS_CANDIDATE_LIMIT = 3`
- `UNKNOWN_TOKEN_DISPLAY_LIMIT = 3`

## 6. 兜底话术

- `low`: 我不太确定你问的是不是当前知识库里的这个主题。你可以换一种问法，或者点击下面的推荐问题。
- `ambiguous`: 我找到几个可能相关的问题，你可以先确认想问哪一个。
- `unknown_entity`: 目前知识库中没有找到「...」的相关说明。你可以询问菜品、套餐、支付、营业时间、饮食需求、外带或停车等食堂相关问题。

## 7. 范围边界

- 不修改 KB 数据。
- 不修改 `/api/suggestions`。
- 不引入 embedding / RAG / 多轮对话。
- 不改变 `/chat` 原有字段含义，只追加字段。
- H5 展示适配不在本轮处理。

## 8. 与 P2-11 对齐

后续问答日志直接使用以下字段名：

- `confidence`
- `fallbackReason`
- `topMatchId`
- `topScore`

其中 `topMatchId` 和 `topScore` 已保存在 `trace.decision` 中，便于 P2-11 写入结构化日志。
