# SmartDine V1.1 P2 第二轮 Codex 执行指令包

> 5 个独立指令包,按顺序执行。每包完成后必须先生成验收报告,再 Claude Code 交叉验证,再由用户确认是否提交;不得连续执行多个包。

---

## 总体执行约束(适用于所有 5 个包)

### 硬约束

1. **每包完成后必须先生成验收报告,再由 Claude Code 交叉校验,再由用户确认后才能 commit;严禁连续执行多个包**。
2. 不修改 `.env*` 中的真实密钥(可新增模板中的变量名)。
3. 不修改 KB 数据(`smartdine-api/src/data/faq.json`、`smartdine-api/data/**`)。
4. 不引入 RAG / 向量库 / embedding。
5. 不引入多账号 / 多角色 / 多租户。
6. 不做整体视觉重构。
7. 不引入新的主数据库或缓存中间件。
8. 不修改 `package.json` / `tsconfig.json` / `vite.config.*`,除非该包指令明确允许。
9. 每包内部不得 push 到远端,push 由用户手动执行。
10. 每包内 commit 前必须由用户确认。

### 范围冻结

P2 第二轮**只做**以下 5 包内容:

- 包 1:启动基线确认 + 工程预清理
- 包 2:H5 confidence 适配 + P2-11A 单日读取优化
- 包 3:P2-02 字段补齐 + P2-11B Admin 日志页增强
- 包 4:P2-05 Admin 真实认证
- 包 5:P2-07 AI 配置后台化最小落地

**不做**:

- low 阈值真实样本回归(留第三轮)
- P2-08 H5 推荐 fallback 口径同步(留第三轮)
- P2-09 Admin bundle 拆包(留第三轮)
- P2-10 Query Rewrite(持续暂缓)
- 任何 P3 视觉重构

### 模型分工

| 包 | 推荐模型 | 性质 |
|---|---|---|
| 包 1 | Codex 5.4 | 只读 / 清理 / 基线确认 |
| 包 2 | Codex 5.4 | 非破坏性小补丁 |
| 包 3 | Codex 5.4 | 非破坏性字段补齐 / 页面增强 |
| 包 4 | Codex 5.5 | 核心契约变更 / API + Admin 联调 / 安全逻辑 |
| 包 5 | Codex 5.5 | 依赖 P2-05 / 配置后台化 / 审计日志 |

---

# 包 1:P2 第二轮启动基线确认 + 工程预清理

> **执行模型:Codex 5.4**(只读 + 工程清理任务,不需要 5.5)
> **性质**:只读检查 + 局部清理,不开发功能,不动业务代码。
> **预计工作量**:0.5 天

## 1. 任务目标

为 P2 第二轮建立干净的执行基线:

1. 确认第一轮收口状态(7 条 commit 已合入,工作区干净)。
2. 清理 P2 第一轮遗留的执行残留(`.claude/worktrees` 等)。
3. 确认三端可正常 build。
4. 确认 P2 第二轮任务文档齐全。
5. 不修改任何业务代码、KB、`.env*`。

## 2. 读取文件

- `AGENTS.md`、`CLAUDE.md`、`README.md`
- `SmartDine_V1.1_P2_文档级任务清单.md`
- `SmartDine_V1.1_P2_详细任务清单.md`
- `SmartDine_V1.1_P2_第一轮验收报告.md`
- `SmartDine_V1.1_P2_第一轮交叉校验报告.md`
- `SmartDine_V1.1_P2_第一轮收尾补丁_执行报告.md`
- `SmartDine_V1.1_P2_AI配置后台化方案.md`(为包 5 做准备)

## 3. 允许修改文件

仅允许:

- 删除 `.claude/worktrees/` 下的残留目录(如 `.claude/worktrees/youthful-mclean-8368e5`、`.claude/worktrees/nice-knuth-3d8df3`)
- 更新 `.gitignore` 中关于 `.claude/worktrees/` 的规则(如尚未生效)
- 新建 `SmartDine_V1.1_P2_第二轮启动基线确认.md`(本包验收报告)

**除上述外不得修改任何已有文件**。

## 4. 禁止修改文件

- 所有 `smartdine-api/src/**`
- 所有 `smartdine-admin/src/**`
- 所有 `smartdine-h5/src/**`
- KB 数据
- `.env*`
- `package.json` / lock 文件
- `tsconfig.json` / `vite.config.*`
- 所有 P2 任务清单与历史报告

## 5. 执行步骤

### 5.1 第一轮收口状态确认

```powershell
git log --oneline -10
git status --short
git branch --show-current
```

确认:

