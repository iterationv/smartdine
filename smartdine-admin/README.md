# SmartDine Admin

SmartDine V1 的 B 端 Admin 初始化工程。

本阶段只完成以下内容：

- Vue 3 + Vite + JavaScript 工程骨架
- Ant Design Vue 接入
- 基础路由占位页

本阶段未完成：

- `.env.local`
- 登录逻辑
- 路由守卫
- FAQ 真实接口联调

## 启动方式

```bash
npm install
npm run dev
```

默认访问地址以 Vite 控制台输出为准，常见为：

```bash
http://127.0.0.1:5174
```

## 当前占位路由

- `/login`
- `/faq`
- `/faq/new`
- `/faq/edit/:id`

## 环境变量

当前仅提供 `.env.example`。

进入后续接口联调阶段时，再由人工创建 `.env.local`：

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000
VITE_API_SECRET=
```
