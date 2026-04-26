# SmartDine V1.1 P2 推荐策略说明

## 1. 当前问题

P2-02 执行前，`GET /api/suggestions` 的逻辑是读取全部 active knowledge 后直接映射返回：

```text
readActiveKnowledgeList() -> items.map(...)
```

这个实现存在四个问题：

- 无上限：知识条目增长后会把全部 active knowledge 推到 H5 首页。
- 无分类均衡：推荐区可能被单一分类占满。
- 无 fallback：active knowledge 不足时没有兜底推荐。
- 可解释性不足：返回结构缺少 `id`、`sourceType`、`priority` 等字段。

## 2. 新策略

`/api/suggestions` 现在使用轻量推荐策略：

1. 读取 active knowledge。
2. 按 `category = item.tags?.[0] ?? "other"` 分组。
3. 对知识条目做轻量排序：有 tags 优先，有 aliases 优先，其余保持原顺序。
4. 按分类轮询选择，每类先取 1 条，再继续轮询补齐。
5. 默认最多返回 `MAX_SUGGESTIONS = 8` 条。
6. 当 active knowledge 不足 8 条时，最多补 3 条 fallback。

该策略不引入新依赖、不接入 embedding/RAG、不修改 `/chat` 主链路。

## 3. 分类规则

- 分类来源：`item.tags?.[0]`
- 缺省分类：`other`
- 当前 KB 下实际出现的分类：
  - `菜品查询`
  - `营业信息`
  - `价格相关`
  - `饮食需求`
  - `其他高频`

分类轮询示例：

```text
菜品查询 1 条
营业信息 1 条
价格相关 1 条
饮食需求 1 条
其他高频 1 条
菜品查询第 2 条
营业信息第 2 条
价格相关第 2 条
```

## 4. fallback 规则

当 active knowledge 数量不足 8 条时，按顺序补充以下 fallback：

```text
今天有什么推荐？
现在有什么吃的？
支持什么支付方式？
```

限制：

- fallback 最多 3 条。
- `sourceType = "fallback"`。
- `category = "推荐"`。
- fallback id 使用 `fallback-001`、`fallback-002`、`fallback-003`。

## 5. 返回结构

每条推荐统一返回：

```json
{
  "id": "k_001",
  "question": "今天有什么菜",
  "category": "菜品查询",
  "sourceType": "knowledge",
  "priority": 1
}
```

字段说明：

| 字段 | 含义 |
|---|---|
| `id` | knowledge id 或 fallback id |
| `question` | 推荐问题文本 |
| `category` | 推荐分类 |
| `sourceType` | `knowledge` 或 `fallback` |
| `priority` | 当前返回顺序，从 1 开始 |

## 6. 示例输出

当前 KB 有 20 条 active knowledge，实际推荐返回 8 条：

```json
{
  "suggestions": [
    {
      "id": "k_001",
      "question": "今天有什么菜",
      "category": "菜品查询",
      "sourceType": "knowledge",
      "priority": 1
    },
    {
      "id": "k_006",
      "question": "食堂几点开门",
      "category": "营业信息",
      "sourceType": "knowledge",
      "priority": 2
    },
    {
      "id": "k_009",
      "question": "套餐多少钱",
      "category": "价格相关",
      "sourceType": "knowledge",
      "priority": 3
    },
    {
      "id": "k_012",
      "question": "有适合素食者的菜吗",
      "category": "饮食需求",
      "sourceType": "knowledge",
      "priority": 4
    },
    {
      "id": "k_017",
      "question": "WiFi 密码是什么",
      "category": "其他高频",
      "sourceType": "knowledge",
      "priority": 5
    }
  ]
}
```

示例中仅展示前 5 条，完整验证结果见 `SmartDine_V1.1_P2_推荐策略验证报告.md`。

## 7. 边界

- 不修改 KB 数据。
- 不改变 `/chat` 响应结构。
- 不实现低置信度或 `confidence` 字段，那属于 TASK-P2-03。
- 不处理 H5 fallback 分类口径同步，那属于后续 TASK-P2-08。
