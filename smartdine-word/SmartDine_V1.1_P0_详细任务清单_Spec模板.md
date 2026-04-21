# SmartDine V1.1 P0 详细任务清单（已归档）
# 供 ChatGPT 拆解 Spec → 生成 Codex 细粒度执行指令

---

## 阶段状态说明

- 当前状态：P0 已完成（归档）
- 对应任务：TASK-01 ~ TASK-12 已全部完成
- 验收结论：P0 总体验收通过，命中率验收已通过
- 用途：回溯、验收依据、后续复盘参考
- 当前进行中：P1

---

## 文档说明

本文档对应阶段已完成，当前仅作为 P0 回溯、验收依据与复盘参考；后续执行主线已切换至 P1。

**本文档用途：**
将此文档完整提供给 ChatGPT，ChatGPT 将按照每个任务块内嵌的 Spec 模板，逐任务输出标准 Spec，再将每条 Spec 拆解为多条可直接给 Codex 执行的细粒度子指令。

**工作流：**
```
本文档 → ChatGPT 阅读 → 逐任务输出 Spec → 每条 Spec 拆出 N 条 Codex 子指令
```

**Codex 执行约束（ChatGPT 拆解时必须遵守）：**
- 每条 Codex 指令只做一件事，不跨文件超过 3 个
- 每条指令必须包含：目标文件路径、具体操作、验收检查点
- 不允许出现"按需实现"、"适当处理"等模糊表达
- 禁止跨阶段实现（不提前做 P1 内容）
- 新增依赖必须单独一条指令，并说明原因

---

## ChatGPT Spec 输出模板

> 每个任务块结尾都有 `【ChatGPT 请按此模板输出 Spec】` 标记。
> ChatGPT 输出时，对每个任务块产出如下结构：

```
### Spec: [任务名称]

**目标：** 一句话说明这个任务要达到什么结果

**输入：** 该任务依赖的已有文件 / 数据 / 接口
**输出：** 该任务完成后新增或修改的文件 / 接口 / 数据结构

**详细要求：**
1. [具体要求，可量化，不模糊]
2. ...

**边界约束：**
- 不做：[明确排除项]
- 不改：[禁止修改的文件]

**验收标准：**
- [ ] [可被判断"过没过"的具体条件]

---

#### Codex 子指令列表

**指令 1：[动词短语描述操作]**
- 目标文件：`路径/文件名`
- 操作：[具体要做什么，字段名、函数名、逻辑都要写清楚]
- 验收：[运行什么命令或检查什么结果来确认完成]

**指令 2：...**
```

---

## 项目上下文（ChatGPT 必读）

### 技术栈
- 后端：Node.js + Hono + TypeScript，路径 `smartdine-api/src/`
- H5：Vue 3 + Vite + JavaScript（禁止 TypeScript），路径 `smartdine-h5/src/`
- Admin：Vue 3 + Ant Design Vue + JavaScript，路径 `smartdine-admin/src/`
- 状态管理：Pinia（V1.1 新引入，H5 和 Admin 都需要）
- env 读取：后端统一走 `config.ts`，前端走 `import.meta.env.VITE_*`（必须有默认值）

### 当前已有能力（V1 遗留）
- `smartdine-api/src/faq.ts`：FAQ 内存缓存 + CRUD + 匹配逻辑
- `smartdine-api/src/llm.ts`：Kimi/OpenAI SDK 调用封装
- `smartdine-api/src/index.ts`：路由入口，含 authMiddleware
- `smartdine-h5/src/views/Chat.vue`：主页面，含品牌区 + 消息状态管理
- `smartdine-h5/src/api/chat.js`：postChat() 封装，含 x-api-key 注入

### 接口契约（不可破坏性修改）
```
POST /chat
Header: x-api-key: <API_SECRET>
Body:   { "question": "..." }
返回（命中）：  { "answer": "...", "source": "knowledge|faq", "matched": { "id": "...", "title": "..." } }
返回（未命中）：{ "answer": "...", "source": "ai_fallback", "matched": null }
```

