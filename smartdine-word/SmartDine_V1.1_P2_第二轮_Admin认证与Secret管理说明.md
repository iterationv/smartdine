# SmartDine V1.1 P2 第二轮 Admin 认证与 Secret 管理说明

## 1. Admin 认证环境变量

Admin 真实认证由 `smartdine-api` 读取以下环境变量：

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=
ADMIN_JWT_SECRET=
ADMIN_JWT_EXPIRES_IN=86400
```

- `ADMIN_USERNAME`: 单管理员用户名。
- `ADMIN_PASSWORD_HASH`: bcrypt hash，不填写明文密码。
- `ADMIN_JWT_SECRET`: JWT 签名 secret。
- `ADMIN_JWT_EXPIRES_IN`: JWT 有效期，单位为秒，默认 86400。

真实 `.env`、`.env.ai`、`.env.cc` 不进入 git，由部署人员在目标环境维护。

## 2. ADMIN_JWT_SECRET 生成方式

推荐使用：

```powershell
openssl rand -base64 32
```

不同环境必须使用不同 secret，不要复用开发、测试、生产 secret。

## 3. ADMIN_PASSWORD_HASH 生成方式

在 `smartdine-api` 目录执行：

```powershell
npx tsx scripts/hash-admin-password.ts "your-admin-password"
```

也可以不传命令行参数，按提示输入密码：

```powershell
npx tsx scripts/hash-admin-password.ts
```

脚本只输出 bcrypt hash，不写入任何 `.env*` 文件。bcrypt cost 默认不低于 10，可通过 `BCRYPT_COST` 临时调整，但不得低于 10。

## 4. 泄露与应急处理

- `ADMIN_JWT_SECRET` 泄露后，立即生成新 secret、更新目标环境并重启 API，所有旧 token 会失效。
- 管理员密码泄露或人员变更后，立即重新生成 `ADMIN_PASSWORD_HASH` 并重启 API。
- `.env` 误提交后，不能只删除提交或改 git 历史，必须先轮换其中所有 secret，再处理仓库历史。
- 轮换记录只记录时间、操作者和原因，不记录 secret 原值或 hash 原值。

## 5. 前端约束

- Admin 前端不保存 JWT。
- Admin 前端不保存密码。
- JWT 只通过服务端写入的 httpOnly cookie 传递。
- 受保护接口返回 401 时，前端清理本地 UI 登录态并跳转登录页。
