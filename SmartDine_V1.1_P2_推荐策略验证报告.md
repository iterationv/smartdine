# SmartDine V1.1 P2 推荐策略验证报告

## 1. 验证结论

- 是否完成推荐策略升级：已完成。
- 是否仍存在“全量返回”问题：否。当前 active knowledge 为 20 条，推荐返回 8 条。
- 是否满足返回条数 ≤ 8：满足。
- 是否覆盖至少 3 个不同 category：满足，当前覆盖 5 个 category。
- 是否影响 `/chat` 主链路：未修改 `/chat` 相关文件。
- 是否建议进入 TASK-P2-03：建议进入。

## 2. 验证环境

- 当前分支：`main`
- 样例集前置：`smartdine-api/test/fixtures/p2-retrieval-cases.json` 存在，`caseCount = 42`
- 验证方式：
  - TypeScript 构建：`npm run build`
  - 直接调用 `buildSuggestions()` helper
  - 使用 P2-04 样例集中的 `should_hit` 类做主题覆盖 sanity check

## 3. 返回条数

当前 KB 状态：

```text
active knowledge count: 20
suggestions count: 8
```

结论：

- 返回数量小于 active knowledge 总数。
- 不再返回全部 KB。
- 符合 `MAX_SUGGESTIONS = 8`。

## 4. category 分布

当前返回结果分布：

| category | 数量 |
|---|---:|
| 菜品查询 | 2 |
| 营业信息 | 2 |
| 价格相关 | 2 |
| 饮食需求 | 1 |
| 其他高频 | 1 |

结论：

- 覆盖 5 个不同 category。
- 没有出现单一 category 占满 8 条的情况。

## 5. sourceType 分布

当前 full KB 下：

| sourceType | 数量 |
|---|---:|
| knowledge | 8 |
| fallback | 0 |

结论：

- 当前 active knowledge 足够 8 条，因此 fallback 未触发。
- 所有返回项来自 knowledge。

## 6. fallback 验证

使用前 5 条 active knowledge 模拟知识不足场景：

```text
active knowledge count: 5
suggestions count: 8
knowledge suggestions: 5
fallback suggestions: 3
```

fallback 返回：

```json
[
  {
    "id": "fallback-001",
    "question": "今天有什么推荐？",
    "category": "推荐",
    "sourceType": "fallback",
    "priority": 6
  },
  {
    "id": "fallback-002",
    "question": "现在有什么吃的？",
    "category": "推荐",
    "sourceType": "fallback",
    "priority": 7
  },
  {
    "id": "fallback-003",
    "question": "支持什么支付方式？",
    "category": "推荐",
    "sourceType": "fallback",
    "priority": 8
  }
]
```

结论：

- active knowledge 不足 8 条时 fallback 正常补齐。
- fallback 不超过 3 条。

## 7. 示例输出

当前 KB 下完整返回示例：

```json
[
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
  },
  {
    "id": "k_002",
    "question": "今天的套餐是什么",
    "category": "菜品查询",
    "sourceType": "knowledge",
    "priority": 6
  },
  {
    "id": "k_007",
    "question": "食堂几点关门",
    "category": "营业信息",
    "sourceType": "knowledge",
    "priority": 7
  },
  {
    "id": "k_010",
    "question": "怎么付款",
    "category": "价格相关",
    "sourceType": "knowledge",
    "priority": 8
  }
]
```

## 8. P2-04 样例 sanity check

P2-04 样例集中 `should_hit` 共 20 条，覆盖：

- 支付：`case-010`、`case-011`
- 菜品 / 推荐 / 套餐：`case-001`、`case-002`、`case-003`
- 营业时间 / 状态：`case-006`、`case-007`、`case-008`
- 饮食需求：`case-012`、`case-013`、`case-014`、`case-015`、`case-016`
- 外带 / 订餐 / WiFi / 停车：`case-017` 至 `case-020`

推荐结果覆盖了这些主题中的核心分类：

- 菜品查询
- 营业信息
- 价格相关
- 饮食需求
- 其他高频

## 9. 禁止文件检查

已执行禁止范围 diff 检查：

```text
git diff --name-only -- smartdine-api/src/data smartdine-api/src/ai smartdine-admin/src smartdine-h5/src
git diff --name-only -- .env .env.ai .env.cc smartdine-api/.env smartdine-api/.env.ai smartdine-api/.env.cc
git diff --name-only -- smartdine-api/package.json smartdine-admin/package.json smartdine-h5/package.json package.json
```

结论：

- 未修改 KB 数据。
- 未修改 `/chat` 主逻辑或 `smartdine-api/src/ai/**`。
- 未修改 Admin / H5 源码。
- 未修改 `.env*`。
- 未修改依赖文件。

## 10. 已知边界

- 当前推荐策略是轻量工程策略，不引入复杂打分。
- 当前返回结果不包含 `confidence` / `fallbackReason`，这些属于 TASK-P2-03。
- H5 对新增字段的展示适配不在本任务范围内；现有调用方仍可继续读取 `question` 和 `category`。
