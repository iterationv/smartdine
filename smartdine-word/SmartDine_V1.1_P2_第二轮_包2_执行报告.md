# SmartDine V1.1 P2 第二轮包 2 执行报告

## 1. 执行范围
- 本包执行内容:
  - 子任务 A：H5 `confidence / candidates` 展示适配
  - 子任务 B：`queryQaEvents()` 单日读取优化
- 未执行内容:
  - 包 3：P2-02 推荐策略字段补齐 + P2-11B Admin 日志页增强
  - 包 4：P2-05 Admin 真实认证
  - 包 5：P2-07 AI 配置后台化最小落地
- 是否跳过包 3/4/5: 是。严格按本轮指令只执行包 2。

## 2. 子任务 A：H5 confidence 适配
- 改动文件:
  - `smartdine-h5/src/api/chat.js`
  - `smartdine-h5/src/stores/chatStore.js`
  - `smartdine-h5/src/components/MessageList.vue`
- high 展示策略:
  - 缺省或无效 `confidence` 按 `high` 处理。
  - 继续按原有回答卡片展示，不增加额外提示。
  - 通过 SSR 验证：高置信消息渲染时不包含 `我不太确定：`、不包含候选标题、不卡到提示卡样式。
- low 展示策略:
  - 在回答前增加橙色弱提示条，文案为 `我不太确定：`。
  - 回答正文仍正常展示，不改原有消息主布局。
- ambiguous 展示策略:
  - 当 `candidates` 为有效数组且有内容时，不把正文当确定答案展示。
  - 改为展示后端返回的引导文案 + 候选按钮列表。
  - 当 `candidates` 缺失、不是数组或为空时，降级为直接展示后端返回 `answer`。
- unknown_entity 展示策略:
  - 使用灰色提示卡样式展示兜底文案。
  - 增加 `提示` 标识，避免伪装成确定答案。
- candidates 点击重发逻辑:
  - `MessageList.vue` 继续通过既有 `suggest` 事件向上冒泡。
  - `Chat.vue` 现有 `@suggest="handleSuggestionClick"` 仍调用 `chatStore.sendQuestion(question)`，因此候选按钮点击后会使用候选问题重新发起提问。
- 兼容旧响应说明:
  - `postChat()` 对缺失 `confidence` 的旧响应默认回退为 `high`。
  - `candidates` 统一做数组化与结构清洗；缺失或脏数据时回退为空数组，不报错。
  - 未改变原有 `loading`、错误提示、推荐问题点击和正常问答流程。
- H5 build 结果:
  - 通过。`npm run build` 输出 `dist/assets/index-pvwYD3cV.js`，无新增依赖、无 `console.log` 残留。

## 3. 子任务 B：queryQaEvents 单日读取优化
- 改动文件:
  - `smartdine-api/src/utils/qaEvents.ts`
  - `smartdine-api/src/routes/adminLogs.ts`
- date 参数处理:
  - `GET /api/admin/qa-events` 现支持 `date=YYYY-MM-DD`。
  - 未传或格式不合法时默认回退到服务端当天日期。
  - 本轮实测当天回显为 `2026-04-26`。
- 单日文件读取逻辑:
  - 删除原先 `readdir(LOG_DIR) + Promise.all(所有 qa-events-*.jsonl)` 的全量扫描路径。
  - 改为只读取 `qa-events-${date}.jsonl` 单个文件。
  - 单日文件内完成 `confidence` 过滤、按时间倒序排序和分页切片。
- 文件不存在处理:
  - 文件不存在时返回 HTTP `200`。
  - 响应为 `{ items: [], list: [], total: 0, page, limit, date }`。
- confidence 多选筛选:
  - 路由层支持 `confidence=low,unknown_entity` 这类逗号分隔多值。
  - 实测返回值仅包含 `low` 与 `unknown_entity`，无其他置信度混入。
- page / limit 处理:
  - `page` 默认 `1`。
  - `limit` 默认 `20`，最大 `100`。
  - 非数字或非法值回退默认值。
  - 实测 `page=2&limit=1` 生效；`date=2099-01-01&page=2&limit=5` 仍返回空列表且保留分页回显。
- 多日 jsonl 共存验证:
  - 临时写入 `smartdine-api/logs/qa-events-2026-04-25.jsonl`，验证后已恢复。
  - 默认查询 `?limit=2` 返回 `date=2026-04-26`、`total=13`。
  - 指定 `?date=2026-04-25&limit=20` 返回 `total=1`，首条 `requestId=temp_case_20260425`。
  - 结合代码路径核对，确认不再扫描全部历史日期文件。
- API build 结果:
  - 通过。`npm run build` 仅执行 `tsc`，无新增依赖、未影响 `/health`。

## 4. Admin 兼容性
- Admin 页面是否仍可调用:
  - 是。为兼容当前 `smartdine-admin/src/api/qaEvents.js`，后端响应在新增 `items / page / limit / date` 的同时继续保留 `list` 字段别名。
  - 因此包 2 不需要修改 Admin 代码，现有问答日志页不会因字段缺失崩溃。
- Admin build 结果:
  - 通过。`npm run build` 成功。
- 已知 warning:
  - Vite large chunk warning 仍存在：`dist/assets/index-rMQ8Ks4Q.js` 约 `2650.82 kB`。
  - 该 warning 记录为已知项，不作为本包失败条件。

## 5. 范围合规检查
- 是否修改 KB: 否。
- 是否修改 `.env*`: 否。
- 是否修改 package/lock: 否。
- 是否引入新依赖: 否。
- H5 是否新增 `.ts` 或 script setup: 否。未新增 `.ts` 文件；`MessageList.vue` 已改为普通 `<script>` 的 Options API 写法。
- 是否修改 `/health`: 否。
- 是否 commit: 否。
- 是否 push: 否。

## 6. 验收命令与结果
- API build:
  - 命令：`cd smartdine-api && npm run build`
  - 结果：通过
- H5 build:
  - 命令：`cd smartdine-h5 && npm run build`
  - 结果：通过
- Admin build:
  - 命令：`cd smartdine-admin && npm run build`
  - 结果：通过（仅有已知 large chunk warning）
- 其他验证命令:
  - 使用 Node 直接读取 `smartdine-api/test/fixtures/p2-retrieval-cases.json` 中 4 条样例，调用 `POST /chat` 验证 4 种状态：
    - `case-001` → `high`
    - `case-021` → `ambiguous`，`candidates=3`
    - `case-low-001` → `low`
    - `case-control-005` → `unknown_entity`
  - 使用 Node 调用 `GET /api/admin/qa-events` 验证：
    - 默认当天查询
    - 指定 `date=2026-04-25`
    - 指定缺失日期 `2099-01-01`
    - `confidence=low,unknown_entity`
    - `page=2&limit=1`
  - 使用 Vite SSR 渲染 `smartdine-h5/src/components/MessageList.vue`，验证：
    - `low` 分支渲染 `我不太确定：`
    - `ambiguous` 分支渲染候选标题与按钮
    - `unknown_entity` 分支渲染提示卡样式
    - `high` 分支不混入低置信或候选提示

## 7. 风险与遗留
- 阻塞项:
  - 无。
- 非阻塞遗留:
  - 本轮未拿到浏览器自动化工具，H5 展示验证采用 `真实 /chat 返回 + H5 build + MessageList SSR 渲染` 组合完成，未生成浏览器截图。
  - Admin 端目前仍消费 `list` 兼容字段；真正切换到 `date / page / limit / confidence` 增强交互留给包 3。
  - Admin build large chunk warning 仍保留，属于已知后续项。
- 是否建议进入包 3:
  - 建议进入包 3。
