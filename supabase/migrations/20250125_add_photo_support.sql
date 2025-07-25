-- Add photo_url support to shopping_items table
ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add photo_url support to pantry_items table if it doesn't exist
ALTER TABLE pantry_items 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage buckets for images if they don't exist
-- This needs to be run by a superuser, so we'll handle it programmatically

-- Set up public bucket for pantry images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pantry-images', 'pantry-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public bucket for recipe images  
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up bucket for receipts (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for pantry-images bucket
CREATE POLICY "Pantry images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'pantry-images');

CREATE POLICY "Users can upload pantry images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pantry-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own pantry images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pantry-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own pantry images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pantry-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policies for recipe-images bucket
CREATE POLICY "Recipe images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

CREATE POLICY "Users can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own recipe images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recipe-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own recipe images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create storage policies for receipts bucket (private)
CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add indexes for photo_url fields for better performance
CREATE INDEX IF NOT EXISTS idx_pantry_items_photo_url ON pantry_items(photo_url) WHERE photo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shopping_items_photo_url ON shopping_items(photo_url) WHERE photo_url IS NOT NULL;