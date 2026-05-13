# AI Stock Dashboard

AI 驱动的股票分析面板，输入股票代码获取实时行情，通过 DeepSeek LLM 生成分析报告，结果存入 Supabase。

## 在线访问

> 部署后填入 Render.com URL

## 技术栈

- **前端**: Next.js 16 (App Router) + Tailwind CSS
- **后端**: Next.js API Routes
- **AI**: DeepSeek API (OpenAI SDK 兼容)
- **数据库**: Supabase
- **行情数据**: Alpha Vantage API

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts   # POST 分析 + GET 历史
│   │   └── stock/route.ts     # GET 行情数据
│   ├── layout.tsx
│   └── page.tsx               # 前端页面（单文件）
├── components/                # 预留组件目录
└── lib/
    ├── openai.ts              # DeepSeek client
    ├── supabase.ts            # Supabase client
    └── types.ts               # 共享类型
schema.sql                     # Supabase 建表 SQL
```

## 本地运行

```bash
npm install
cp .env.example .env.local  # 填入你的 API Key
npx next dev
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API Key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |

## Prompt 设计：强制 LLM 输出 JSON

```typescript
const prompt = `Analyze this stock:
- Symbol: ${symbol}
- Price: $${price}
- Change: $${change}

Return only valid JSON (no markdown, no code fences):
{
  "summary": "<one sentence analysis>",
  "sentiment": "Bullish | Neutral | Bearish",
  "risk_level": "Low | Medium | High"
}`;
```

**策略**：
1. 明确指令 "Return only valid JSON (no markdown, no code fences)" 禁止 LLM 包裹 markdown 或啰嗦文本
2. 直接在 prompt 中给出 JSON 模板，降低模型自由发挥空间
3. 接口层用正则 `/\{[\s\S]*\}/` 提取 JSON，即使模型加了多余文字也能解析
4. 返回值做枚举校验：sentiment 和 risk_level 只接受白名单值，其他一律用默认值兜底

## LLM 返回格式

```json
{
  "symbol": "AAPL",
  "price": 195.20,
  "change": 1.35,
  "summary": "Apple shows strong bullish momentum...",
  "sentiment": "Bullish",
  "risk_level": "Low"
}
```

## Debug 记录

### 问题：import `@/lib/supabase` 报 Module not found

**现象**：运行 `next build` 时，`src/app/api/analyze/route.ts` 中 `import supabase from "@/lib/supabase"` 构建失败，提示 `Can't resolve '@/lib/supabase'`。

**排查**：
1. 确认文件 `src/lib/supabase.ts` 存在
2. 检查 `tsconfig.json` 中的 `paths` 配置

**根因**：项目使用 `create-next-app --no-src-dir` 创建时，`tsconfig.json` 中 `@/*` 映射为 `["./*"]`（项目根目录）。后来手动创建 `src/` 目录并把所有源码迁入，但路径别名未更新。

**修复**：将 `tsconfig.json` 中：
```json
"@/*": ["./*"]  →  "@/*": ["./src/*"]
```

**教训**：当项目目录结构变化（如引入 `src/`）时，需同步更新 TypeScript 的 path aliases 配置。
