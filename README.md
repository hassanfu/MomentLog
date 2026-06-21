# MomentLog — 记录当下，洞见未来

个人活动记录 + AI 周期回顾的 Web 应用。

**当前形态**：纯本地演示版。所有记录与简报存档都保存在浏览器
`localStorage` 中，不需要登录，不连后端数据库。AI 简报继续走
DeepSeek（OpenAI 兼容接口）。

**技术栈**：Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 ·
Shadcn/UI · Vercel AI SDK + DeepSeek

---

## 快速开始

```bash
git clone <your-repo>
cd momentlog
npm install
cp .env.example .env.local   # 填入 DEEPSEEK_API_KEY
npm run dev
```

打开 <http://localhost:3001>（`npm run dev` 默认端口 3001），即可
直接进入首页，无需登录。

> 没有 `DEEPSEEK_API_KEY` 也能正常打开主界面、记录活动；只是
> 「AI 简报」tab 会返回 503，提示未配置密钥。

---

## 数据存在哪里

| 内容 | 存储位置 | localStorage key |
|------|----------|-------------------|
| 活动记录 | 当前浏览器 | `momentlog:activities:v1` |
| 已保存的简报 | 当前浏览器 | `momentlog:saved-briefs:v1` |

换浏览器、换设备、清缓存 / 隐身窗口 都会丢失数据。
两个 tab 之间通过 `storage` 事件实时同步。

---

## 部署到 Vercel

```bash
npm i -g vercel
vercel --prod
```

只需在 Vercel → Settings → Environment Variables 配置一个变量：

| 变量 | 来源 |
|------|------|
| `DEEPSEEK_API_KEY` | <https://platform.deepseek.com/api_keys> |

也可以本机已经 `npx vercel link` 之后运行：

```bash
npm run vercel:push-deepseek
```

会把 `.env.local` 里的 `DEEPSEEK_API_KEY` 同步到 Vercel 的
Production / Preview / Development 三套环境。

---

## 功能一览

| 功能 | 描述 |
|------|------|
| ✍️ 快速记录 | 描述、标签、时长，本地保存即写即用 |
| 📅 时间线 | 日 / 周 / 月 / 年视图，带导航 |
| 🤖 AI 简报 | 今日 / 本周 / 本月 / 本年，流式输出 + 保存草稿 |
| 📊 仪表盘 | 活跃度热力图、记录数 / 标签数 / 活跃天数 |
| 🌗 主题切换 | 浅 / 深主题持久化在浏览器 |

---

## 关键源码索引

- `lib/local-store/activities.ts` — 活动记录的 localStorage CRUD、
  时间线 / 热力图 / 侧栏统计的派生计算、跨标签订阅。
- `lib/local-store/saved-briefs.ts` — 已保存简报的 localStorage CRUD。
- `app/api/brief/route.ts` — DeepSeek 调用入口；无状态，
  活动数据由客户端在请求体中传入。
- `lib/prompts.ts` — 简报 Prompt 模板。
- `components/dashboard/HomeDashboard.tsx` — 首页 tab 切换与本地数据注水。
- `proxy.ts` — Next 中间件，把旧版 `/login` `/callback` `/activities`
  `/briefs` 路径重定向到当前的 tab。
