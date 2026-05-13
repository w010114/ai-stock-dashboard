"use client";

import { useState, useEffect, useCallback } from "react";
import type { Analysis } from "@/lib/types";

interface StockData {
  symbol: string;
  price: number;
  change: number;
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">AI Stock Dashboard</h1>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-blue-500 text-white"
            placeholder="Enter stock symbol"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {loading ? "Loading..." : "Analyze"}
          </button>
        </form>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-zinc-400">Fetching data...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {stock && (
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Stock Data
            </h2>
            <div className="flex items-end gap-4">
              <span className="text-3xl font-bold">{stock.symbol}</span>
              <span className="text-3xl font-mono">${stock.price.toFixed(2)}</span>
              <span
                className={`text-lg font-medium ${
                  stock.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stock.change >= 0 ? "+" : ""}
                {stock.change.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {analysis && (
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
              AI Analysis
            </h2>
            <p className="text-lg mb-4">{analysis.summary}</p>
            <div className="flex gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.sentiment === "Bullish"
                    ? "bg-green-900/40 text-green-400"
                    : analysis.sentiment === "Bearish"
                    ? "bg-red-900/40 text-red-400"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {analysis.sentiment}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.risk_level === "Low"
                    ? "bg-green-900/40 text-green-400"
                    : analysis.risk_level === "High"
                    ? "bg-red-900/40 text-red-400"
                    : "bg-yellow-900/40 text-yellow-400"
                }`}
              >
                Risk: {analysis.risk_level}
              </span>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              History
            </h2>
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <span className="font-bold mr-2">{item.symbol}</span>
                  <span className="text-zinc-400 text-sm">{item.summary}</span>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.sentiment === "Bullish"
                        ? "bg-green-900/40 text-green-400"
                        : item.sentiment === "Bearish"
                        ? "bg-red-900/40 text-red-400"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {item.sentiment}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.risk_level === "Low"
                        ? "bg-green-900/40 text-green-400"
                        : item.risk_level === "High"
                        ? "bg-red-900/40 text-red-400"
                        : "bg-yellow-900/40 text-yellow-400"
                    }`}
                  >
                    {item.risk_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
