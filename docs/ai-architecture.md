# SmartDine AI 协作架构决策

> 本文件记录 SmartDine 项目 AI 协作文件架构的设计哲学与分层原则。
> 结构变更前必须先更新本文件,再调整 CLAUDE.md / AGENTS.md / Skill 文件。

---

## 1. 架构哲学

**工具入口分离 + 内容单向分层。**

- **工具入口分离**:每个 AI 工具读自己的入口文件,按官方约定,不互相强制加载。
- **内容单向分层**:静态事实 → 协作规则 → 专项流程,三层各司其职,禁止互相复述。

---

## 2. 三类文件的职责

| 文件 | 定位 | 内容特征 | 变更频率 |
|------|------|---------|---------|
| **CLAUDE.md** | Claude Code 入口 | 项目静态事实 + Claude 角色边界 | 低(三个月不动) |
| **AGENTS.md** | Codex 入口 | 协作动态规则 + Skill 索引 | 中(阶段切换时更新) |
| **docs/ai-skills/\*.md** | 专项流程手册 | 单一场景的完整执行步骤 | 按流程演进 |

---

## 3. 读取关系(单向条件读取)

```text
Claude Code 启动 ──→ CLAUDE.md (自动)
                      └── 涉及执行/审查/验收 ──→ AGENTS.md (按需)
                                                  └── 触发专项场景 ──→ Skill (按需)

Codex 启动 ───────→ AGENTS.md (自动)
                      └── 需要项目事实 ──→ CLAUDE.md (按需,只查不复述)
                      └── 触发专项场景 ──→ Skill (按需)
```

**单向**:Skill 不反向引用 AGENTS,AGENTS 不复述 CLAUDE。
**条件**:每一层读取都要有明确触发条件,禁止默认全量加载。

---

## 4. 内容分层规则

**判断某段内容该放哪里,问三个问题:**

1. 三个月后还会一字不变吗? → 是 → CLAUDE.md
2. 会随阶段/流程演进吗? → 是 → AGENTS.md
3. 是某个具体场景的完整步骤手册吗? → 是 → Skill

**反向禁止**:
- CLAUDE.md 不写"流程""规则""检查清单"
- AGENTS.md 不写项目事实(技术栈/目录/接口契约)
- AGENTS.md 不复述 CLAUDE.md 内容,只写"需要时去哪拿"
- Skill 不互相依赖,每个 Skill 自包含

---

## 5. 为什么这样设计

### 5.1 避免循环引用

旧方案 CLAUDE.md 指向 AGENTS.md、AGENTS.md 又回读 CLAUDE.md,两份文件互相复述进度、禁止清单、端口表,任一处变更都要多地同步,容易产生口径分裂。

### 5.2 避免重复读取

旧方案中 Claude Code 启动自动读 CLAUDE.md(213 行)+ AGENTS.md(619 行),超过 800 行 L0 内容,其中 60% 是重复或当前任务不需要的细节。

### 5.3 降低 L0 token 消耗

新方案 L0 只读一个入口文件(≤200 行),L1(按需)、L2(场景触发)才补读。估算单次新任务启动可节省 500+ 行上下文。实际节省量以 Step 4 验收实测为准,本节数字为设计阶段估算。

### 5.4 支持专项流程复用

旧 AGENTS.md 第 7 / 8 / 13 节及 §16 子节分别承载任务开始 / 阻塞 / 验收 / 执行包等多个流程,混在一起无法独立引用。下沉为 4 个 Skill 后,每个流程可以被不同任务独立触发。

---

## 6. Skill 索引(场景 → 文件)

| 场景 | 触发条件 | Skill 文件 |
|------|---------|-----------|
| 任务开始前的环境自检与上下文加载 | 每次新任务开始 | `docs/ai-skills/skill-task-intake.md` |
| Codex 执行任务时的代码修改与提交规则 | Codex 开始执行 | `docs/ai-skills/skill-codex-execution.md` |
| 任务收口时的验收流程与执行摘要 | 执行完毕准备收口 | `docs/ai-skills/skill-acceptance-review.md` |
| 执行超 2 轮未闭环的阻塞判定 | 同路径失败 ≥2 次 | `docs/ai-skills/skill-blocker-handling.md` |

---

## 7. 维护约束

- 本文件变更需与 CLAUDE.md / AGENTS.md 结构变更同步
- 新增 Skill 时必须在本文件 §6 登记,并在 AGENTS.md Skill 索引同步
- 禁止在 Skill 内反向修改 CLAUDE.md 或 AGENTS.md 的约定,Skill 只是流程手册,不是规则源头
- 当某条规则在 2 个以上 Skill 中重复出现,视为跨场景规则,应上提到 AGENTS.md §5 硬规则,并在原 Skill 中改写为"遵循 AGENTS.md §5 第 X 条"