- 当前分支是 main(或 P2 工作分支)
- P2 第一轮 7 条 commit 已合入(`775466c` / `ecc0b5d` / `4a7bc27` / `e3b934d` / `109754a` / `60fe359` / `d47f714`)
- 工作区只有 `.claude/worktrees` 残留,无其他脏改动

### 5.2 清理 `.claude/worktrees` 残留

逐项确认后清理:

```powershell
# 先看清楚有什么
ls .claude/worktrees -Force
git worktree list

# 删除残留目录(不动 git 历史)
Remove-Item -Recurse -Force .claude/worktrees/youthful-mclean-8368e5
Remove-Item -Recurse -Force .claude/worktrees/nice-knuth-3d8df3
```

确认 `.gitignore` 中已包含:

```text
.claude/worktrees/
```

如不存在,**追加**(不要替换其他规则)。

### 5.3 三端构建验证

```powershell
# API
cd smartdine-api
npm run build
cd ..

# Admin
cd smartdine-admin
npm run build
cd ..

# H5(可选,本包不强求)
cd smartdine-h5
npm run build
cd ..
```

记录每端 build 结果与已知 warning(Admin bundle chunk warning 是已知项,不算失败)。

### 5.4 三端启动可用性验证(只验证可启动,立即退出)

```powershell
# API /health
cd smartdine-api
# 启动后访问 /health,确认 200 后立即停止
```

Admin / H5 同样确认可启动开发服务器,立即停止。任一端启动失败,记录错误,不修复,继续下一步。

### 5.5 P2 第二轮文档齐全确认

确认以下文档存在且可读:

- P2 文档级任务清单
- P2 详细任务清单
- P2-06 AI 配置后台化方案(包 5 输入)
- 第一轮验收 + 交叉校验 + 收尾补丁三份报告

### 5.6 输出包 1 验收报告

新建 `SmartDine_V1.1_P2_第二轮启动基线确认.md`,结构:

```markdown
# SmartDine V1.1 P2 第二轮启动基线确认

## 1. 第一轮收口状态
- 7 条 commit 是否齐全:
- 工作区状态:
- 当前分支:

## 2. 工程残留清理
- 清理前 .claude/worktrees 状态:
- 清理操作明细:
- .gitignore 状态:
- 清理后 git status:

## 3. 三端 build 状态
- API build:
- Admin build:(已知 warning 列出)
- H5 build:

## 4. 三端启动状态
- API /health:
- Admin 启动:
- H5 启动:

## 5. P2 第二轮文档齐全性
- 任务清单:
- AI 配置方案:
- 历史报告:

## 6. 是否建议进入包 2
- 结论:
- 阻塞项:
- 非阻塞遗留:
```

## 6. 验收标准

- [ ] 第一轮 7 条 commit 已确认在 main
- [ ] `.claude/worktrees/` 残留已清理,`.gitignore` 已生效
- [ ] 三端 build 全部通过(Admin chunk warning 不算失败)
- [ ] P2 第二轮文档齐全
- [ ] 验收报告已生成
- [ ] 未修改任何业务代码、KB、`.env*`

## 7. 风险点

- `Remove-Item -Recurse` 路径写错可能误删源码;每次执行前用 `ls` 先确认目录内容
- 三端启动若端口被占用,先确认 3000 / 5173 / 5174 等端口空闲

## 8. 输出报告要求

输出唯一新文件:`SmartDine_V1.1_P2_第二轮启动基线确认.md`

## 9. 建议提交信息

```text
chore(p2): clean up worktree residue and confirm round-2 baseline
docs(p2): add P2 round-2 baseline confirmation
```

(两条 commit 合并为一条:`chore(p2): prepare round-2 baseline (worktree cleanup + confirmation)`)

---

# 包 2:H5 confidence 适配 + P2-11A 单日读取优化

> **执行模型:Codex 5.4**(非破坏性小补丁)
> **性质**:H5 端展示扩展 + API 端性能优化,均不改契约
> **预计工作量**:1 天
> **前置依赖**:包 1 已完成验收

## 1. 任务目标

两个独立小补丁:

1. **H5 confidence 适配**:让用户能感知到 P2-03 引入的 confidence 状态,而不是只有运营在 Admin 后台能看到。
2. **P2-11A 单日读取优化**:消除 `queryQaEvents()` 全量扫描所有日期 jsonl 的内存放大风险。

## 2. 子任务 A:H5 confidence/candidates 展示适配

### 2.1 范围

- `smartdine-h5/src/` 下聊天回答展示组件
- 根据 `/chat` 响应的 `confidence` 字段,差异化展示回答
- **不修改任何 API 代码**

### 2.2 展示策略(对照 P2-03 设计)

