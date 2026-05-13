import { NextResponse } from "next/server";
import axios from "axios";

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  try {
    const { data } = await axios.get(BASE_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: API_KEY,
      },
    });

    const quote = data["Global Quote"];
    if (!quote || !quote["05. price"]) {
      return NextResponse.json({ error: "Invalid symbol or API limit reached" }, { status: 404 });
    }

    return NextResponse.json({
      symbol: quote["01. symbol"],
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}