### 未命中回退策略（已定义，不可更改）
命中失败 → AI 兜底回答 + 未命中问题入库
回答统一前缀："这个问题暂时没有找到准确答案，以下仅供参考："

### 禁止修改的文件
- `smartdine-api/.env`
- `smartdine-h5/.env.local`
- `smartdine-api/src/data/faq.json`（只通过接口修改）
- 任意 `package.json` 的 dependencies（新增依赖需单独一条指令）

---

## P0 任务清单（归档）

> 按以下顺序执行，存在依赖关系时不可乱序。

---

### TASK-01｜知识条目数据结构设计

**所属模块：** 后端
**优先级：** P0 第一批（其他所有任务的基础）
**依赖：** 无
**被依赖：** TASK-02 / TASK-03 / TASK-04 / TASK-06 / TASK-07

**任务描述：**
将现有 `faq.json` 的简单问答结构升级为完整的知识条目结构，并定义对应的 TypeScript 类型。旧 FAQ 数据需保持兼容，不可直接删除。

**字段定义：**
```typescript
interface KnowledgeItem {
  id: string          // 格式: "k_001", "k_002"...
  title: string       // 条目标题，用于列表展示
  question: string    // 标准问法
  answer: string      // 标准答案
  aliases: string[]   // 同义问法/别名，用于命中扩展
  tags: string[]      // 分类标签，如 ["营养", "菜品", "过敏原"]
  status: "active" | "inactive"
  createdAt: string   // ISO8601
  updatedAt: string   // ISO8601
}
```

**迁移策略：**
旧 FAQ 数据（`{ id, question, answer, tags }`）迁移时：
- title = question（截取前20字符）
- aliases = []
- status = "active"
- createdAt = updatedAt = 当前时间

【ChatGPT 请按此模板输出 Spec】

---

### TASK-02｜知识条目 CRUD 接口

**所属模块：** 后端
**优先级：** P0 第一批
**依赖：** TASK-01
**被依赖：** TASK-06 / TASK-07

**任务描述：**
在 `smartdine-api/src/` 下新建 `knowledge/` 模块，实现知识条目的增删改查接口，替代旧的 FAQ CRUD 接口。旧 FAQ 接口保留，不删除（向后兼容）。

**接口列表：**
```
GET    /api/knowledge          查询列表，支持 ?status=active&tag=营养&keyword=关键词
POST   /api/knowledge          新增条目
PUT    /api/knowledge/:id      编辑条目
PATCH  /api/knowledge/:id/status  切换状态（active/inactive）
DELETE /api/knowledge/:id      删除条目
```

**存储方式：**
V1.1 阶段使用 JSON 文件存储（`src/data/knowledge.json`），结构为数组，与 `faq.json` 分开存放。

**权限：**
所有 `/api/knowledge` 路由必须挂载 `authMiddleware`。

**分层要求：**
- 路由层：`src/routes/knowledge.ts`（只做路由注册和参数校验）
- 服务层：`src/services/knowledgeService.ts`（业务逻辑）
- 数据访问层：`src/data/knowledgeStore.ts`（文件读写）

【ChatGPT 请按此模板输出 Spec】

---

### TASK-03｜基础命中能力

**所属模块：** 后端 AI 编排层
**优先级：** P0 第一批
**依赖：** TASK-01
**被依赖：** TASK-04 / TASK-05

**任务描述：**
在 `smartdine-api/src/ai/` 下实现知识命中模块，替代旧的 `faq.ts` 中的简单匹配逻辑。旧逻辑保留，新逻辑通过函数调用方式接入 `/chat` 路由。

**模块文件结构：**
```
src/ai/
├── retrieve.ts         ← 入口：接收 question，返回命中结果或 null
├── matchKnowledge.ts   ← 核心匹配逻辑
├── buildContext.ts     ← 构建发给 LLM 的上下文
├── generateAnswer.ts   ← 调用 LLM 生成回答
└── saveQuestionLog.ts  ← 日志入库（依赖 TASK-04）
```

