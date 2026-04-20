-- ============================================
-- MomentLog Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  description      TEXT NOT NULL,
  tags             TEXT[] DEFAULT '{}',
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS activities_user_date_idx ON activities(user_id, date DESC);
CREATE INDEX IF NOT EXISTS activities_user_created_idx ON activities(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access their own activities
CREATE POLICY "Users can read their own activities"
  ON activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  USING (auth.uid() = user_id);
