# SmartDine Git 规范补充 — Claude Code 专项

> 本文件是 GIT_RULES.md 的补充，仅约束 Claude Code 工具产生的 worktree、分支
> 和提交行为。与 GIT_RULES.md 冲突时，以 GIT_RULES.md 为准。

---

## 1. Worktree 分支命名规范

Claude Code 自动创建的 worktree 分支格式为：

```text
claude/<random-adjective-name>
```

示例：`claude/serene-booth-8d8b37`、`claude/confident-liskov-290f33`

### 使用原则

| 场景 | 处理方式 |
|------|---------|
| 诊断、探索、阅读代码 | 保留随机名，任务结束后删除 worktree |
| 单执行包开发（P1 包 A / B / C） | 推荐手动重命名为 `claude/<scope>-<task>`，例：`claude/api-rerank` |
| 跨包联动修改 | 使用 `claude/multi-<task>`，例：`claude/multi-p1a-collect` |

### worktree 清理规则

- 执行包完成并合并回 main 后，删除对应 worktree：
  ```bash
  git worktree remove .claude/worktrees/<name>
  git branch -d claude/<name>
  ```
- 不得让已合并的 `claude/*` 分支长期残留在仓库

---

## 2. Claude Code 的 Git 命令权限分级

### 始终自动允许（Always Allow）

只读或低风险操作，无需每次确认：

```text
git status / git status --short
git diff / git diff HEAD
git log / git log --oneline
git show
git branch（仅查看）
git worktree list
git stash list
```

### 输出变更摘要后自动执行

Claude 必须先在对话中输出变更说明（修改了哪些文件、目的是什么），
再自动执行以下操作，无需人工点击确认：

```text
git add <specific-file>       ← 指定文件，不用 git add .
git restore <specific-file>   ← 丢弃特定文件改动
git commit                    ← 整包验收通过后
```

> 保障：AGENTS.md §9 要求 AI 提交前必须先输出变更总结，此流程已足够可追溯，
> 无需额外的人工点击节点。

### 始终需要人工确认后才执行

```text
git push
git reset --hard
git checkout -- .          ← 丢弃全部改动
git branch -D              ← 强制删除分支
git worktree remove        ← 删除 worktree
```

---

## 3. CLAUDE.md 变更的提交规范

### 何时提交

- CLAUDE.md 新建时：单独一个 commit，不与代码变更混合
- CLAUDE.md 内容更新时（进度状态更新、新约定补充）：单独一个 commit

### commit message 格式

```text
docs(root): <具体改动内容>
```

### 示例

```text
docs(root): 新增 CLAUDE.md 作为 Claude Code 项目启动快速参考
docs(root): 更新 CLAUDE.md 进度状态（P0 完成 → P1 进行中）
docs(root): 补充 CLAUDE.md 中的 P1 执行包范围说明
```

### 禁止

- 不得将 CLAUDE.md 与业务代码改动混在同一个 commit
- 进度字段的小修改应合并进对应执行包的最终 commit 或单独作为一个收口 commit，不得孤立成无意义的单行改动 commit

---

## 4. 运行时数据文件的处理规则

以下文件是运行期生成的数据，在联调和 AI 测试过程中会被自动写入：

```text
smartdine-api/src/data/questionLogs.json
smartdine-api/src/data/missedQuestions.json
```

### 已通过 `.gitignore` 忽略

1. 这两个文件已在仓库根目录 `.gitignore` 中声明为运行时数据文件
2. P1 执行包 A 收口时通过 `git rm --cached` 将其移出 git tracking，后续联调写入不再产生持续脏改动
3. 提交前仍需执行 `git status --short`，确认没有把其他运行期产物带入本次提交

> 禁止手工修改这两个文件制造样本；只能通过真实 `/chat` 接口调用产生日志。

### 构建与测试产物

以下目录和文件同样不进入 git：

```text
dist/
test-results/
playwright-report/
coverage/
logs/
**/.last-run.json
```

构建或测试后必须执行 `git status --short`。如果出现真实日志、测试缓存或构建产物脏改动，应先处理 tracking / ignore 规则，不得混入业务提交。

---

## 5. 运行环境与端口说明

| 环境 | 命令 | API | Admin | H5 | 适用场景 |
|------|------|----:|------:|---:|---------|
| 开发环境 | `dev` | 3000 | 5174 | 5173 | 日常人工调试 |
| AI 测试环境 | `dev:ai` | 3300 | 5274 | 5273 | Codex / 其他 AI 自动测试与验收 |
| Claude Code 环境 | `dev:cc` | 3301 | 5275 | 5276 | Claude Code 专用 |

三套环境端口完全隔离，可同时运行不冲突。提交前执行 `git status --short` 时，验收命令中的端口口径必须与当前实际运行环境一致。

---

## 6. Create PR 的触发条件

### 定位

SmartDine 当前为单人开发，PR 不用于 Code Review，用途为：

- **留存完整改动记录**（diff 明确可查）
- **作为执行包完成的里程碑节点**（PR 标题 = 执行包名称）

### 何时 Claude 主动建议创建 PR

满足以下任一条件时，Claude 在执行包收口时提示是否需要 PR：

| 条件 | 说明 |
|------|------|
| 修改文件 ≥5 个 | 改动范围较大 |
| 跨三端联动（multi scope） | 影响面广 |
| 本次在 `claude/*` 分支上完成执行包开发 | 整包完成后必须 PR 合并回 main |
| 接口契约变更 | `/chat` 等核心接口任何变更，必须 PR |

### 何时不需要 PR

- 仅修改文档（`docs(root)` / `docs(word)`）且直接在 main 上操作
- 仅更新 `.env.example`、README 等非代码文件
- 单文件小 fix 且确认不影响其他端

### PR 描述模板

Claude 创建 PR 时，body 必须包含：

```text
## 本次改动
- 执行包 / 任务名称：
- 修改文件清单：

## 验证结果
- 直接验证项：
- 链路侧面确认项：
- 本轮未覆盖项：

## 遗留问题
- 已知未修复：
- 建议下一步：
```
