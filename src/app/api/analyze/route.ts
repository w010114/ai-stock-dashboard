import { NextResponse } from "next/server";
import client from "@/lib/openai";
import supabase from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { symbol, price, change } = await request.json();

    if (!symbol || price == null || change == null) {
      return NextResponse.json(
        { error: "symbol, price, and change are required" },
        { status: 400 }
      );
    }

    const changePercent = price - change > 0
      ? ((change / (price - change)) * 100).toFixed(2)
      : "0.00";

    const prompt = `You are a professional stock analyst. Analyze this stock:

Symbol: ${symbol}
Current Price: $${price}
Change: $${change} (${changePercent}%)

Provide a detailed analysis covering these aspects:
1. Price trend and momentum
2. Key technical levels (support/resistance)
3. Market sentiment drivers
4. Risk factors to watch
5. Short-term outlook (1-4 weeks)

Return ONLY valid JSON (no markdown, no code fences, no extra text):
{
  "summary": "<a concise 1-2 sentence overall assessment>",
  "sentiment": "Bullish" | "Neutral" | "Bearish",
  "risk_level": "Low" | "Medium" | "High",
  "points": [
    "<Trend & Momentum: brief analysis>",
    "<Technical Levels: key support and resistance>",
    "<Market Drivers: what's moving the stock>",
    "<Risk Factors: what to watch out for>",
    "<Outlook: short-term expectation>"
  ]
}`;

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = response.choices[0].message.content?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);

    const sentiment = ["Bullish", "Neutral", "Bearish"].includes(result.sentiment)
      ? result.sentiment
      : "Neutral";

    const risk_level = ["Low", "Medium", "High"].includes(result.risk_level)
      ? result.risk_level
      : "Medium";

    const points = Array.isArray(result.points) ? result.points : [];

    const analysis = {
      symbol,
      price,
      change,
      summary: result.summary ?? "",
      sentiment,
      risk_level,
      points,
    };

    const { error: dbError } = await supabase.from("analyses").insert(analysis);
    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