| confidence | 展示形态 |
|---|---|
| `high` | 正常展示回答,无额外提示 |
| `low` | 回答前加"我不太确定:"前缀,可加个轻量提示图标(用现有 emoji 即可,不引入图标库) |
| `ambiguous` | 不直接展示回答,展示候选列表(`candidates` 字段),用户点击后重发请求 |
| `unknown_entity` | 以提示样式展示(灰色背景或类似)兜底文案,不伪装成确定答案 |

### 2.3 不做

- 不引入新组件库、新图标库
- 不重构聊天主布局
- 不引入新依赖
- 不改变现有正常回答的样式

### 2.4 实现要求

- 全部用 Vue3 Options API + 现有 CSS,**严禁** `<script setup lang="ts">` 或 `.ts` 文件(违反 H5 铁律)
- `import.meta.env.VITE_*` 必须写回退默认值
- 不引入 axios

### 2.5 验收

- [ ] H5 收到 `confidence: high` 响应时,UI 与改动前一致(回归不破坏)
- [ ] H5 收到 `confidence: low` 响应时,有可见的"不确定"标识
- [ ] H5 收到 `confidence: ambiguous` 响应时,展示 candidates 候选列表,点击后能重发请求
- [ ] H5 收到 `confidence: unknown_entity` 响应时,有兜底样式
- [ ] 无 console.log 残留
- [ ] H5 build 通过
- [ ] 无新依赖

## 3. 子任务 B:P2-11A `queryQaEvents()` 单日读取优化

### 3.1 当前问题

`smartdine-api/src/utils/qaEvents.ts` 中 `queryQaEvents()` 一次性读取 `logs/` 下**所有日期**的 jsonl 文件,在内存中 flat / filter / sort 后再分页。30 天后会出现 I/O 与 GC 压力线性放大。

### 3.2 优化方案

1. `GET /api/admin/qa-events` 端点新增 `date` 必传参数(YYYY-MM-DD 格式;为兼容保留:**未传时默认当天**)。
2. `queryQaEvents(date, ...)` **只读取对应日期的单个 jsonl 文件**。
3. 文件不存在时返回空数组(不报错)。
4. 翻页改为"单文件内分页",`page` 与 `limit` 在单日数据集内生效。
5. 保留 `confidence` 多选筛选(继续支持)。

### 3.3 字段契约

`GET /api/admin/qa-events` query 参数:

```
date:        YYYY-MM-DD,默认今天(server timezone)
confidence:  逗号分隔多值,如 "low,unknown_entity",可选
page:        默认 1
limit:       默认 20,上限 100
```

响应结构(保持兼容):

```json
{
  "items": [...],
  "total": 数字,        // 单日数据总数
  "page": 数字,
  "limit": 数字,
  "date": "YYYY-MM-DD"  // 新增:回显本次查询的日期
}
```

### 3.4 不做

- 不做日期范围跨天查询(留给包 3 的 P2-11B 增强)
- 不做日志归档/压缩
- 不引入新存储方式

### 3.5 验收

- [ ] 端点不传 `date` 时返回当天数据
- [ ] 端点传 `date=2026-04-25` 时仅读取 `qa-events-2026-04-25.jsonl`
- [ ] 文件不存在时返回 `{ items: [], total: 0, ... }`,HTTP 200
- [ ] 多日 jsonl 共存场景下,内存占用与单日数据量线性,不再随历史天数增长
- [ ] `confidence` 多选筛选仍生效
- [ ] 分页参数生效,`limit` 上限 100
- [ ] 现有 Admin 页面仍能正常调用(可能需要包 3 才完全适配,但本包不能让 Admin 页面崩)

## 4. 范围合规检查

- [ ] 未修改 KB
- [ ] 未修改 `.env*`
- [ ] 未引入新依赖
- [ ] H5 未引入 axios / UI 库 / `<script setup lang="ts">`
- [ ] API `/health` 未挂中间件

## 5. 输出报告

新建 `SmartDine_V1.1_P2_第二轮_包2_执行报告.md`:

```markdown
# 包 2 执行报告

## 子任务 A:H5 confidence 适配
- 改动文件:
- 四种 confidence 展示样式:
- H5 build 结果:
- 截图或视频(可选):

## 子任务 B:queryQaEvents 单日读取
- 端点新参数:
- 实测多日 jsonl 共存场景:
- 内存占用对比(可选):
- 兼容性验证:Admin 页面是否仍工作:

## 范围合规
## 风险与遗留
```

## 6. 建议提交信息

```text
feat(h5): display confidence and candidates in chat ui
perf(api): switch qa events query to single-day read
```

