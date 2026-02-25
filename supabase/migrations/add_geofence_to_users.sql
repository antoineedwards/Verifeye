-- Migration: Add geofence_id column to next_auth.users
-- and create the find_geofence_by_point RPC function.
--
-- Run this in the Supabase SQL Editor BEFORE deploying the app changes.

-- 1. Add geofence_id column to next_auth.users
ALTER TABLE next_auth.users
ADD COLUMN IF NOT EXISTS geofence_id UUID REFERENCES public.geofences(id);

-- 2. Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_geofence_id ON next_auth.users(geofence_id);

-- 3. Create the RPC function that finds which geofence contains a given point.
-- This uses PostGIS ST_Contains to check if the lat/lon falls within a geofence polygon.
CREATE OR REPLACE FUNCTION public.find_geofence_by_point(lat DOUBLE PRECISION, long DOUBLE PRECISION)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id
  FROM public.geofences
  WHERE ST_Contains(
    boundary,
    ST_SetSRID(ST_MakePoint(long, lat), 4326)
  )
  LIMIT 1;
$$;
