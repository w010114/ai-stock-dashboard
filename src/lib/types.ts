export interface StockData {
  symbol: string;
  price: number;
  change: number;
}

export interface Analysis {
  id?: number;
  symbol: string;
  price: number;
  change: number;
  summary: string;
  sentiment: "Bullish" | "Neutral" | "Bearish";
  risk_level: "Low" | "Medium" | "High";
  points: string[];
  created_at?: string;
}