---

# 包 3:P2-02 推荐策略字段补齐 + P2-11B Admin 日志页增强

> **执行模型:Codex 5.4**(非破坏性字段补齐 / 页面增强)
> **性质**:接口字段扩展 + Admin 页面功能增强
> **预计工作量**:1-1.5 天
> **前置依赖**:包 2 已完成验收

## 1. 任务目标

把 P2 第一轮交叉校验暴露的两类"任务清单要求但未实现"的字段补齐:

1. **P2-02 推荐策略**:补 `limit` query 参数、`MAX_PER_CATEGORY` 常量、`priority` 输入排序、`popularity` 透传
2. **P2-11B Admin 日志页**:补日期范围控件、多选 confidence 筛选、真分页

## 2. 子任务 A:P2-02 推荐策略字段补齐

### 2.1 范围

- `smartdine-api/src/routes/suggestions.ts`
- `smartdine-api/src/config/suggestions.ts`(若存在,否则新建)
- 相关单元测试

### 2.2 改动点

#### 2.2.1 新增 `limit` query 参数

```
GET /api/suggestions?limit=8

- limit: 1 ≤ limit ≤ 20,默认 8
- limit > 20 时强制截断到 20,不报错
- limit 非数字时使用默认值 8
```

#### 2.2.2 新增 `MAX_PER_CATEGORY` 常量

```ts
export const MAX_PER_CATEGORY = 3;
```

实际生效:每个分类最多返回 `MAX_PER_CATEGORY` 条,达到限制后该分类不再加入。

兜底:若按分类均衡后总数不足 `limit`,放宽限制再补齐(避免返回空)。

#### 2.2.3 新增 `priority` 输入字段排序

知识条目若存在 `priority` 字段(数字,数值越小越靠前),优先按 priority 升序;无 priority 字段的按现有规则(`createdAt` 倒序 / id)。

不强制要求所有 KB 条目都有 priority 字段(向后兼容)。

#### 2.2.4 新增 `popularity` 透传

响应每条目附带 `popularity: number | null`(从 KB 透传,本期不做点击统计)。

无该字段时返回 null,不阻塞。

### 2.3 响应结构

```json
{
  "id": "...",
  "question": "...",
  "category": "...",
  "sourceType": "active" | "fallback",
  "priority": 数字 | null,
  "popularity": 数字 | null
}
```

老调用方如不消费 priority / popularity,**不受影响**。

### 2.4 不做

- 不做基于点击的热度统计(P2-09 之后的话题)
- 不做用户画像推荐
- 不做 H5 端 popularity 展示

### 2.5 验收

- [ ] `?limit=5` 生效,返回 5 条
- [ ] `?limit=100` 强制截断到 20
- [ ] `?limit=abc` 使用默认值 8
- [ ] 单分类返回不超过 `MAX_PER_CATEGORY = 3` 条
- [ ] 知识条目有 `priority` 字段时按其排序
- [ ] 响应包含 `popularity` 字段(可为 null)
- [ ] 老调用方不消费新字段时不受影响

## 3. 子任务 B:P2-11B Admin 日志页增强

### 3.1 范围

- `smartdine-admin/src/views/QaEvents.vue`
- `smartdine-admin/src/api/qaEvents.js`
- 相关组件(如新增日期范围选择器)

### 3.2 改动点

#### 3.2.1 日期范围控件

- 默认展示当天(由 API 端 `date` 参数控制)
- 提供"昨天 / 最近 3 天 / 自定义"快捷入口
- **跨天查询**:Admin 端在前端循环调用 API 拉取每天数据后合并展示;**不在 API 端做跨天聚合**(包 2 已确定单日读取)
- 跨天数据量上限:最多 7 天(防止误操作拉一年)
- 提示用户"跨天查询数据量较大,建议筛选 confidence"

#### 3.2.2 confidence 多选筛选

- 4 类(`high` / `low` / `ambiguous` / `unknown_entity`)改为 checkbox 多选
- 全部不勾选时等价于全选(返回所有)
- 勾选项以逗号分隔传给 API `confidence` 参数

#### 3.2.3 真分页

- 当前页码 + 总页码 + 上一页 / 下一页
- 每页大小切换(20 / 50 / 100,沿用包 2 的 limit 上限 100)
- 切换日期或筛选时重置到第 1 页

### 3.3 不做

- 不做导出 CSV / Excel
- 不做实时刷新 / WebSocket
- 不做图表统计(留 P3)
- 不修改 API 字段契约(包 2 已定 `date` 参数,本包消费即可)

### 3.4 验收

