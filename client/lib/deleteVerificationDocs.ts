// src/lib/deleteVerificationDocs.ts
import { supabase } from '@/lib/supabase/client';

export async function deleteUserVerificationDocs(userId: string) {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('verifications')
      .list(userId);

    if (listError || !files || files.length === 0) {
      return { success: true, deleted: 0 };
    }

    const filePaths = files.map((f) => `${userId}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from('verifications')
      .remove(filePaths);

    if (deleteError) throw deleteError;

    await supabase
      .from('verifications')
      .update({
        documents_deleted: true,
        documents_deleted_at: new Date().toISOString(),
        cac_document_url: null,
        nepc_document_url: null,
        id_document_url: null,
      })
      .eq('user_id', userId);

    return { success: true, deleted: filePaths.length };
  } catch (err) {
    console.error('Delete docs error:', err);
    return { success: false, error: err };
  }
}