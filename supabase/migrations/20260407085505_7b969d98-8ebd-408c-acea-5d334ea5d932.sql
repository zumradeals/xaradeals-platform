
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog_images', 'blog_images', true);

CREATE POLICY "Blog images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog_images');

CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog_images' AND public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog_images' AND public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog_images' AND public.has_role(auth.uid(), 'ADMIN'));
