# SmartDine Git 提交规范

## 1. 目标

本规范用于约束 SmartDine 项目的 Git 提交、分支使用和 AI 协作提交方式。

当前项目处于联调、调试、快速迭代阶段，规范目标不是增加流程负担，而是确保：

- 提交历史清晰可读
- 每次改动边界明确
- 方便自己回溯问题
- 方便 AI 按统一规则提交代码和管理变更
- 保持单仓库多端协作的可维护性

---

## 2. 仓库策略

当前 SmartDine 采用 **单仓库管理**：

```text
smartdine/
├─ smartdine-admin
├─ smartdine-api
├─ smartdine-h5
├─ smartdine-word
├─ AGENTS.md
├─ README.md
└─ GIT_RULES.md
```

说明：

- `smartdine-admin`：后台管理端
- `smartdine-api`：后端接口服务
- `smartdine-h5`：H5/用户端
- `smartdine-word`：规划、阶段文档、归档文档
- 根目录文件：项目总说明、AI 协作规范、Git 规范等

当前阶段不拆分多仓库，统一在主仓库内管理。

---

## 3. 分支规则

### 3.1 默认分支

项目默认主分支为：

```text
main
```

要求：

- `main` 用于保存当前主线代码
- `main` 上的提交必须可读、可追踪
- 不再使用 `master` 作为长期主分支

### 3.2 当前阶段的分支策略

联调阶段采用轻量策略：

- 小改动、低风险改动：允许直接在 `main` 提交
- 中大型任务、高风险任务：新建 `feature/*` 分支

### 3.3 feature 分支命名规范

格式：

```text
feature/<scope>-<task>
```

示例：

```text
feature/api-log-store
feature/h5-chat-page
feature/admin-faq-crud
feature/multi-chat-link
```

要求：

- 分支名要能看出改动范围
- 不使用无意义名称，如 `test`、`new`、`temp`、`fix1`

---

## 4. Commit Message 规范

### 4.1 基本格式

统一使用：

```text
<type>(<scope>): <summary>
```

示例：

```text
feat(api): 新增 FAQ 日志记录能力
fix(h5): 修复聊天页滚动定位异常
docs(word): 更新 Phase 3 完成归档
chore(root): 调整仓库 README 说明
```

---

## 5. type 取值规范

### 5.1 允许使用的 type

```text
feat
fix
refactor
docs
chore
test
merge
style
build
```

### 5.2 type 含义说明

#### feat
新增功能

示例：

```text
feat(api): 新增 missed question 落库能力
feat(admin): 新增 FAQ 搜索功能
```

#### fix
修复 Bug / 修复错误逻辑

示例：

```text
fix(api): 修复 /chat 未命中 FAQ 时返回异常
fix(h5): 修复消息列表首屏滚动异常
```

#### refactor
重构，逻辑优化，代码结构调整，但不改变核心功能语义

示例：

```text
refactor(api): 拆分 retrieve 与 answer 生成逻辑
```

#### docs
文档修改

示例：

```text
docs(word): 更新 V1.1 规划文档
docs(root): 补充项目启动说明
```

#### chore
配置、脚手架、非业务杂项改动

示例：

```text
chore(root): 初始化仓库基础配置
chore(workspace): 调整本地开发脚本
```

#### test
测试相关改动

示例：

```text
test(api): 补充 /chat 接口联调脚本
```

#### merge
分支合并相关提交

示例：

```text
merge(root): 合并 feature/api-log-store 到 main
```

#### style
只涉及样式、格式、UI 微调，不改业务逻辑

示例：

```text
style(h5): 调整聊天页欢迎区间距
```

#### build
构建、打包、工程配置变化

示例：

```text
build(api): 调整生产环境启动脚本
```

---

## 6. scope 取值规范

### 6.1 固定 scope

```text
root
api
admin
h5
word
workspace
multi
```

### 6.2 scope 含义

#### root
根目录级别改动

适用：

- README
- AGENTS.md
- GIT_RULES.md
- 根目录脚本
- 仓库层面说明文件

#### api
后端接口服务改动

目录：

```text
smartdine-api
```

#### admin
后台管理端改动

目录：

```text
smartdine-admin
```

#### h5
H5/用户端改动

目录：

```text
smartdine-h5
```

#### word
文档目录改动

目录：

```text
smartdine-word
```

#### workspace
工作区、工程、编辑器、脚本配置相关改动

#### multi
跨多个端的联动改动

适用场景：

- 同时修改 api 和 h5
- 同时修改 api 和 admin
- 同时调整三端联调配置

示例：

```text
fix(multi): 对齐 FAQ 字段并打通三端联调
```

---

## 7. summary 编写要求

`summary` 必须简洁、具体、可理解。

要求：

- 直接描述“做了什么”
- 必要时指出改动目的
- 避免空泛表述

### 正确示例

```text
fix(api): 修复 /chat 空问题时返回 500 的问题
feat(admin): 新增 FAQ 列表关键字搜索
refactor(h5): 提取聊天消息渲染逻辑
```

### 错误示例

```text
fix(api): 修复问题
feat(h5): 优化一下
chore(root): 更新代码
```

禁止使用以下模糊提交信息：

```text
update code
fix bug
修改
完成开发
继续优化
调整一下
处理问题
```

---

## 8. 提交边界规则

### 8.1 一次提交只做一类事情

