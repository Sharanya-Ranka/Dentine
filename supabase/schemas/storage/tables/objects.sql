CREATE POLICY "Public Access" ON "storage"."objects"
  FOR ALL
  TO PUBLIC
  USING ((bucket_id = 'clinic-docs'::text))
  WITH CHECK ((bucket_id = 'clinic-docs'::text));