- [ ] 默认展示当天数据
- [ ] 切换到"最近 3 天"时,前端循环调 3 次 API 后合并展示
- [ ] confidence 4 类多选生效
- [ ] 分页可用,可切换页大小
- [ ] 切换日期 / 筛选条件时重置到第 1 页
- [ ] Admin build 通过(已知 chunk warning 可保留)

## 4. 范围合规检查

- [ ] 未修改 KB
- [ ] 未修改 `.env*`
- [ ] 未引入新依赖(日期选择器使用现有组件库,如已有)
- [ ] API 字段契约不变(本包不动 API 字段,只消费包 2 已定的 `date`)

## 5. 输出报告

`SmartDine_V1.1_P2_第二轮_包3_执行报告.md`

## 6. 建议提交信息

```text
feat(api): complete suggestion fields (limit, popularity, priority sort)
feat(admin): enhance qa events page with date range and multi-select filters
```

---

# 包 4:P2-05 Admin 真实认证

> **执行模型:Codex 5.5**(核心契约变更 / API + Admin 联调 / 安全敏感逻辑)
> **性质**:跨端联调 / 安全实现
> **预计工作量**:1.5-2 天
> **前置依赖**:包 3 已完成验收
> **关键约束**:本包是 P2 第二轮**唯一动认证基础设施**的包,做完后所有受保护接口走正式 JWT 鉴权

## 1. 任务目标

把 Admin 从临时硬编码登录(`admin/admin123` + localStorage)升级为最小真实认证:

```
环境变量 + bcrypt + JWT + httpOnly cookie + 统一 401 拦截
```

## 2. 拍定方案(不再保留多选)

| 维度 | 选定方案 |
|---|---|
| 账号密码来源 | 服务端读取 `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`(bcrypt) |
| Token 类型 | JWT,`ADMIN_JWT_SECRET` 签发,有效期 24 小时 |
| Token 存储 | **httpOnly cookie**(SameSite=Lax,Secure 在 prod 启用) |
| 前端请求方式 | `credentials: 'include'`(fetch)/ `withCredentials: true`(若有 axios) |
| 鉴权拦截 | 后端统一中间件,401 标准化返回 |
| 前端 401 处理 | 全局响应拦截,自动跳登录页 |
| 登出 | API 清空 cookie,前端跳登录页 |

**禁用方案**(列出仅供 review 时核对):

- localStorage 存 JWT(✗ 安全风险)
- sessionStorage 存 JWT(✗ 不如 httpOnly cookie)
- 无 token 仅环境变量(✗ 等于硬编码搬家)
- refresh token(✗ 超出 P2 范围)

## 3. 范围

### 3.1 后端(`smartdine-api`)

- 新增 `/api/admin/login` 端点
- 新增 `/api/admin/logout` 端点
- 新增 JWT 校验中间件(`smartdine-api/src/middleware/jwtAuth.ts` 或同等位置)
- 替换现有受保护路由的临时拦截器为新的 JWT 中间件
- `/health` 保持不挂中间件
- 新增 bcrypt 密码哈希生成辅助脚本(`scripts/hash-admin-password.ts`,一次性使用)
- `.env.example` 更新

### 3.2 前端(`smartdine-admin`)

- 登录页对接新端点(POST `/api/admin/login`)
- 移除硬编码 `admin/admin123` 与"临时登录方案"提示
- HTTP 客户端统一带 `credentials: 'include'`
- 全局 401 响应拦截器,自动跳登录页
- 退出按钮调用 `/api/admin/logout`

### 3.3 受保护接口的拦截器替换

P2 第一轮临时复用 P1 拦截的端点必须切换到正式 JWT 拦截:

- `GET /api/admin/qa-events`(P2-11A)
- 所有 `/admin/faq*` 端点
- `/chat`(根据现有项目实际是否受保护决定)
- 包 3 引入的新 Admin 端点(若有)

## 4. 关键实现细节

### 4.1 依赖

允许新增以下依赖(本包**唯一允许动 `package.json`**的位置):

```
后端:
- bcrypt(^5.x)
- @types/bcrypt(devDependencies)
- jsonwebtoken(^9.x)
- @types/jsonwebtoken(devDependencies)
```

**禁止新增**:其他任何包。

### 4.2 环境变量(`.env.example` 更新,真实 `.env` 不动)

```text
# Admin authentication (P2-05)
ADMIN_USERNAME=admin
# bcrypt hash, generated by scripts/hash-admin-password.ts
ADMIN_PASSWORD_HASH=
# JWT secret, generate with: openssl rand -base64 32
ADMIN_JWT_SECRET=
# JWT expiration in seconds (default 86400 = 24h)
ADMIN_JWT_EXPIRES_IN=86400
```

