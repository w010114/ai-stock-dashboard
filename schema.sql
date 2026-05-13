-- Run this SQL in your Supabase SQL Editor to create the analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change NUMERIC NOT NULL,
  summary TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for demo purposes)
CREATE POLICY "Allow public insert" ON analyses
  FOR INSERT WITH CHECK (true);

-- Allow public reads
CREATE POLICY "Allow public select" ON analyses
  FOR SELECT USING (true);
