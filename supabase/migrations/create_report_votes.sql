-- Create report_votes table
CREATE TABLE IF NOT EXISTS public.report_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL,
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('confirm', 'dispute')),
    UNIQUE (user_id, report_id)
);

-- Grant permissions to service_role (the key used by the server actions)
GRANT ALL ON public.report_votes TO service_role;

-- Grant permissions to authenticated users (needed if RLS is enabled)
GRANT SELECT, INSERT ON public.report_votes TO authenticated;

-- Enable RLS
ALTER TABLE public.report_votes ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own votes
CREATE POLICY "Users can read own votes"
    ON public.report_votes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: users can insert their own votes
CREATE POLICY "Users can insert own votes"
    ON public.report_votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: service_role can do everything (bypasses RLS by default, but explicit for clarity)
-- Note: service_role already bypasses RLS, so no policy is strictly needed for it.