**matchKnowledge.ts 实现要求：**
1. 问题预处理：去除"吗、呢、啊、请问、你好"等语气词；统一全角转半角；转小写
2. 关键词命中：将处理后的问题与知识条目的 question 做分词交集匹配，交集词数 ≥ 2 视为命中
3. 别名命中：遍历 aliases 字段，任意一个 alias 被问题包含则命中
4. 排序：按命中词数降序，返回最高分条目
5. 只返回 status = "active" 的条目
6. 无命中时返回 null

**retrieve.ts 逻辑：**
```
1. 调用 matchKnowledge(question) → 有结果 → 直接返回 { matched, source: "knowledge" }
2. 无结果 → 调用 generateAnswer(question, null) → 返回 { matched: null, source: "ai_fallback" }
3. 无论命中与否，调用 saveQuestionLog(...)
```

【ChatGPT 请按此模板输出 Spec】

---

### TASK-04｜问题日志 + 未命中记录

**所属模块：** 后端
**优先级：** P0 第一批
**依赖：** TASK-01（间接）
**被依赖：** TASK-03 / TASK-07

**任务描述：**
实现问题日志和未命中问题的持久化存储与查询接口。

**数据结构：**
```typescript
// 问题日志
interface QuestionLog {
  id: string           // "log_" + timestamp + random
  question: string     // 用户原始提问
  matchedId: string | null   // 命中的知识条目 id，未命中为 null
  matchedTitle: string | null
  source: "knowledge" | "faq" | "ai_fallback"
  answer: string       // 最终返回给用户的回答
  createdAt: string    // ISO8601
}

// 未命中问题（从 QuestionLog 中 source="ai_fallback" 的记录派生，单独存储）
interface MissedQuestion {
  id: string
  question: string
  createdAt: string
  convertedToKnowledge: boolean   // 是否已转为知识条目（P1 功能，P0 默认 false）
}
```

**接口列表：**
```
GET /api/logs               查询问题日志，支持 ?page=1&size=20&keyword=xxx
GET /api/logs/missed        查询未命中问题，支持 ?page=1&size=20&startDate=&endDate=
```

**存储：** JSON 文件（`src/data/questionLogs.json` 和 `src/data/missedQuestions.json`）

**权限：** 所有接口挂 `authMiddleware`

**分层：**
- 路由：`src/routes/logs.ts`
- 服务：`src/services/logService.ts`
- 数据访问：`src/data/logStore.ts`

【ChatGPT 请按此模板输出 Spec】

---

### TASK-05｜/chat 路由接入新命中链路

**所属模块：** 后端
**优先级：** P0 第一批
**依赖：** TASK-03 / TASK-04
**被依赖：** TASK-08（H5 联调）

**任务描述：**
将 `/chat` 路由中的旧 FAQ 匹配逻辑替换为调用 `retrieve.ts`，同时保持接口契约不变。

**修改范围：**
- 只改 `src/index.ts` 中 `/chat` 路由处理函数内部逻辑
- 接口入参、返回结构、Header 要求不变
- 旧 `faq.ts` 的 matchFaq 函数保留，不删除

**新 /chat 处理逻辑：**
```
1. 接收 { question }
2. 调用 retrieve(question) → { matched, source, answer }
3. 按现有返回结构组装响应
4. 返回 { answer, source, matched: matched ? { id, title } : null }
```

**验收：**
- `curl -X POST /chat -d '{"question":"今天有什么菜"}'` 返回结构符合契约
- 日志文件中能查到这条记录
- 未命中问题能进入 missedQuestions.json

【ChatGPT 请按此模板输出 Spec】

---

### TASK-06｜Admin 知识条目管理页

**所属模块：** Admin 端
**优先级：** P0 第二批
**依赖：** TASK-02
**被依赖：** TASK-09（Admin Pinia）

**任务描述：**
在 Admin 端新增知识条目管理页，实现知识库的可视化增删改查。

**页面路径：** `/knowledge`
**文件位置：** `smartdine-admin/src/views/KnowledgeList.vue`

