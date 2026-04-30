# SmartDine V1.1 P2 第二轮包 5 执行报告

## 1. 执行范围
- 本包执行内容: 落地 P2-07 AI 配置后台化最小版本，开放 systemPrompt、fallbackMessages、modelName、temperature 四类配置；新增 Admin AI 配置页面；接入包 4 JWT Admin 鉴权；接入 /chat 热更新配置；新增 admin-events 审计日志。
- 未执行内容: 未做 API Key 后台编辑，未做 Base URL 后台编辑，未做 Provider 后台切换，未做复杂 Prompt 模板管理，未做多模型路由，未做多租户配置，未做 Prompt 版本管理/历史回滚，未做配置导入导出，未做用量统计。
- 是否完成 P2 第二轮 5 包: 包 5 功能已完成并通过本轮验证；待用户验收并提交后，可进入 P2 第二轮总验收。
- 实际读取文件: AGENTS.md、CLAUDE.md、README.md、smartdine-word/SmartDine_V1.1_P2_第二轮_Codex执行任务清单.md、smartdine-word/SmartDine_V1.1_P2_第二轮启动基线确认.md、smartdine-word/SmartDine_V1.1_P2_第二轮_包2_执行报告.md、smartdine-word/SmartDine_V1.1_P2_第二轮_包3_执行报告.md、smartdine-word/SmartDine_V1.1_P2_第二轮_包4_执行报告.md、smartdine-word/SmartDine_V1.1_P2_第二轮_Admin认证与Secret管理说明.md、smartdine-word/P2/SmartDine_V1.1_P2_AI配置后台化方案.md、smartdine-word/P2/SmartDine_V1.1_P2_详细任务清单.md、smartdine-word/P2/SmartDine_V1.1_P2_第一轮交叉校验报告.md、smartdine-word/P2/SmartDine_V1.1_P2_第一轮收尾补丁_执行报告.md。

## 2. 后端 AI 配置实现
- 改动文件: .gitignore、smartdine-api/src/services/aiConfigService.ts、smartdine-api/src/routes/adminAiConfig.ts、smartdine-api/src/utils/adminEvents.ts、smartdine-api/src/index.ts、smartdine-api/src/llm.ts、smartdine-api/src/ai/retrieve.ts。
- 配置文件路径: smartdine-api/data/ai-config.json。
- 默认配置: systemPrompt 为 SmartDine 智能助手默认提示词；fallbackMessages 包含 low/ambiguous/unknown_entity；modelName 默认沿用 Kimi 模型 moonshot-v1-8k；temperature 默认 0.7。
- 配置加载与缓存: 启动时 loadAiRuntimeConfig() 加载文件并写入模块级缓存；/chat 读取内存缓存，不在每次请求中读取文件；PUT/reset 后更新文件与缓存。
- 文件不存在处理: 使用代码内 DEFAULT_AI_CONFIG，不报错；已验证 GET 返回默认配置。
- 文件损坏处理: 捕获 JSON/校验错误，记录 console.error，回退默认配置，不导致服务崩溃；已通过损坏文件启动验证。
- GET /api/admin/ai-config: 返回当前可编辑配置和只读状态 apiKeyConfigured、baseUrl、provider；不返回 API Key 原文。
- PUT /api/admin/ai-config: 校验并保存四类配置，写入 data/ai-config.json，更新缓存，写入 admin-events。
- POST /api/admin/ai-config/reset: 恢复默认配置，写入 data/ai-config.json，更新缓存，写入 admin-events。
- JWT 鉴权接入: 三个端点均使用 adminJwtAuthMiddleware；未登录访问 GET 返回 401。
- /chat 接入配置: askLLM 使用缓存中的 systemPrompt、modelName、temperature；retrieve fallback 使用缓存中的 fallbackMessages。

## 3. 配置校验
- systemPrompt: 必须是非空字符串，最长 4000。
- fallbackMessages.low: 必须是非空字符串，最长 500，必须包含 {topic}。
- fallbackMessages.ambiguous: 必须是非空字符串，最长 200。
- fallbackMessages.unknown_entity: 必须是非空字符串，最长 500，必须包含 {tokens}。
- modelName: 必须是非空字符串，最长 100。
- temperature: 必须是 number，范围 0 到 1。
- 校验失败处理: 返回 HTTP 400 和明确 message；不写文件，不更新缓存；已验证 invalid PUT 后缓存仍保持原配置。

