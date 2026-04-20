# MomentLog — 记录当下，洞见未来

个人活动记录 + AI 自动简报 Web 应用。

**技术栈**：Next.js 16 · TypeScript · Tailwind CSS v4 · Shadcn/UI · Supabase · Vercel AI SDK + Claude

---

## 快速开始

### 1. 克隆并安装

```bash
git clone <your-repo>
cd momentlog
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

填入以下变量：

| 变量 | 来源 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| `NEXT_PUBLIC_SITE_URL` | 本地：`http://localhost:3000` |

### 3. 初始化数据库

在 Supabase Dashboard → SQL Editor 中运行 `supabase-schema.sql`。

### 4. 配置 Supabase Auth

在 Supabase Dashboard → Authentication → Providers 中：
- 启用 **Email** 登录
- （可选）启用 **Google** OAuth，填入 Client ID / Secret
- 在 URL Configuration → Redirect URLs 中添加：`http://localhost:3000/callback`

### 5. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000

---

## 部署到 Vercel

```bash
npm i -g vercel
vercel --prod
```

在 Vercel Dashboard → Settings → Environment Variables 中添加所有环境变量。

记得将 `NEXT_PUBLIC_SITE_URL` 改为你的 Vercel 域名，并在 Supabase 的 Redirect URLs 中添加：
```
https://your-app.vercel.app/callback
```

---

## 功能一览

| 功能 | 描述 |
|------|------|
| 🔐 Auth | Google / Email 登录，Supabase RLS 保护数据 |
| ✍️ 快速记录 | 时间、描述、标签、时长 |
| 📅 时间线 | 日 / 周 / 月 / 年视图，带导航 |
| 🤖 AI 简报 | 今日 / 本周 / 本月 / 年度，流式输出 |
| 📊 仪表盘 | 记录统计、每日条形图、标签分布 |

---

## 在 Cursor 中继续迭代

- **添加标签颜色自定义**：修改 `components/activity/ActivityForm.tsx` 中的 `TAG_COLORS`
- **调整 AI Prompt**：修改 `lib/prompts.ts` 中的 `buildBriefPrompt`
- **切换 AI 模型**：在 `app/api/brief/route.ts` 中修改 `anthropic("claude-3-5-haiku-20241022")`
- **添加暗黑模式切换**：引入 `next-themes`，在 `app/layout.tsx` 中包裹 `ThemeProvider`
- **保存历史简报**：在 Supabase 添加 `briefs` 表，在 `BriefPanel.tsx` 的 `onFinish` 中调用 Server Action 保存