一次 commit 应尽量只包含一类改动。

正确做法：

- 修一个 API 问题，单独一个 commit
- 改一个 H5 页面问题，单独一个 commit
- 更新一份文档，单独一个 commit

错误做法：

- 一个 commit 同时包含 API 修复 + H5 页面调整 + 文档更新
- 一个 commit 混入大量不相关改动

### 8.2 不要把“顺手改动”混进来

如果本次任务是修复 `api` 问题，就不要把不相关的 `README` 或样式微调混进同一个 commit。

### 8.3 大改动允许拆分多个 commit

如果一个任务较大，允许分步提交，例如：

```text
feat(api): 新增日志类型定义与空数据文件
feat(api): 新增 logStore 数据访问层
fix(api): 修复日志落库字段映射问题
```

这样比一个大而杂的 commit 更容易回溯。

---

## 9. AI 协作提交规则

本项目允许使用 ChatGPT / Claude / Codex 等 AI 协助开发，但 Git 提交必须遵循以下规则。

### 9.1 AI 提交前必须先总结变更

在执行 commit 前，AI 必须先输出：

```text
1. 修改了哪些文件
2. 每个文件改了什么
3. 本次改动目的是什么
4. 是否影响其他端
5. 建议的 commit message 是什么
```

开发者确认后，再执行提交。

### 9.2 AI 不得生成模糊 commit message

禁止 AI 使用以下提交信息：

```text
update code
fix bug
完成修改
优化
处理一下
调整代码
```

### 9.3 AI 应主动收敛提交范围

如果 AI 一次修改涉及多个方向，应主动建议拆分 commit，而不是全部混在一起提交。

### 9.4 AI 对多端联动改动要明确说明影响范围

例如：

```text
本次改动同时影响 smartdine-api 和 smartdine-h5，建议使用 scope=multi
```

### 9.5 AI 对分支操作要谨慎

若涉及分支创建、合并、删除，AI 必须先说明将执行的 Git 操作，再等待确认。

---

## 10. 推荐提交示例

### API 相关

```text
feat(api): 新增 FAQ 问题日志记录能力
fix(api): 修复 /chat 未命中 FAQ 时的兜底响应
refactor(api): 拆分知识匹配与答案生成逻辑
test(api): 补充聊天接口联调用例
```

### Admin 相关

```text
feat(admin): 新增 FAQ 列表搜索能力
fix(admin): 修复 FAQ 编辑弹窗数据回填异常
style(admin): 调整 FAQ 表格操作列宽度
```

### H5 相关

```text
feat(h5): 新增聊天页欢迎区和快捷问题入口
fix(h5): 修复消息列表滚动到底部异常
refactor(h5): 提取消息渲染组件
```

### 文档相关

```text
docs(word): 更新 SmartDine V1.1 规划文档
docs(word): 补充 Phase 4 生产化准备清单
docs(root): 更新根目录项目说明
```

### 多端联动

```text
fix(multi): 对齐 FAQ 字段并打通三端联调
feat(multi): 新增聊天链路最小闭环能力
```

### 仓库根目录

```text
chore(root): 初始化 SmartDine 仓库基础文件
merge(root): 合并 feature/api-log-store 到 main
```

---

## 11. 提交流程建议

### 小改动提交流程

```text
修改代码
→ 检查改动范围
→ git status
→ git add 指定文件
→ 编写规范 commit message
→ git commit
→ git push
```

### AI 协作提交流程

```text
AI 修改代码
→ AI 输出变更总结
→ 人确认范围和 commit message
→ git add
→ git commit
→ git push
```

### 中大型任务提交流程

```text
创建 feature 分支
→ AI/人工逐步修改
→ 分阶段 commit
→ 自测/联调通过
→ 合并回 main
```

---

## 12. git add 使用建议

为避免把无关改动一起提交，建议优先使用：

```bash
git add <file>
git add <dir>
```

谨慎使用：

```bash
git add .
```

适用原则：

- 改动范围明确时，用指定文件/目录 add
- 确认整个工作区本次都需要提交时，才使用 `git add .`

---

## 13. 联调阶段的补充说明

当前 SmartDine 处于联调和调试阶段，仓库中允许存在：

- 本地调试辅助文件
- 联调脚本
- 测试产物目录
- 临时阶段性配置

此阶段不以“仓库绝对洁癖”为目标，优先保障：

- 联调效率
- 问题定位效率
- 变更可追踪

但即使在联调阶段，也必须保持提交信息清晰，避免提交历史失控。

---

## 14. 未来可升级项

后续若项目进入多人协作或生产化阶段，可再升级：

- 增加 `dev` 分支
- 增加 PR / Review 规则
- 增加 Tag / Release 规范
- 增加自动化校验（commitlint / husky）
- 增加分端 README 与发布说明

当前阶段先执行最小规范，不追求过度复杂流程。

---

## 15. 最终执行原则

本项目 Git 管理遵循以下原则：

1. 提交历史要能看懂
2. 提交边界要尽量清晰
3. 提交说明要具体，不模糊
4. AI 提交前必须先总结变更
5. 大任务拆分，小任务收敛
6. 当前阶段优先服务联调效率

---

## 16. 一句话版本

> SmartDine 当前采用单仓库、轻分支、强提交说明的 Git 策略；AI 可以协助开发，但每次提交都必须先明确改动范围，再使用规范的 commit message 进行提交。