**真实 `.env` 文件由用户手动维护**,Codex 不写入真实值。

### 4.3 cookie 配置

```ts
{
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/'
}
```

### 4.4 401 标准化响应

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### 4.5 P2-11A/B 拦截器无缝切换

P2-11A 引入的 `GET /api/admin/qa-events` 此前临时复用 P1 拦截。本包必须确保:

- 切换到 JWT 中间件后,Admin 问答日志页仍能正常访问
- 未登录访问该端点返回 401
- 401 后前端自动跳登录页

## 5. 不做

- 用户注册 / 找回密码 / 验证码
- 多账号 / 多角色
- OAuth / SSO
- refresh token
- 密码强度校验(单管理员账号由部署人员维护)
- 登录失败次数限制(P3 再考虑)
- 多设备登录管理

## 6. Secret 管理约定

(继承 P2 详细任务清单 Secret 管理约定)

- `.env.*` 不进 git(已在 `.gitignore`)
- `.env.example` 只放变量名,不放真实值
- `ADMIN_JWT_SECRET` 用 `openssl rand -base64 32` 生成
- `ADMIN_PASSWORD_HASH` 用 `scripts/hash-admin-password.ts` 生成,bcrypt cost ≥ 10
- 不同环境 secret 不复用
- 建议 90 天轮换一次,或事件触发(部署人员变更 / 怀疑泄露 / `.env` 误提交)

## 7. 应急流程(写入文档)

- `ADMIN_JWT_SECRET` 泄露 → 立即替换 + 重启,所有 token 自动失效
- `.env` 误提交 → 立即轮换 secret,**再处理 git 历史**(不能只删 commit 不换 secret)

## 8. 验收

### 8.1 功能验收

- [ ] `/api/admin/login` 接收用户名密码,bcrypt 校验通过后签发 JWT 写入 httpOnly cookie
- [ ] `/api/admin/logout` 清空 cookie
- [ ] 未登录访问受保护接口返回 401
- [ ] 登录后可正常访问所有受保护接口
- [ ] JWT 过期后访问返回 401,前端跳登录页
- [ ] 退出后访问受保护接口返回 401
- [ ] `/health` 不受影响
- [ ] H5 问答链路不受影响
- [ ] Admin "问答日志"页面切换到 JWT 后仍能正常访问
- [ ] 包 3 的新 Admin 端点(若有)同样受 JWT 保护

### 8.2 安全验收

- [ ] cookie 标记为 `httpOnly`(浏览器 devtools 确认)
- [ ] cookie 标记为 `SameSite=Lax`
- [ ] localStorage / sessionStorage 中无任何 JWT 或密码相关内容
- [ ] 密码以 bcrypt 哈希存储(`.env.example` 字段名为 `ADMIN_PASSWORD_HASH`)
- [ ] 代码中无硬编码 `admin/admin123`
- [ ] UI 中无"临时登录方案"提示
- [ ] 401 响应不泄露用户是否存在(用户名错误与密码错误返回相同 message)

### 8.3 兼容性验收

- [ ] P2-11A `GET /api/admin/qa-events` 切换到 JWT 后,Admin 问答日志页正常工作
- [ ] 现有所有 Admin 功能回归通过
- [ ] H5 端不受影响

### 8.4 文档验收

- [ ] `.env.example` 已更新,包含 4 个新变量及说明
- [ ] `scripts/hash-admin-password.ts` 已创建
- [ ] Secret 管理约定已写入项目文档(可在 README 或单独 doc)

## 9. 风险点

- 跨端联调易漏一两个受保护接口未切换 → 必须列出所有受保护接口逐一验证
- httpOnly cookie + CORS 在 dev 环境可能需要额外配置(`origin` + `credentials: true`)
- bcrypt 在 Windows 上可能需要 `node-gyp`,如出问题可考虑 `bcryptjs`(纯 JS 实现)作为备选,但**先尝试 bcrypt**,失败再切
- JWT secret 在 dev 环境若使用默认值容易遗忘到 prod,**`.env.example` 中字段值留空,启动时校验为空则启动失败并提示**

## 10. 输出报告

`SmartDine_V1.1_P2_第二轮_包4_执行报告.md`,必须包含:

- 受保护接口完整清单 + 每个接口的 JWT 拦截验证结果
- bcrypt + JWT 实现摘要
- cookie 配置截图(devtools)
- 401 流程端到端验证
- P2-11A 切换前后的对比
- Secret 管理约定文档位置

## 11. 建议提交信息

```text
feat(api): add admin authentication with bcrypt and jwt
feat(admin): replace temporary login with httponly cookie session
chore(env): add admin auth environment variable templates
docs(p2): add admin authentication and secret management guide
```

