-- Migration: Add geofence_id to reports table
-- This links each report to the geofence it belongs to,
-- enabling per-neighborhood report filtering.
--
-- Run this in the Supabase SQL Editor.

-- 1. Add geofence_id column to reports
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS geofence_id UUID REFERENCES public.geofences(id);

-- 2. Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_reports_geofence_id ON public.reports(geofence_id);
