"use client";

import { useState, useCallback } from "react";
import type { Analysis } from "@/lib/types";
import ParticleBackground from "@/components/ParticleBackground";
import AnimatedNumber from "@/components/AnimatedNumber";

interface StockData {
  symbol: string;
  price: number;
  change: number;
}

/* ===== Mini sparkline (decorative SVG) ===== */
function Sparkline({ up }: { up: boolean }) {
  const points = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    const trend = up ? t * 30 : -t * 30;
    const noise = Math.sin(t * 8) * 8 + Math.cos(t * 5) * 6;
    return { x: (i / 19) * 100, y: 50 - trend - noise };
  });
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${d} L100,60 L0,60 Z`;
  const color = up ? "#10b981" : "#ef4444";

  return (
    <svg viewBox="0 0 100 65" className="w-20 h-8 opacity-60" preserveAspectRatio="none">
      <path d={areaD} fill={color} fillOpacity={0.1} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ===== Badges ===== */
function SentimentBadge({ value, delay = 0 }: { value: string; delay?: number }) {
  const map: Record<string, { colors: string; icon: string; label: string }> = {
    Bullish: {
      colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: "🚀",
      label: "Bullish",
    },
    Bearish: {
      colors: "bg-red-500/10 text-red-400 border-red-500/30",
      icon: "🐻",
      label: "Bearish",
    },
    Neutral: {
      colors: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      icon: "⚖️",
      label: "Neutral",
    },
  };
  const m = map[value] ?? map.Neutral;
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${m.colors} animate-fade-in-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      {m.icon} {m.label}
    </span>
  );
}

function RiskBadge({ value, delay = 0 }: { value: string; delay?: number }) {
  const map: Record<string, { colors: string; icon: string }> = {
    Low: { colors: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: "🟢" },
    Medium: { colors: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: "🟡" },
    High: { colors: "bg-red-500/10 text-red-400 border-red-500/30", icon: "🔴" },
  };
  const m = map[value] ?? map.Medium;
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${m.colors} animate-fade-in-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      {m.icon} Risk: {value}
    </span>
  );
}

/* ===== Shimmer skeleton ===== */
function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-shimmer overflow-hidden" />
      <div className="h-48 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-shimmer overflow-hidden" />
    </div>
  );
}

/* ===== Floating orbs (decorative) ===== */
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div
        className="absolute top-[15%] left-[10%] w-72 h-72 bg-blue-600/6 rounded-full blur-[100px] animate-float"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-[50%] right-[5%] w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] animate-float"
        style={{ animationDelay: "-2s" }}
      />
      <div
        className="absolute bottom-[10%] left-[30%] w-64 h-64 bg-purple-600/6 rounded-full blur-[100px] animate-float"
        style={{ animationDelay: "-4s" }}
      />
    </div>
  );
}

export default function Home() {
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stock, setStock] = useState<StockData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [showSparkline, setShowSparkline] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/analyze");
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStock(null);
    setAnalysis(null);
    setShowSparkline(false);
    setLoading(true);

    try {
      const stockRes = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
      if (!stockRes.ok) {
        const err = await stockRes.json();
        throw new Error(err.error || "Failed to fetch stock");
      }
      const stockData: StockData = await stockRes.json();
      setStock(stockData);
      setTimeout(() => setShowSparkline(true), 100);

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

  const isUp = stock ? stock.change >= 0 : true;

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 relative overflow-hidden">
      {/* Background layers */}
      <FloatingOrbs />
      <ParticleBackground />

      <div className="relative max-w-2xl mx-auto px-6 py-12 space-y-8" style={{ zIndex: 1 }}>
        {/* ===== Header ===== */}
        <header className="text-center space-y-3 pt-4">
          <h1 className="text-5xl font-black tracking-tight animate-fade-in">
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">
              AI Stock Dashboard
            </span>
          </h1>
          <p className="text-zinc-500 text-sm flex items-center justify-center gap-2 animate-fade-in delay-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-blink" />
            DeepSeek-powered real-time analysis
          </p>
        </header>

        {/* ===== Search ===== */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 animate-fade-in-up delay-200"
        >
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full h-12 pl-11 pr-5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/15 text-white placeholder-zinc-500 transition-all duration-300"
              placeholder="Enter stock symbol"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="relative h-12 px-7 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 active:scale-95 btn-shimmer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing
              </span>
            ) : (
              "Analyze"
            )}
          </button>
        </form>

        {/* ===== Error ===== */}
        {error && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-sm animate-fade-in">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* ===== Loading skeleton ===== */}
        {loading && !stock && <Skeleton />}

        {/* ===== Stock Card ===== */}
        {stock && (
          <div
            className={`p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl backdrop-blur-sm card-lift animate-fade-in-up ${isUp ? "price-up" : "price-down"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em]">
                Stock Data
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Live</span>
              </div>
            </div>

            <div className="flex items-end justify-between flex-wrap gap-4">
              <div className="flex items-end gap-5">
                <span className="text-5xl font-black tracking-tight">{stock.symbol}</span>
                <div className="flex items-baseline gap-3">
                  <AnimatedNumber
                    value={stock.price}
                    prefix="$"
                    decimals={2}
                    className="text-4xl font-mono font-bold tracking-tight tabular-nums"
                  />
                  <AnimatedNumber
                    value={stock.change}
                    decimals={2}
                    className={`text-lg font-semibold tabular-nums ${
                      isUp ? "text-emerald-400" : "text-red-400"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {showSparkline && <Sparkline up={isUp} />}
                <div
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                    isUp
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  <span className="animate-slide-in-right inline-block">
                    {isUp ? "▲" : "▼"}{" "}
                    {stock.price > 0
                      ? Math.abs(
                          (stock.change / (stock.price - stock.change)) * 100
                        ).toFixed(2)
                      : "0.00"}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Analysis Card ===== */}
        {analysis && (
          <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl backdrop-blur-sm gradient-border animate-fade-in-up">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-5">
              AI Analysis
            </h2>

            {/* Badges */}
            <div className="flex gap-3 mb-5">
              <SentimentBadge value={analysis.sentiment} delay={0.1} />
              <RiskBadge value={analysis.risk_level} delay={0.2} />
            </div>

            {/* Summary */}
            <p className="text-zinc-200 leading-relaxed mb-6 pb-6 border-b border-white/[0.06] animate-fade-in-up delay-300">
              {analysis.summary}
            </p>

            {/* Analysis points */}
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
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 animate-fade-in-up card-lift"
                    style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                  >
                    <span className="text-base shrink-0 mt-0.5">{icons[i]}</span>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        {labels[i]}
                      </span>
                      <p className="text-sm text-zinc-300 leading-relaxed mt-1">{point}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== History ===== */}
        {history.length > 0 && (
          <div className="space-y-2 animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em]">
                History
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
              <span className="text-[10px] text-zinc-600">{history.length} records</span>
            </div>
            <div className="space-y-2">
              {history.map((item, i) => (
                <div
                  key={item.id}
                  className="group p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center justify-between hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-200 card-lift animate-fade-in-up"
                  style={{ animationDelay: `${0.05 * i}s` }}
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

        {/* ===== Empty state ===== */}
        {!loading && !stock && history.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-6 animate-float">📈</div>
            <p className="text-zinc-400 text-lg font-medium">Enter a stock symbol to get started</p>
            <p className="text-zinc-600 text-sm mt-2">
              Try <button onClick={() => setSymbol("AAPL")} className="text-blue-400 hover:text-blue-300 transition-colors">AAPL</button>,{" "}
              <button onClick={() => setSymbol("TSLA")} className="text-blue-400 hover:text-blue-300 transition-colors">TSLA</button>, or{" "}
              <button onClick={() => setSymbol("GOOGL")} className="text-blue-400 hover:text-blue-300 transition-colors">GOOGL</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