**页面功能清单：**
1. 列表展示：分页表格，列：标题 / 标准问法（截断30字） / 分类标签 / 状态 / 更新时间 / 操作
2. 搜索：关键词搜索框（实时搜索标题和问法）+ 状态筛选下拉（全部/启用/停用）
3. 新增：点击"新增"弹出 Modal，表单字段：标题 / 标准问法 / 标准答案 / 同义问法（tag 输入）/ 分类标签 / 状态
4. 编辑：行内操作"编辑"，复用新增 Modal，回填数据
5. 状态切换：行内操作"启用/停用"，调用 PATCH /api/knowledge/:id/status
6. 删除：行内操作"删除"，二次确认后调用 DELETE 接口

**表单校验：**
- 标题：必填，最长50字
- 标准问法：必填，最长100字
- 标准答案：必填，最长500字
- 同义问法：非必填，单条最长50字

**状态管理：**
使用 Pinia store（TASK-09 统一处理），本页只调用 store action，不在组件内直接发请求。

【ChatGPT 请按此模板输出 Spec】

---

### TASK-07｜Admin 未命中问题页

**所属模块：** Admin 端
**优先级：** P0 第二批
**依赖：** TASK-04
**被依赖：** 无

**任务描述：**
在 Admin 端新增未命中问题列表页，供运营人员查看用户提了哪些系统无法回答的问题。

**页面路径：** `/missed`
**文件位置：** `smartdine-admin/src/views/MissedList.vue`

**页面功能清单：**
1. 列表展示：表格，列：问题内容 / 提问时间 / 操作
2. 筛选：时间范围选择器（今天 / 最近7天 / 自定义）+ 关键词搜索
3. 操作列：预留"转为知识条目"按钮（P0 阶段显示但置灰，点击提示"即将上线"）
4. 分页：每页20条

**不做（P0 排除）：**
- 转为知识条目的实际功能（P1 实现）
- 批量操作
- 导出功能

【ChatGPT 请按此模板输出 Spec】

---

### TASK-08｜H5 首页产品化优化

**所属模块：** H5 端
**优先级：** P0 第二批
**依赖：** TASK-05（后端命中链路就绪）
**被依赖：** TASK-10（H5 Pinia）

**任务描述：**
优化 H5 首页和问答结果展示，从测试页升级为具备服务入口感的产品页。

**修改文件：**
- `smartdine-h5/src/views/Chat.vue`（主要改动）
- `smartdine-h5/src/components/MessageList.vue`
- `smartdine-h5/src/components/InputBar.vue`

**首页新增：**
1. 推荐问题区域：展示5个推荐问题卡片（数据先硬编码，格式：`["今天有什么菜?", "有没有适合素食者的菜?", ...]`）
2. 点击推荐问题卡片 → 自动填入输入框并提交
3. 输入框 placeholder：从"请输入问题"改为"试着问：今天有什么好吃的？"

**回答展示优化：**
1. AI 回答用卡片样式展示（白色背景、圆角、阴影），区别于用户消息气泡
2. source = "knowledge" 时，卡片底部显示小标签"✓ 来自知识库"
3. source = "ai_fallback" 时，卡片底部显示小标签"⚡ AI 回答"

**状态展示（必须覆盖以下4种）：**
1. 加载中：输入框禁用 + 显示"正在思考中..."的 loading 占位卡片
2. 空状态：首次进入页面，消息列表为空时，显示推荐问题区域
3. 未命中：`matched === null` 且 `source === "ai_fallback"` 时，回答卡片顶部显示橙色提示条"未找到精确答案，以下仅供参考"
4. 错误：接口报错时，显示"网络异常，请稍后再试"的错误卡片，不崩溃

**禁止改动：**
- `api/chat.js` 中的 postChat() 接口封装逻辑（只能改调用方）
- `.env.local` 文件

【ChatGPT 请按此模板输出 Spec】

---

### TASK-09｜Admin Pinia 状态管理

