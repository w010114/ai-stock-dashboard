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

    const analysis = {
      symbol,
      price,
      change,
      summary: result.summary ?? "",
      sentiment,
      risk_level,
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
