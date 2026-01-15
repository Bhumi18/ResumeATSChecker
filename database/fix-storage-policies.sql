-- Fix Supabase Storage Policies for Resumes Bucket
-- Run this in Supabase SQL Editor to allow file uploads

-- Enable public access for uploads (since we're using Clerk auth, not Supabase auth)
-- Note: Files are still access-controlled by your application logic

-- Allow INSERT (upload) for authenticated users
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'resumes');

-- Allow SELECT (download) for authenticated users
CREATE POLICY IF NOT EXISTS "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'resumes');

-- Allow UPDATE for authenticated users
CREATE POLICY IF NOT EXISTS "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'resumes');

-- Allow DELETE for authenticated users
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id = 'resumes');