**所属模块：** Admin 端
**优先级：** P0 第二批
**依赖：** TASK-06 / TASK-07
**被依赖：** 无

**任务描述：**
为 Admin 端引入 Pinia，建立知识管理和日志查询两个 store，规范跨组件共享状态。

**安装：**
```bash
npm install pinia
# 在 main.js 中注册：app.use(createPinia())
```

**Store 定义：**

`src/stores/knowledgeStore.js`
```javascript
// state
list: []          // 知识条目列表
total: 0
loading: false
filters: { keyword: "", status: "all", tag: "" }
currentPage: 1

// actions
fetchList()       // 调用 GET /api/knowledge，写入 list 和 total
createItem(data)  // 调用 POST /api/knowledge
updateItem(id, data)  // 调用 PUT /api/knowledge/:id
toggleStatus(id, status)  // 调用 PATCH /api/knowledge/:id/status
deleteItem(id)    // 调用 DELETE /api/knowledge/:id
```

`src/stores/logStore.js`
```javascript
// state
missedList: []
missedTotal: 0
loading: false
filters: { keyword: "", dateRange: [] }
currentPage: 1

// actions
fetchMissed()     // 调用 GET /api/logs/missed
```

**使用规范（必须写进 store 文件顶部注释）：**
- 跨页面共享状态 → 走 store
- 页面局部 UI 状态（modal 开关、表单临时值）→ 用组件内 ref/reactive，不进 store

【ChatGPT 请按此模板输出 Spec】

---

### TASK-10｜H5 Pinia 状态管理

**所属模块：** H5 端
**优先级：** P0 第二批
**依赖：** TASK-08
**被依赖：** 无

**任务描述：**
为 H5 端引入 Pinia，管理会话状态和推荐问题状态，收敛 Chat.vue 中过重的组件内状态。

**Store 定义：**

`src/stores/chatStore.js`
```javascript
// state
messages: []       // { role: "user"|"assistant", content: string, source?: string, matched?: object }
loading: false
error: null        // string | null

// actions
sendQuestion(question)   // 调用 postChat()，管理 loading/error，写入 messages
clearMessages()
```

`src/stores/suggestStore.js`
```javascript
// state
suggestions: [
  "今天有什么菜？",
  "有适合素食者的菜吗？",
  "今天的套餐是什么？",
  "有没有低卡的选择？",
  "营业时间是几点？"
]
// P0 阶段硬编码，P1 阶段改为从接口拉取
```

**Chat.vue 改造要求：**
- 原组件内的 messages 数组、loading、error 状态全部迁移到 chatStore
- 组件通过 `const chatStore = useChatStore()` 使用
- 推荐问题从 suggestStore 读取

【ChatGPT 请按此模板输出 Spec】

---

### TASK-11｜Admin 热门问题统计模块

**所属模块：** Admin 端
**优先级：** P0 第二批
**依赖：** TASK-04
**被依赖：** 无

**任务描述：**
在 Admin 首页或独立页面展示热门问题统计，基于问题日志数据聚合。

**页面路径：** `/dashboard`（Admin 首页）
**文件位置：** `smartdine-admin/src/views/Dashboard.vue`

**统计模块内容：**
1. 热门问题 Top 10：按问题内容聚合计数，展示问题文本 + 提问次数，降序排列
2. 时间范围：支持"今天 / 最近7天 / 最近30天"切换
3. 未命中问题数量：展示一个数字卡片，显示所选时间内未命中总次数

**后端新增接口：**
```
GET /api/logs/stats?range=7d
返回：{
  topQuestions: [{ question: string, count: number }],  // Top 10
  missedCount: number
}
```

**不做（P0 排除）：**
- 图表可视化（只做文字列表和数字卡片）
- 命中率趋势折线图（P1）
- 导出报表

【ChatGPT 请按此模板输出 Spec】

---

### TASK-12｜初始知识条目数据录入

**所属模块：** 数据 / 后端
**优先级：** P0 第二批（在 TASK-01 完成后可并行执行）
**依赖：** TASK-01
**被依赖：** P0 验收测试