(也可合并为一条:`feat(p2): minimal admin authentication with bcrypt + jwt + httponly cookie`)

---

# 包 5:P2-07 AI 配置后台化最小落地

> **执行模型:Codex 5.5**(依赖 P2-05 / 配置后台化 / 审计日志)
> **性质**:依赖包 4 完成 / 后端配置接口 + Admin 配置页 + 配置变更审计
> **预计工作量**:1.5-2 天
> **前置依赖**:包 4 必须完成 + P2-06 方案文档已确认

## 1. 任务目标

依据 P2-06 方案,落地 AI 配置后台化最小可用版本。**严格收紧范围**到 4 类配置,API Key 不进后台。

## 2. 范围(严格收紧)

### 2.1 仅开放后台编辑的 4 类配置

1. **系统提示词**(System Prompt)
2. **兜底话术**(对应 P2-03 三种 confidence 策略的提示文案)
3. **模型名**(model name,如 `gpt-4o-mini`、`claude-haiku-4-5` 等)
4. **温度参数**(temperature,0.0–1.0,UI 限制范围)

### 2.2 明确不开放(继续走 `.env`)

- API Key
- Base URL
- Provider 切换
- 复杂 Prompt 模板管理
- 多模型路由
- 多租户配置
- 最大输出长度(P2-06 方案中可后台化的字段,本期收紧不开放)
- 是否优先知识库回答(本期收紧不开放,默认 true)

### 2.3 Admin 显示但不可编辑

- API Key:仅展示"已配置 / 未配置"
- Base URL:仅展示当前值(只读)
- Provider:仅展示当前值(只读)

## 3. 后端实现

### 3.1 配置存储

- 文件路径:`smartdine-api/data/ai-config.json`
- 不进 git(`.gitignore` 加规则)
- 启动时加载到内存,缓存为模块级变量
- 文件不存在 → 使用代码内默认值,不报错
- 文件损坏 → 回退默认值,记录 error 日志

### 3.2 默认配置

```json
{
  "systemPrompt": "你是 SmartDine 的智能助手...(默认值)",
  "fallbackMessages": {
    "low": "我不太确定你问的是不是「{topic}」。你可以换一种问法,或者点击下面的推荐问题。",
    "ambiguous": "你可能想问:",
    "unknown_entity": "目前知识库中没有找到「{tokens}」的相关说明。"
  },
  "modelName": "gpt-4o-mini",
  "temperature": 0.7
}
```

### 3.3 接口

| 端点 | 方法 | 描述 |
|---|---|---|
| `/api/admin/ai-config` | GET | 读取当前配置(API Key 等敏感字段不返回) |
| `/api/admin/ai-config` | PUT | 更新配置,触发缓存重载 |
| `/api/admin/ai-config/reset` | POST | 恢复默认值 |

所有端点**必须走包 4 的 JWT 中间件**。

### 3.4 配置生效策略

- **更新即生效**:PUT 成功后,新配置立即用于下次 `/chat` 调用
- 无需重启
- 并发场景按"最后写入胜出"

### 3.5 配置变更审计

- 每次 PUT / reset 写入 `logs/admin-events-YYYY-MM-DD.jsonl`
- **不写入 `qa-events-*.jsonl`**(两类日志独立)
- 字段:

  ```json
  {
    "requestId": "...",
    "timestamp": "2026-04-26T...",
    "actor": "admin",
    "action": "ai-config.update" | "ai-config.reset",
    "diff": { "modelName": { "from": "...", "to": "..." } },
    "duration": 数字
  }
  ```

- 不记录敏感字段值(尽管本期没敏感字段进入,留口子)
- 写入失败不阻塞主链路

### 3.6 调用 AI 时使用配置

- `/chat` 调用 AI 前从内存读取最新配置
- 用于:`systemPrompt`、`modelName`、`temperature`、`fallbackMessages`(替代 P2-03 写死的默认话术)

## 4. Admin 前端

### 4.1 新增"AI 配置"页面

- 路由:`/ai-config`
- 主导航位置:在"问答日志"之后
- 受 JWT 保护(包 4 中间件)

### 4.2 页面结构

**只读区**(灰底,展示):

- API Key 状态:已配置 / 未配置
- Base URL:`<value>`(只读)
- Provider:`<value>`(只读)

**可编辑区**:

- 系统提示词:`<textarea>`,字符上限 4000
- 兜底话术 - low:`<textarea>`,上限 500
- 兜底话术 - ambiguous:`<input>`,上限 200
- 兜底话术 - unknown_entity:`<textarea>`,上限 500
- 模型名:`<input>`(纯字符串,不做下拉枚举,避免引入新模型时硬编码)
- 温度:`<input type="range" min="0" max="1" step="0.1">`,显示当前值

