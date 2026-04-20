# SmartDine 项目规划文档

**版本：** V0.3  
**状态：** Phase 1/2 已完成，Phase 3 待开始  
**所有待决策事项已确认，可直接推进。**

---

## 一、产品定位

SmartDine 是面向餐饮场景的 AI 智能问答系统。  
顾客扫码进入 H5，输入问题，AI 基于 FAQ 知识库回答。

```
产品形态：
C 端 H5        → 顾客问答     ✅ V1 必做（已完成）
B 端 Admin     → FAQ 管理     ✅ V1 最小版（待开始）
后端 API       → 问答接口     ✅ V1 必做（已完成）
小程序          → 微信版顾客端  ⏳ V2 跟进
```

**MVP 目标场景：LG 食堂**  
顾客触达方式：扫桌贴二维码 → H5 / 微信小程序内嵌跳转 H5

---

## 二、技术选型（已锁定）

| 模块 | 技术 | 说明 |
|------|------|------|
| 后端框架 | Node.js + Hono + TypeScript | 轻量，Railway 友好 |
| AI 模型 | Kimi（moonshot-v1-8k） | 兼容 OpenAI SDK |
| FAQ 存储 | `faq.json` 内存缓存 | V1 热加载，V2 迁移 Supabase |
| C 端 H5 | Vue 3 + Vite + **JavaScript** | 不用 TypeScript |
| B 端 Admin | Vue 3 + Vite + Ant Design Vue | 复用前端技术栈 |
| 后端部署 | Railway | 支持长连接 |
| 前端部署 | Vercel 静态托管 | H5 与 Admin 各自独立 |

### 模型切换（只改 .env，代码零改动）

| Provider | AI_BASE_URL | 推荐模型 |
|----------|-------------|---------|
| Kimi（当前） | `https://api.moonshot.cn/v1` | moonshot-v1-8k |
| OpenAI | `https://api.openai.com/v1` | gpt-4o-mini |
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-turbo |

---

## 三、问答逻辑

V1 本质是 **FAQ 命中 + AI 润色**，不是纯 AI 自由回答：

```
用户提问
    ↓
关键词检索 FAQ（question + tags，基础 includes 匹配）
    ├── 命中 → AI 基于 FAQ 答案做自然语言润色
    └── 未命中 → AI 在餐饮服务范围内兜底（不编造超出业务范围的信息）
```

---

## 四、FAQ 知识库

### 数据结构
```json
{
  "id": "faq_001",
  "question": "你们几点营业？",
  "answer": "每天 10:00 - 22:00，节假日不休。",
  "tags": ["营业时间", "开门", "关门"]
}
```

### V1 匹配规则
- `question` 文本参与匹配
- `tags` 参与匹配
- 只做基础 `includes` 遍历
- 没有明显命中时返回 `null`
- **不做** 复杂权重算法、语义匹配、向量检索

### FAQ 热加载机制
```
Admin 保存 FAQ → POST /admin/faq（写入 faq.json）
→ 后端写文件后刷新内存缓存
→ 下次 /chat 请求直接读新缓存
（不需要重启服务）
```

---

## 五、V1 范围边界

### 必须完成

**后端 API**
- [x] `POST /chat`
- [x] `GET/POST/PUT/DELETE /admin/faq`
- [x] `GET /health`
- [x] `x-api-key` 鉴权中间件
- [x] CORS 配置
- [x] 环境变量配置层

**C 端 H5**
- [x] 对话界面（输入框 + 消息列表）
- [x] 品牌区（餐厅名称 + Logo 占位）
- [x] FAQ / AI 视觉区分标签
- [x] 移动端适配
- [x] loading 状态 / 错误提示

**B 端 Admin**
- [ ] 登录页（单账号，`admin / admin123`）
- [ ] FAQ 列表 + 搜索
- [ ] FAQ 新增 / 编辑 / 删除
- [ ] 修改后实时同步 H5（热加载）

### 明确排除在 V1 外

- 多餐厅 / 多租户
- 问答历史记录（V2）
- 数据统计报表
- 微信小程序版（V2）
- 向量检索 / RAG（V3）
- 用户注册 / 多账号权限
- AI 点赞 / 踩（V2）

---

## 六、安全策略

### API 防滥用（已实现）
```
客户端请求头携带 x-api-key: <API_SECRET>
→ Hono 中间件校验是否匹配 .env 中的 API_SECRET
→ 匹配 → 放行 / 不匹配 → 401
```

这不是用户身份鉴权，只是防止陌生人直接调接口消耗 AI token。

### CORS 策略（已实现）
| 阶段 | 策略 |
|------|------|
| 本地开发 | `CORS_ORIGINS` 为空时允许 `*` |
| 生产上线 | 白名单：仅允许 H5 域名 + Admin 域名 |

---

## 七、V1 验收标准

| 项目 | 通过条件 |
|------|---------|
| 问答主流程 | 顾客输入问题 5 秒内返回答案 |
| FAQ 命中 | 已知问题 `matched` 不为 null |
| AI 兜底 | 未知问题返回合理答案，`matched` 为 null |
| 热加载 | 后台改 FAQ，无需重启，H5 立即生效 |
| 错误处理 | 空输入 400，无效 key 401，模型故障 500 |
| 餐厅展示 | H5 顶部展示餐厅名称 |
| 后台管理 | 能增删改 FAQ |
| 配置切换 | 改 `.env` 重启后模型生效，代码零改动 |
| 部署 | 后端 Railway，前端 Vercel，公网可访问 |

---

## 八、版本演进路径

### V1（当前）· 跑通核心流程
H5 问答 + Admin FAQ 管理 + LG 食堂场景可演示

### V2 · 结构化 + 可运营
- FAQ 数据迁移 Supabase
- 问答记录查看 + 未命中问题列表
- AI 回答点赞 / 踩
- JWT 登录鉴权
- C 端小程序（UniApp）

### V3 · 智能化升级
- 向量检索（RAG）：Python FastAPI 微服务 + Qdrant Cloud
- 多轮对话上下文记忆

### V4 · 商业化扩展（远期）
- 多租户架构 / 数据看板 / 对接点餐系统

---

## 九、开发工作流

```
需求 → Claude 输出 Spec
     → Codex / Claude Code 生成代码
     → Claude 验收代码
     → 人工 Review + 修正
```

### Git 分支约定
| 分支 | 用途 |
|------|------|
| `main` | 稳定可部署版本 |
| `dev` | 日常开发集成分支 |
| `feat/xxx` | 功能分支，合并到 dev |

### 环境约定
| 环境 | 说明 |
|------|------|
| 本地开发 | `.env` / `.env.local`，`npm run dev`，CORS 全开 |
| 预发布 | Railway Preview，CORS 白名单 |
| 生产 | Railway Production，CORS 白名单，API Key 必须配置 |

---

## 十、变更记录

| 版本 | 日期 | 内容 |
|------|------|------|
| V0.1 | 2025-04 | 初稿：产品定位、技术选型、FAQ 结构、V1 目标、演进路径 |
| V0.2 | 2025-04 | 整合待决策确认项；补充热加载方案、API 防滥用、CORS 策略；明确 MVP 目标为 LG 食堂 |
| V0.3 | 2026-04 | 更新当前进度（Phase 1/2 已完成）；补充 AI 工具阅读优化；精简冗余内容；对齐实际代码（API 为 TypeScript，H5 为 JavaScript） |

---

*Phase 3 Admin 开发可立即启动。*
