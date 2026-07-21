# 西班牙签证 × 欧洲行程协作台

一个适合两个人共同使用的独立网页系统，包含：

- 邮箱魔法链接登录
- 任务分工和截止日期
- 官方签证材料清单
- 两人各自材料状态
- 欧洲逐日行程
- 费用和付款人
- 总览进度与倒计时
- Supabase PostgreSQL 数据库
- Vercel 部署配置

## 1. 创建 Supabase 项目

1. 登录 Supabase，创建一个新项目。
2. 打开 **SQL Editor**。
3. 先粘贴执行 `supabase/schema.sql`。
4. 再粘贴执行 `supabase/seed.sql`。
5. 打开 **Project Settings → API**，复制：
   - Project URL
   - anon public key
6. 在 **Authentication → URL Configuration** 中：
   - Site URL 暂时填 `http://localhost:3000`
   - 部署后改成你的 Vercel 域名
   - Redirect URLs 添加 `http://localhost:3000/**` 和部署后的域名 `https://你的域名/**`

## 2. 本地运行

```bash
cp .env.example .env.local
# 把 Supabase URL 和 anon key 填入 .env.local
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 3. 部署到 Vercel

### 方法A：网页部署

1. 把本项目上传到 GitHub 私有仓库。
2. 登录 Vercel，选择 **Add New Project**。
3. 导入该 GitHub 仓库。
4. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 点击 Deploy。
6. 回到 Supabase Authentication，把 Site URL 与 Redirect URL 更新为 Vercel 域名。

### 方法B：Vercel CLI

```bash
npm i -g vercel
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

## 4. 两个人如何使用

- 两个人分别输入自己的邮箱，接收登录链接。
- 默认任何已登录用户都可共同编辑这一个工作区。
- 请不要把站点地址公开发布；只分享给同行人。
- 更严格的“仅指定两个邮箱可访问”可在 Supabase Auth 中关闭公开注册，改为管理员邀请。

## 5. 安全说明

数据库启用了 Row Level Security，只有已登录用户可以读写。
当前为单工作区设计，适合两位同行人共同维护同一项目。
