"use client";

import { useState, useEffect, useCallback } from "react";
import type { Analysis } from "@/lib/types";

interface StockData {
  symbol: string;
  price: number;
  change: number;
}

function SentimentBadge({ value }: { value: string }) {
  const colors =
    value === "Bullish"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : value === "Bearish"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors}`}>
      {value}
    </span>
  );
}

function RiskBadge({ value }: { value: string }) {
  const colors =
    value === "Low"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : value === "High"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors}`}>
      Risk: {value}
    </span>
  );
}

export default function Home() {
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stock, setStock] = useState<StockData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/analyze");
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStock(null);
    setAnalysis(null);
    setLoading(true);

    try {
      const stockRes = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
      if (!stockRes.ok) {
        const err = await stockRes.json();
        throw new Error(err.error || "Failed to fetch stock");
      }
      const stockData: StockData = await stockRes.json();
      setStock(stockData);

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData),
      });
      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "Failed to analyze");
      }
      const analysisData: Analysis = await analyzeRes.json();
      setAnalysis(analysisData);
      loadHistory();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              AI Stock Dashboard
            </span>
          </h1>
          <p className="text-zinc-500 text-sm">DeepSeek-powered stock analysis</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full h-12 px-5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-zinc-500 transition-all"
              placeholder="Enter stock symbol"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading
              </span>
            ) : (
              "Analyze"
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !stock && (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-white/[0.03] border border-white/[0.06] rounded-2xl" />
            <div className="h-40 bg-white/[0.03] border border-white/[0.06] rounded-2xl" />
          </div>
        )}

        {/* Stock Card */}
        {stock && (
          <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl backdrop-blur-sm hover:border-white/[0.1] transition-all duration-300">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              Stock Data
            </h2>
            <div className="flex items-end justify-between">
              <div className="flex items-end gap-4">
                <span className="text-4xl font-extrabold tracking-tight">
                  {stock.symbol}
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-mono font-bold tracking-tight tabular-nums">
                    ${stock.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-lg font-semibold tabular-nums ${
                      stock.change >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {stock.change >= 0 ? "+" : ""}
                    {stock.change.toFixed(2)}
                  </span>
                </div>
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                  stock.change >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {stock.change >= 0 ? "↑" : "↓"}{" "}
                {stock.price > 0
                  ? Math.abs((stock.change / (stock.price - stock.change)) * 100).toFixed(2)
                  : "0.00"}
                %
              </div>
            </div>
          </div>
        )}

        {/* Analysis Card */}
        {analysis && (
          <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl backdrop-blur-sm hover:border-white/[0.1] transition-all duration-300">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
              AI Analysis
            </h2>
            <div className="flex gap-3 mb-5">
              <SentimentBadge value={analysis.sentiment} />
              <RiskBadge value={analysis.risk_level} />
            </div>
            <p className="text-zinc-200 leading-relaxed mb-6 pb-6 border-b border-white/[0.06]">
              {analysis.summary}
            </p>
            <div className="space-y-3">
              {analysis.points.map((point, i) => {
                const icons = ["📊", "📐", "📰", "⚠️", "🔮"];
                const labels = [
                  "Trend & Momentum",
                  "Technical Levels",
                  "Market Drivers",
                  "Risk Factors",
                  "Outlook",
                ];
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-base shrink-0">{icons[i]}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-500">{labels[i]}</span>
                      <p className="text-sm text-zinc-300 leading-relaxed mt-0.5">{point}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                History
              </h2>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center justify-between hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-200"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-sm font-bold tracking-tight shrink-0">
                      {item.symbol}
                    </span>
                    <span className="text-zinc-500 text-sm truncate hidden sm:block">
                      {item.summary}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <SentimentBadge value={item.sentiment} />
                    <RiskBadge value={item.risk_level} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !stock && history.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📈</div>
            <p className="text-zinc-500">Enter a stock symbol to get started</p>
            <p className="text-zinc-600 text-sm mt-1">Try AAPL, TSLA, or GOOGL</p>
          </div>
        )}
      </div>
    </div>
  );
}
