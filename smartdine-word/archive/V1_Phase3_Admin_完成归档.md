# Phase 3 Admin 完成归档

## 1. 归档范围

- 阶段：Phase 3（B 端 Admin）
- 范围：Admin 登录、FAQ 列表、FAQ 新增、FAQ 编辑、FAQ 删除、FAQ 列表关键字搜索、FAQ 热更新联动验证
- 不包含：Phase 4 联调部署、V2/V3 功能扩展、H5 功能追加、接口契约调整

## 2. 本阶段完成项

### 2.1 Admin 最小闭环

- 已实现临时登录方案：`admin / admin123`
- 未登录访问 `/faq` 会重定向到 `/login`
- 已登录访问 `/login` 会重定向到 `/faq`

### 2.2 FAQ 列表与真实接口联调

- 列表页通过 `GET /admin/faq` 获取真实 FAQ 数据
- 请求头携带 `x-api-key`
- 页面展示 `question / answer / tags`

### 2.3 FAQ 新增 / 编辑 / 删除

- 新增通过 `POST /admin/faq`
- 编辑通过 `PUT /admin/faq/:id`
- 删除通过 `DELETE /admin/faq/:id`
- 删除前带最小确认交互

### 2.4 FAQ 列表关键字搜索

- 已补齐列表页关键字搜索
- 搜索范围覆盖 `question / answer / tags`
- 搜索基于前端已加载列表本地过滤实现
- 支持清空搜索
- 搜索结果为空时显示空态提示

### 2.5 热更新联动

- Admin 写入 FAQ 后，后端会写回 `faq.json` 并刷新 FAQ 内存缓存
- `/chat` 无需重启 API 即可命中最新 FAQ
- Phase 3 验收中已验证：编辑后的 FAQ 问题可被 `/chat` 立即命中

## 3. 实际改动模块

### 3.1 Admin 侧

- `smartdine-admin/src/views/Login.vue`
- `smartdine-admin/src/router/index.js`
- `smartdine-admin/src/utils/auth.js`
- `smartdine-admin/src/api/faq.js`
- `smartdine-admin/src/views/Faq/List.vue`
- `smartdine-admin/src/views/Faq/Edit.vue`

### 3.2 API 侧（被联调验证）

- `smartdine-api/src/index.ts`
- `smartdine-api/src/faq.ts`
- `smartdine-api/src/llm.ts`

## 4. 验收通过项

### 4.1 Admin 主链路

- 登录通过
- 路由守卫跳转通过
- FAQ 列表真实接口加载通过
- FAQ 新增通过
- FAQ 编辑通过
- FAQ 删除通过
- FAQ 删除后列表确认消失通过
- CRUD 验证后测试 FAQ 已清理

### 4.2 FAQ 列表搜索

- 问题关键字搜索通过
- 答案关键字搜索通过
- 标签关键字搜索通过
- 搜索空态通过
- 清空搜索后列表恢复通过

### 4.3 热更新联动

- `/chat` 在不重启 API 的前提下命中最新 FAQ 通过
- `matched.question` 与最新 FAQ 问题一致
- 当前 API PID 在热更新验证前后保持一致，未发生重启

## 5. 已解决阻塞复盘

### 5.1 API 一度未监听 3000

- 出现阶段：Phase 3 开发启动期
- 现象：本地联调无法继续，后续 Admin 真实接口验证被阻断
- 根因：本地没有可用的 API 监听进程
- 解决：恢复 `smartdine-api` 运行态，确认 `3000` 端口真实监听
- 预防：每轮任务开始前先做 `/health` 和 `netstat -ano | findstr :3000`

### 5.2 `smartdine-admin/.env.local` 缺失

- 出现阶段：真实接口联调前
- 现象：Admin 无法稳定进入真实接口链路
- 根因：缺少 `VITE_API_BASE_URL` 和 `VITE_API_SECRET`
- 解决：补齐 `.env.local`，并确认与 API 端配置一致
- 预防：把 Admin `.env.local` 存在性检查固定为 Phase 3 起手动作

### 5.3 自动化执行状态与验收结论错位

- 出现阶段：CRUD 验收中
- 现象：曾出现沿用上一轮新增结果、未真实执行编辑却提前给出结论的情况
- 根因：执行步骤与验收归因绑定不够严格
- 解决：重新跑真实编辑链路，并以编辑后的唯一标识做复核
- 预防：CRUD 每一步都用唯一标识并单独留验证证据

### 5.4 `localhost` / `127.0.0.1` 混用风险

- 出现阶段：本地联调口径确认时
- 现象：存在引发 CORS、origin 判断、浏览器本地状态不一致的风险
- 根因：同机不同 host 在浏览器语义上不是同一 origin
- 解决：本阶段统一使用 `http://localhost`
- 预防：文档、env、自动化脚本统一 host 写法

### 5.5 浏览器自动化环境与定位问题

- 出现阶段：Playwright 自动验收
- 现象：
  - CLI 可用但脚本模块初始不可直接 `require`
  - SPA 登录成功但 `waitForURL` 超时
  - Ant Design Vue 按钮文本带空格导致文本定位失败
- 根因：
  - 临时执行环境模块解析与当前工作目录不一致
  - Vue Router 属于 SPA 路由切换，不等于整页导航
  - 组件渲染文本与字面选择器不完全一致
- 解决：
  - 使用系统临时目录的独立 runner
  - 改为等待 `pathname`
  - 改为结构化 DOM 选择器
- 预防：先做 runner smoke test，再做最短页面交互测试

### 5.6 测试 FAQ 数据清理与环境污染

- 出现阶段：CRUD 和热更新验收后
- 现象：若不清理，测试 FAQ 会污染真实列表与后续验收环境
- 根因：Phase 3 验证必须写真实接口
- 解决：使用唯一标识创建测试 FAQ，删除后再用 `GET /admin/faq` 复核不存在
- 预防：把“创建后清理、清理后复核”固化为验收模板

## 6. 当前保留口径说明

### 6.1 `/chat` 命中 FAQ 的答案口径

- 当前实现不是“FAQ 原文直出”
- 当前实现是：FAQ 命中后，将 FAQ 标准答案交给 LLM 做自然语言润色
- 因此：
  - `matched.question` 命中最新值，且无需重启 API 即可生效，应判定为热更新联动通过
  - `answer` 不是 FAQ 原文，不属于 Phase 3 阻塞，而是当前产品行为口径

### 6.2 文档状态字段滞后

- 现有总规划文档和执行顺序清单中的阶段状态仍写为“Phase 3 待开始”
- 这与当前代码和验收结果不一致
- 本归档文档作为 Phase 3 实际完成状态的补充记录

## 7. 进入 Phase 4 前置条件

进入 Phase 4 前，仍需先满足以下条件：

- `CORS_ORIGINS` 切换为生产域名，不再包含 `localhost`
- `API_SECRET` 更换为高强度随机值
- `faq.json` 替换为真实 LG 食堂 FAQ 数据
- H5 的 `VITE_API_BASE_URL` 指向生产 API
- `/health` 在生产环境可访问
- H5 与 Admin 的生产构建无报错

## 8. 当前阶段建议

- 当前代码状态适合打一个 “Phase 3 完成节点”
- 建议在进入任何 Phase 4 工作前，先保留当前节点
- Phase 4 应基于本归档文档和既有验收结论继续推进
