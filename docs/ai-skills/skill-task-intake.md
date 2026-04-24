# Skill: 任务开始前环境自检与上下文加载

> 专项流程:每次新任务开始前的准备动作。
> 上位规则:[AGENTS.md](../../AGENTS.md) §3(上下文管理)、§5(硬规则)。

## 触发条件

- 每次新任务开始
- 切换任务清单或切换执行包时
- 工作目录变更(如切换 worktree)时

## 输入前提

- 已拿到用户的任务描述或任务清单引用
- 工作目录已确认(根目录 / worktree 路径明确)
- 当前使用工具已知(Claude Code / Codex 5.4 / Codex 5.5)

## 执行步骤

### A. 上下文加载

按 [AGENTS.md](../../AGENTS.md) §3.1 的分层模型:

1. 按工具视角确认 L0 已自动加载
2. 根据任务类型决定 L1 补读清单:
   - **P1 代码执行** → 读 `smartdine-word/SmartDine_V1.1_P1_Codex开发执行任务清单.md`
   - **P0 代码执行** → 读 `smartdine-word/SmartDine_V1.1_P0_Codex开发执行任务清单.md`
   - **审查 / 验收** → 读对应 Skill 文件(skill-acceptance-review.md)
3. L2 仅在触发条件命中时读,读前声明理由

### B. 环境口径判定

按优先级判定本次任务使用哪套环境:

1. 用户、README、任务说明已明确指定 → 以指定环境为准
2. Claude Code 专用任务 → 默认 **dev:cc**(端口 3301 / 5275 / 5276)
3. AI 自动测试 / Codex 分步验证 / 验收 → 默认 **dev:ai**(端口 3300 / 5273 / 5274)
4. 日常人工开发调试 → 默认 **dev**(端口 3000 / 5173 / 5174)

端口表见 [CLAUDE.md](../../CLAUDE.md) §4。**禁止混用端口口径**。

### C. 端口与服务健康检查

按选定环境查表获取参数,然后执行通用命令:

| 环境 | API 端口 | H5 端口 | Admin 端口 | env 文件后缀 |
|------|---------|--------|-----------|-------------|
| **dev** | 3000 | 5173 | 5174 | `.env` / `.env.local` |
| **dev:ai** | 3300 | 5273 | 5274 | `.env.ai` |
| **dev:cc** | 3301 | 5276 | 5275 | `.env.cc` |

假设本次环境 API 端口为 `$API_PORT`,H5 端口为 `$H5_PORT`:

```bash
# 1. 环境文件存在性(按表中后缀 ls 对应三端文件)
ls smartdine-api/.env.<后缀> && ls smartdine-h5/.env.<后缀> && ls smartdine-admin/.env.<后缀>

# 2. 端口监听(Windows)
netstat -ano | findstr :$API_PORT

# 3. 服务存活
curl http://127.0.0.1:$API_PORT/health

# 4. 接口连通
curl -X POST http://127.0.0.1:$API_PORT/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_SECRET" \
  -d '{"question":"测试"}'

# 5. CORS(H5 联调时)
curl -X OPTIONS http://127.0.0.1:$API_PORT/chat \
  -H "Origin: http://127.0.0.1:$H5_PORT" \
  -H "Access-Control-Request-Method: POST" -v
```

关键约束:

- `.env*` 文件存在 ≠ 服务可用,必须用 curl 实际验证
- 启动统一使用 `127.0.0.1`
- 清理进程:`taskkill /PID <pid> /F`

### D. 环境自检与自动拉起(独立规则)

**本节是独立子流程,不与 A/B/C 混写。** 自动拉起是有风险行为,必须满足触发条件。

**触发条件**(同时满足才拉起):

- 执行包明确依赖本地运行环境
- 目标端口未监听 或 健康检查失败
- 用户未明确禁止自动启动

**拉起规则**:

1. 先确认本次任务应使用的环境口径(见步骤 B)
2. 先检查端口是否已监听,再校验健康接口
3. 若服务未启动或健康检查失败:
   - 按该环境约定启动命令自动拉起
   - 启动成功 → 继续执行任务,不中断
   - 启动失败 → 停止,按"环境阻塞"格式上报(见 [skill-blocker-handling.md](skill-blocker-handling.md))
4. 启动命令:
   - dev:`npm run dev`
   - dev:ai:`npm run dev:ai`
   - dev:cc:`npm run dev:cc`
5. 环境恢复动作不算业务改动,不需要为此单独等待确认

## 输出要求

环境自检完成后,输出简短报告:

```text
### 环境自检
- 本次环境口径:dev:cc / dev:ai / dev
- API 端口监听: ✅ / ❌ (监听 PID)
- API 健康检查:✅ / ❌
- CORS 预检:  ✅ / ❌ / 未涉及
- 自动拉起:    未触发 / 已拉起成功 / 拉起失败(详见阻塞报告)
```

## 完成判定

同时满足以下条件,任务可以开始执行:

- L0 已加载,L1 按任务需要已声明并读取
- 环境口径已明确,与任务要求一致
- 目标端口已监听,健康检查通过
- 若触发自动拉起 → 拉起成功

任一项失败 → 转 [skill-blocker-handling.md](skill-blocker-handling.md)。
