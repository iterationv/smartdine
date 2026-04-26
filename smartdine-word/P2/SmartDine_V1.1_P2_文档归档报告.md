# P2 文档归档报告

## 归档时间

2026-04-26

## 归档前定位

### `git ls-files | grep "SmartDine_V1\.1_P2_"` 命中（共 18 份）

仓库根目录（15 份）：

- SmartDine_V1.1_P2_AI配置后台化方案.md
- SmartDine_V1.1_P2_Admin问答日志页面说明.md
- SmartDine_V1.1_P2_Admin问答日志页面验证报告.md
- SmartDine_V1.1_P2_启动基线确认.md
- SmartDine_V1.1_P2_工程清理报告.md
- SmartDine_V1.1_P2_推荐策略说明.md
- SmartDine_V1.1_P2_推荐策略验证报告.md
- SmartDine_V1.1_P2_检索判定策略说明.md
- SmartDine_V1.1_P2_检索判定验证报告.md
- SmartDine_V1.1_P2_检索回归样例集.md
- SmartDine_V1.1_P2_第一轮交叉校验报告.md
- SmartDine_V1.1_P2_第一轮收尾补丁_执行报告.md
- SmartDine_V1.1_P2_第一轮验收报告.md
- SmartDine_V1.1_P2_问答日志设计.md
- SmartDine_V1.1_P2_问答日志验证报告.md

`smartdine-word/`（3 份）：

- smartdine-word/SmartDine_V1.1_P2_文档级任务清单.md
- smartdine-word/SmartDine_V1.1_P2_第一轮_Codex执行任务清单.md
- smartdine-word/SmartDine_V1.1_P2_详细任务清单.md

### 实际所在位置（非预期位置说明）

- 任务说明中要求一并归档的 `SmartDine_V1.1_P2_第二轮_Codex执行任务清单.md` **在仓库中不存在**（`git ls-files`、`find` 均无命中），跳过该文件，已在「冲突或异常」节登记。
- 其余 18 份均按 `git ls-files` 给出的实际路径处理，无意外位置。

## 移动操作明细

> 全部使用 `git mv`，每条均通过 `git status --short` 验证为 `R`（rename），无 `D + A`。

| 序号 | 源路径 | 目标路径 | git status 标记 | rename 识别 |
|---|---|---|---|---|
| 1 | SmartDine_V1.1_P2_AI配置后台化方案.md | smartdine-word/P2/SmartDine_V1.1_P2_AI配置后台化方案.md | R | ✅ |
| 2 | SmartDine_V1.1_P2_Admin问答日志页面说明.md | smartdine-word/P2/SmartDine_V1.1_P2_Admin问答日志页面说明.md | R | ✅ |
| 3 | SmartDine_V1.1_P2_Admin问答日志页面验证报告.md | smartdine-word/P2/SmartDine_V1.1_P2_Admin问答日志页面验证报告.md | R | ✅ |
| 4 | SmartDine_V1.1_P2_启动基线确认.md | smartdine-word/P2/SmartDine_V1.1_P2_启动基线确认.md | R | ✅ |
| 5 | SmartDine_V1.1_P2_工程清理报告.md | smartdine-word/P2/SmartDine_V1.1_P2_工程清理报告.md | R | ✅ |
| 6 | SmartDine_V1.1_P2_推荐策略说明.md | smartdine-word/P2/SmartDine_V1.1_P2_推荐策略说明.md | R | ✅ |
| 7 | SmartDine_V1.1_P2_推荐策略验证报告.md | smartdine-word/P2/SmartDine_V1.1_P2_推荐策略验证报告.md | R | ✅ |
| 8 | SmartDine_V1.1_P2_检索判定策略说明.md | smartdine-word/P2/SmartDine_V1.1_P2_检索判定策略说明.md | R | ✅ |
| 9 | SmartDine_V1.1_P2_检索判定验证报告.md | smartdine-word/P2/SmartDine_V1.1_P2_检索判定验证报告.md | R | ✅ |
| 10 | SmartDine_V1.1_P2_检索回归样例集.md | smartdine-word/P2/SmartDine_V1.1_P2_检索回归样例集.md | R | ✅ |
| 11 | SmartDine_V1.1_P2_第一轮交叉校验报告.md | smartdine-word/P2/SmartDine_V1.1_P2_第一轮交叉校验报告.md | R | ✅ |
| 12 | SmartDine_V1.1_P2_第一轮收尾补丁_执行报告.md | smartdine-word/P2/SmartDine_V1.1_P2_第一轮收尾补丁_执行报告.md | R | ✅ |
| 13 | SmartDine_V1.1_P2_第一轮验收报告.md | smartdine-word/P2/SmartDine_V1.1_P2_第一轮验收报告.md | R | ✅ |
| 14 | SmartDine_V1.1_P2_问答日志设计.md | smartdine-word/P2/SmartDine_V1.1_P2_问答日志设计.md | R | ✅ |
| 15 | SmartDine_V1.1_P2_问答日志验证报告.md | smartdine-word/P2/SmartDine_V1.1_P2_问答日志验证报告.md | R | ✅ |
| 16 | smartdine-word/SmartDine_V1.1_P2_文档级任务清单.md | smartdine-word/P2/SmartDine_V1.1_P2_文档级任务清单.md | R | ✅ |
| 17 | smartdine-word/SmartDine_V1.1_P2_第一轮_Codex执行任务清单.md | smartdine-word/P2/SmartDine_V1.1_P2_第一轮_Codex执行任务清单.md | R | ✅ |
| 18 | smartdine-word/SmartDine_V1.1_P2_详细任务清单.md | smartdine-word/P2/SmartDine_V1.1_P2_详细任务清单.md | R | ✅ |