**操作按钮**:

- 保存
- 恢复默认(确认对话框,二次确认)

**保存后提示**:

- "保存成功,新配置已对下次提问生效"

## 5. 不做

- API Key 编辑
- Provider 切换 UI
- Prompt 版本管理 / 历史回滚
- 多模型路由 / A/B 测试
- 配置导入导出
- 配置预览(不预先调 AI 测试)
- 用量统计

## 6. 验收

### 6.1 后端

- [ ] `data/ai-config.json` 不进 git
- [ ] 启动加载默认值,无报错
- [ ] PUT 更新配置后,文件被写入
- [ ] 文件损坏(手动改坏 JSON)启动时使用默认值,不崩溃
- [ ] `/chat` 使用最新配置调用 AI(可通过修改 systemPrompt 验证)
- [ ] 三个端点全部走 JWT 中间件,未登录返回 401
- [ ] 配置变更写入 `logs/admin-events-YYYY-MM-DD.jsonl`
- [ ] qa-events 日志不被污染

### 6.2 前端

- [ ] AI 配置页可访问(登录后)
- [ ] 未登录访问跳转登录页
- [ ] 可编辑字段保存生效
- [ ] 只读字段不可编辑
- [ ] 温度滑块限制 0–1
- [ ] 字符上限校验
- [ ] 恢复默认有二次确认
- [ ] 保存后提示生效

### 6.3 安全

- [ ] API Key 不在前端任何接口响应中
- [ ] API Key 不在 `data/ai-config.json` 中(继续走 `.env`)
- [ ] Base URL / Provider 在前端只读

### 6.4 联动

- [ ] 修改"兜底话术 - unknown_entity"后,触发 unknown_entity 的提问能看到新话术
- [ ] 修改"系统提示词"后,AI 回答风格随之变化(可通过简单提问验证)
- [ ] admin-events 日志的 diff 字段正确反映变更

## 7. 风险点

- 配置热更新若实现为"每次请求都读文件",I/O 开销大;**必须使用模块级缓存 + PUT 触发重载**
- 默认值与文件值合并时,缺字段应使用默认值,不应让"用户配置缺一项"导致 AI 调用崩溃
- 兜底话术中的占位符(`{topic}`、`{tokens}`)若用户删除会导致渲染异常,**保存时校验关键占位符存在**
- 温度参数若超出 0–1 范围会被 AI provider 拒绝,**前后端双重校验**

## 8. 输出报告

`SmartDine_V1.1_P2_第二轮_包5_执行报告.md`,包含:

- 配置文件 schema
- 默认值清单
- 三个端点的 JWT 拦截验证
- 一次完整变更链路:前端编辑 → PUT → 文件写入 → 缓存重载 → /chat 使用新值 → admin-events 日志记录
- 与 P2-11 qa-events 的隔离验证(两类日志互不影响)

## 9. 建议提交信息

```text
feat(api): add ai configuration management with audit log
feat(admin): add ai config page with bounded editable fields
chore(git): exclude ai-config.json from tracking
docs(p2): record ai config minimal landing scope
```

---

# 包间依赖与节奏总图

```text
包 1(5.4,只读 / 清理)
   ↓ 验收 + 交叉校验 + commit
包 2(5.4,H5 confidence + 单日读取)
   ↓ 验收 + 交叉校验 + commit
包 3(5.4,P2-02 字段 + Admin 日志页增强)
   ↓ 验收 + 交叉校验 + commit
包 4(5.5,P2-05 认证)             ← 本轮最大改动,必须 5.5
   ↓ 验收 + 交叉校验 + commit
包 5(5.5,P2-07 AI 配置)          ← 依赖包 4,必须 5.5
   ↓ 验收 + 交叉校验 + commit + 第二轮总验收
```

# 第二轮总验收(所有 5 包完成后)

由 ChatGPT 5.5 起草、Claude Code 交叉校验,产出:

- `SmartDine_V1.1_P2_第二轮验收报告.md`
- `SmartDine_V1.1_P2_第二轮交叉校验报告.md`

总验收应回答:

1. 5 包全部通过?
2. 交叉校验有无新增"算法蒙混""字段不对齐"类问题?
3. P2-03 / P2-11A 第一轮收尾补丁的承诺是否仍然成立?
4. 是否进入 P2 第三轮?第三轮范围(候选:low 阈值真实样本回归 / P2-08 / P2-09)
5. P3 启动条件评估