## 4. Admin 前端页面
- 改动文件: smartdine-admin/src/api/aiConfig.js、smartdine-admin/src/views/AiConfig.vue、smartdine-admin/src/router/index.js、smartdine-admin/src/App.vue。
- /ai-config 路由: 新增 /ai-config，meta.requiresAuth=true，沿用包 4 路由守卫。
- 导航入口: 放在“问答日志”之后。
- 只读区: 展示 API Key 状态、Base URL、Provider，不提供编辑入口。
- 可编辑区: systemPrompt textarea、low textarea、ambiguous input、unknown_entity textarea、modelName input、temperature slider/input-number。
- 保存: 调用 requestAdminJson 封装的 PUT /api/admin/ai-config，成功提示“保存成功，新配置已对下次提问生效”。
- 恢复默认: 使用 Modal.confirm 二次确认后调用 POST /api/admin/ai-config/reset，成功后刷新表单。
- 前端校验: 保存前校验非空、长度、temperature 范围、{topic}/{tokens} 占位符；失败不发请求并提示。
- 401 处理: 使用包 4 requestAdminJson，401 统一清理 UI 登录态并跳转登录页。

## 5. 审计日志
- admin-events 文件: smartdine-api/logs/admin-events-YYYY-MM-DD.jsonl。
- update 日志: PUT 成功后写入 action=ai-config.update。
- reset 日志: reset 成功后写入 action=ai-config.reset。
- diff 字段: 仅记录变化字段，包含 from/to，不记录 API Key。
- 是否污染 qa-events: 否；验证中确认 qa-events 不包含 ai-config.update/reset。

## 6. 安全验收
- API Key 是否不返回前端: 是；GET 响应仅返回 apiKeyConfigured，不返回 API Key 原文。
- API Key 是否不进入 ai-config.json: 是；验证读取文件确认未写入测试 API Key。
- Base URL / Provider 是否只读: 是，仅作为只读状态展示，不提供编辑控件和保存字段。
- 是否未修改真实 .env*: 是。
- 是否未新增依赖: 是，未修改 package.json 或 lock 文件。

## 7. 联动验证
- 修改配置后 /chat 是否使用新配置: 是，PUT 后 /chat 读取内存缓存的新配置。
- unknown_entity 话术是否生效: 是，将 unknown_entity 改为 UNKNOWN_MARKER:{tokens} 后，触发 unknown_entity 的 /chat 返回新话术。
- systemPrompt 是否生效: 是，使用 fake LLM 捕获请求，确认 system message 包含 SYSTEM_PROMPT_MARKER_P2_07。
- 配置 reset 后是否恢复默认: 是，POST reset 后 GET 返回 moonshot-v1-8k 和 temperature=0.7。

## 8. 构建验证
- API build: 通过，命令 `cd smartdine-api && npm run build`。
- Admin build: 通过，命令 `cd smartdine-admin && npm run build`。
- H5 build: 通过，命令 `cd smartdine-h5 && npm run build`。
- 已知 warning: Admin build 仍有 Vite large chunk warning，仅记录，不作为失败。

## 9. 范围合规检查
- 是否修改 KB: 否。
- 是否修改真实 .env*: 否。
- 是否修改 package/lock: 否。
- 是否引入新依赖: 否。
- 是否开放 API Key 编辑: 否。
- 是否做 Provider 切换: 否。
- 是否 commit: 否。
- 是否 push: 否。

## 10. 风险与遗留
- 阻塞项: 无。
- 非阻塞遗留: Admin large chunk warning 仍存在，属于既有 warning；本轮未使用浏览器做人工点击验收，Admin 页面通过源码静态检查和 production build 验证。
- 是否建议进入 P2 第二轮总验收: 是，建议用户验收包 5 并提交后进入 P2 第二轮总交叉验证/总验收。