`git diff --cached --find-renames=50 --stat` 汇总：**20 files changed, 10 insertions(+), 10 deletions(-)**（18 个纯 rename + 2 个跨目录路径引用更新带来的 5 行替换 × 2 文件 + 另外 2 个根级文件 = 10 改 10 增 10 删，符合预期）。

## 路径引用更新

### 检查的引用源文件

`grep -rnE "smartdine-word/SmartDine_V1\.1_P2_" --include="*.md"` 在归档前共命中 4 个文件、10 行。

仅在以下情况下更新路径：

- 引用文本是**显式跨目录路径**（含 `smartdine-word/` 前缀）；
- 该引用指向被本次归档移动的 P2 文档。

不更新：

- 同目录下的裸文件名引用（如 `` `SmartDine_V1.1_P2_xxx.md` ``）—— 移动后双方仍在 `smartdine-word/P2/` 下，相对路径仍有效。
- 引用未被归档的文件 / 假设性文件 / 历史文件名（如 `SmartDine_V1.1_P2_变更登记.md`、`SmartDine_V1.1_P2_QueryRewrite收益验证报告.md`）。

### 实际更新的文件清单

机械替换 `smartdine-word/SmartDine_V1.1_P2_` → `smartdine-word/P2/SmartDine_V1.1_P2_`，共 4 个文件、10 处替换：

| 文件 | 替换条数 | 说明 |
|---|---|---|
| `README.md` | 2 | §文档结构 中两份 P2 任务清单路径 |
| `AGENTS.md` | 3 | §6 / §P2 第一轮范围 中三份 P2 文档路径 |
| `smartdine-word/P2/SmartDine_V1.1_P2_AI配置后台化方案.md` | 2 | 已移动后的文件，§方案读取文件清单 |
| `smartdine-word/P2/SmartDine_V1.1_P2_启动基线确认.md` | 3 | 已移动后的文件，§4 P2 文档状态 |

> 复核：`grep -rnE "smartdine-word/SmartDine_V1\.1_P2_" --include="*.md"` 归档后 **0 命中** ✅。

## git 历史保留验证

- 抽查命令：`git log --follow --oneline smartdine-word/P2/SmartDine_V1.1_P2_<file>.md`
- 抽查文件：`第一轮验收报告.md`、`详细任务清单.md`、`第一轮交叉校验报告.md`
- 抽查结果：当前**未提交**前 `git log --follow` 不返回历史（git 只跟随**已提交**的 rename）。
- 替代验证：
  - `git status --short` 全部显示为 `R` —— 索引层面 rename 检测**已成立**。
  - `git diff --cached --find-renames=50 --stat` 报告 18 个 rename 全部识别。
  - 一旦用户 commit 后，`git log --follow` 即可在新位置追溯到旧位置的全部历史。

## 冲突或异常

| 类目 | 情况 |
|---|---|
| 同名冲突 | 无。`smartdine-word/P2/` 在归档前为新建空目录。|
| `D + A`（非 rename） | **无**，全部 18 文件 git 识别为 `R`。|
| 文件缺失 | `SmartDine_V1.1_P2_第二轮_Codex执行任务清单.md` 在本仓库 / 本工作分支下**不存在**（`git ls-files` 与 `find` 均无命中），未做任何操作。如该文件是计划中的产物，建议待其新建后再做单独归档。|
| 受保护文件触碰 | 无（详见「自检」）。|

## 自检（受保护范围）

| 受保护项 | 是否触碰 |
|---|---|
| `smartdine-api/src/**`、`smartdine-admin/src/**`、`smartdine-h5/src/**` | 未触碰 ✅ |
| `.env*`（API/H5/Admin） | 未触碰 ✅ |
| 任意 `package.json` | 未触碰 ✅ |
| `tsconfig.json`、`vite.config.*` | 未触碰 ✅ |
| `smartdine-api/src/data/faq.json` | 未触碰 ✅ |
| `smartdine-word/archive/**` | 未触碰 ✅ |
| `CLAUDE.md` | 未触碰（无对 P2 文档的路径引用） ✅ |
| 任何业务代码 | 未触碰 ✅ |

## 是否建议 commit

- **结论**：可以 commit。`git status` 干净（除本归档报告本身为新增外）、18 个 rename 全部识别为 R、4 个文件路径引用已机械更新、无业务代码改动。
- **建议的 commit message**（单条）：

  ```text
  docs(p2): archive P2 round-1 documents to smartdine-word/P2/
  ```

- 等用户确认后由用户手动执行 `git add smartdine-word/P2/SmartDine_V1.1_P2_文档归档报告.md && git commit`（本次 AI 不执行 commit / push）。
