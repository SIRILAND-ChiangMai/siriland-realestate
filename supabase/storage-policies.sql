-- Önce Supabase Storage içinde property-images isimli private bucket oluştur.
create policy "authenticated can view property images" on storage.objects for select to authenticated using(bucket_id='property-images');
create policy "authenticated can upload property images" on storage.objects for insert to authenticated with check(bucket_id='property-images' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "owner can update own uploaded files" on storage.objects for update to authenticated using(bucket_id='property-images' and owner_id=auth.uid()::text);
create policy "owner can delete own uploaded files" on storage.objects for delete to authenticated using(bucket_id='property-images' and owner_id=auth.uid()::text);
