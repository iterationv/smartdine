# SmartDine V1.1 P2 Admin 问答日志页面说明

## 1. 页面路径

- 页面名称：问答日志
- 路由路径：`/qa-events`
- 页面文件：`smartdine-admin/src/views/QaEvents.vue`

## 2. 菜单位置

顶部导航新增“问答日志”，位置在“知识管理”之后。

## 3. 接口说明

页面调用：

```text
GET /api/admin/qa-events?limit=20
GET /api/admin/qa-events?limit=20&confidence=ambiguous
```

接口封装：

```text
smartdine-admin/src/api/qaEvents.js
```

返回结构：

```json
{
  "total": 4,
  "list": []
}
```

## 4. 列表字段

| 字段 | 来源 | 展示规则 |
|---|---|---|
| 时间 | `timestamp` | 转为本地可读时间 |
| 用户问题 | `query` | 表格中截断，`title` 保留完整文本 |
| 置信度 | `confidence` | 标签展示 |
| 兜底原因 | `fallbackReason` | 空值显示 `-` |
| 命中知识 ID | `topMatchId` | 空值显示 `-` |
| 命中分数 | `topScore` | 保留 2 位小数 |
| 耗时 | `duration` | 显示为 `N ms` |

## 5. 筛选说明

支持最小筛选：

- confidence：全部 / high / low / ambiguous / unknown_entity
- limit：20 / 50 / 100

切换任一筛选项会重新请求接口。

## 6. 交互说明

- 页面加载时自动请求日志。
- 提供手动刷新按钮。
- loading 状态使用表格 loading 与刷新按钮 loading。
- 空数据时显示“暂无问答日志”。
- 接口失败时显示错误提示，不白屏。

## 7. 不做范围

本轮不做：

- 图表统计
- 日志导出
- 实时刷新 / 自动轮询
- 日期范围筛选
- 日志详情弹窗
- 日志删除
- 日志回放
- 权限体系改造