**任务描述：**
整理并录入覆盖高频场景的初始知识条目，作为 P0 验收的测试数据基础。没有真实数据，命中率验收无法进行。

**数量要求：** ≥ 20 条

**覆盖场景（必须涵盖以下分类）：**
- 菜品查询（今天有什么菜 / 有没有XXX菜）：≥5 条
- 营业信息（几点开始 / 几点结束 / 今天开不开）：≥3 条
- 价格相关（套餐多少钱 / 怎么付款）：≥3 条
- 饮食需求（素食 / 无麸质 / 低卡 / 过敏原）：≥5 条
- 其他高频（WiFi密码 / 停车 / 外带）：≥4 条

**每条格式要求：**
- aliases 至少写 2 个同义问法
- tags 至少打 1 个分类标签
- status 全部为 "active"

**产出：** 直接写入 `smartdine-api/src/data/knowledge.json`

【ChatGPT 请按此模板输出 Spec】

---

## P0 执行顺序与依赖关系

```
第一批（并行执行）：
  TASK-01  知识条目数据结构设计
    ├─ TASK-02  知识条目 CRUD 接口
    ├─ TASK-03  基础命中能力
    └─ TASK-04  问题日志 + 未命中记录
       └─ TASK-05  /chat 路由接入新链路

第二批（TASK-05 完成后并行执行）：
  TASK-06  Admin 知识条目管理页
  TASK-07  Admin 未命中问题页
  TASK-08  H5 首页产品化优化
  TASK-11  Admin 热门问题统计
  TASK-12  初始知识条目数据录入（可在 TASK-01 后立即并行）

第三批（第二批完成后）：
  TASK-09  Admin Pinia 状态管理
  TASK-10  H5 Pinia 状态管理
```

---

## P0 验收标准（归档）

| 验收项 | 标准 | 相关任务 |
|-------|------|---------|
| 命中率 | 预设20个高频问题，命中率 ≥ 80% | TASK-03 / TASK-12 |
| 未命中记录 | 未命中问题可在 Admin 查看，延迟 ≤ 5 分钟 | TASK-04 / TASK-07 |
| 知识管理 | 新增/编辑/状态切换无报错，数据持久化 | TASK-02 / TASK-06 |
| H5 状态覆盖 | 加载/空/未命中/错误4种状态均正常展示 | TASK-08 |
| Pinia | H5 和 Admin 均已引入，store 按规范划分 | TASK-09 / TASK-10 |
| 后端分层 | 路由/服务/AI编排/数据访问四层明确 | TASK-02 / TASK-03 / TASK-04 |
| 接口兼容 | /chat 接口契约未发生破坏性变更 | TASK-05 |

---

## 给 ChatGPT 的指令（归档保留，非当前执行主线）

以下内容保留原始执行指令，仅供回溯参考；当前主线已切换至 P1。

```
你是一名资深全栈工程师，负责将以下 SmartDine V1.1 P0 任务清单拆解为可执行的开发 Spec 和 Codex 子指令。

请按照以下规则处理：

1. 逐任务处理，不要跳过任何一个 TASK
2. 每个 TASK 按文档内嵌的「ChatGPT 请按此模板输出 Spec」模板输出
3. 每条 Spec 必须拆出多条 Codex 子指令，每条子指令：
   - 只做一件事（单一职责）
   - 包含目标文件完整路径
   - 包含具体操作（字段名/函数名/逻辑都要写清楚，不能用"适当处理"等模糊表达）
   - 包含可验证的验收检查点
4. 严格遵守项目上下文中的禁止修改文件列表
5. 新增 npm 依赖必须单独一条指令，说明安装命令和原因
6. 不实现任何 P1 内容，即使"顺手"也不允许
7. 所有 Codex 子指令必须可以直接复制给 Codex 执行，不需要人工补充信息

现在请开始处理第一个任务：TASK-01
（处理完一个后继续下一个，直到所有 TASK 处理完毕）
```
